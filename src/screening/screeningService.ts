import { query, execute } from '../database/db';
import { config } from '../config';
import { getGeminiClient, logAiAnalysis } from '../ai/geminiClient';
import { clusterService } from '../cluster/clusterService';
import { requestStateMachine, RequestStatus } from '../request/requestStateMachine';
import { storageService } from '../storage/storageService';

export class ScreeningService {
  private gemini = getGeminiClient();

  async processRequest(requestId: number) {
    const startTime = Date.now();

    // 1. Fetch request details with photos and category
    const rows = await query<any[]>(
      `SELECT r.*, c.name as categoryName, c.slug as categorySlug,
              c.base_priority as basePriority, c.typical_budget_min as typicalBudgetMin,
              c.typical_budget_max as typicalBudgetMax
       FROM requests r
       JOIN categories c ON r.category_id = c.id
       WHERE r.id = ? LIMIT 1`,
      [requestId]
    );

    if (rows.length === 0) return;
    const req = rows[0];

    // Transition from SUBMITTED -> SCREENING
    await requestStateMachine.transition(requestId, 'SCREENING', { id: null, role: 'SYSTEM' });

    const screeningFlags: string[] = [];

    // 2. Duplicate check & Clustering
    const clusterResult = await clusterService.findAndAttachCluster(
      requestId,
      req.category_id,
      Number(req.latitude),
      Number(req.longitude),
      req.citizen_id
    );

    // 3. Image reuse check
    const photos = await query<any[]>(
      'SELECT id, url, mime_type, sha256, exif_lat, exif_lng FROM request_photos WHERE request_id = ?',
      [requestId]
    );

    for (const photo of photos) {
      const reused = await query<any[]>(
        `SELECT rp.id FROM request_photos rp
         JOIN requests r ON rp.request_id = r.id
         WHERE rp.sha256 = ? AND r.citizen_id != ? AND rp.request_id != ?
         LIMIT 1`,
        [photo.sha256, req.citizen_id, requestId]
      );

      if (reused.length > 0) {
        if (!screeningFlags.includes('IMAGE_REUSED')) {
          screeningFlags.push('IMAGE_REUSED');
        }
      }
    }

    // 4. EXIF vs Pin Distance check
    const maxDistanceMeters = config.screening.exif.maxDistanceMeters; // default 300m
    for (const photo of photos) {
      if (photo.exif_lat !== null && photo.exif_lng !== null) {
        const distRows = await query<any[]>(
          `SELECT ST_Distance_Sphere(
            ST_GeomFromText(?, 4326, 'axis-order=lat-long'),
            ST_GeomFromText(?, 4326, 'axis-order=lat-long')
          ) as distance`,
          [
            `POINT(${req.latitude} ${req.longitude})`,
            `POINT(${photo.exif_lat} ${photo.exif_lng})`,
          ]
        );

        const distance = distRows.length > 0 ? Number(distRows[0].distance) : 0;
        if (distance > maxDistanceMeters) {
          if (!screeningFlags.includes('EXIF_MISMATCH')) {
            screeningFlags.push('EXIF_MISMATCH');
          }
        }
      }
    }

    // 5. Build category list for prompt context
    const allCategories = await query<any[]>(
      'SELECT name, slug, typical_budget_min, typical_budget_max FROM categories WHERE active = TRUE'
    );
    const categoriesList = allCategories
      .map((c) => `- ${c.name} (slug: ${c.slug}, typical budget: ₹${c.typical_budget_min} - ₹${c.typical_budget_max})`)
      .join('\n');

    // 6. Gemini Multimodal Analysis
    let aiOutput: any = null;
    let aiFailed = false;

    try {
      const photoPayload = photos.map((p) => {
        const filename = p.url.split('/').pop() || '';
        return {
          url: p.url,
          mimeType: p.mime_type,
          filePath: storageService.getFilePath(filename),
        };
      });

      aiOutput = await this.gemini.analyzeRequest({
        requestId,
        categoryName: req.categoryName,
        categorySlug: req.categorySlug,
        description: req.description || '',
        latitude: Number(req.latitude),
        longitude: Number(req.longitude),
        addressText: req.address_text || '',
        photos: photoPayload,
        categoriesList,
      });

      const latencyMs = Date.now() - startTime;
      await logAiAnalysis(requestId, 'GENUINENESS', config.gemini.model, aiOutput, latencyMs, true);
    } catch (err: any) {
      aiFailed = true;
      screeningFlags.push('AI_UNAVAILABLE');
      const latencyMs = Date.now() - startTime;
      await logAiAnalysis(
        requestId,
        'GENUINENESS',
        config.gemini.model,
        null,
        latencyMs,
        false,
        err.message
      );
    }

    // 7. Evaluate Decision Status
    let nextStatus: RequestStatus = 'OPEN';
    let suggestedCategoryId: number | null = null;
    let genuineScore: number | null = null;
    let priorityScore: number | null = null;
    let finalPriority: number | null = null;
    let budgetMin: number | null = null;
    let budgetMax: number | null = null;
    let budgetReasoning: string | null = null;
    let summary: string | null = null;
    let isEasy = false;

    if (aiFailed || !aiOutput) {
      nextStatus = 'NEEDS_ADMIN_REVIEW';
      finalPriority = Number(req.basePriority);
    } else {
      genuineScore = aiOutput.genuine_score;
      priorityScore = aiOutput.severity_score;
      budgetMin = aiOutput.budget_min;
      budgetMax = aiOutput.budget_max;
      budgetReasoning = aiOutput.budget_reasoning;
      summary = aiOutput.summary;
      isEasy = !!aiOutput.easy_to_fix;

      // Budget outlier check
      const maxBudget = Number(req.typicalBudgetMax);
      if (budgetMax && maxBudget > 0 && budgetMax > 3 * maxBudget) {
        screeningFlags.push('BUDGET_OUTLIER');
      }

      // Calculate final priority using formula
      finalPriority = clusterService.calculateFinalPriority(
        Number(req.basePriority),
        priorityScore ?? 50,
        clusterResult.clusterSize
      );

      // Category suggestion check
      if (
        aiOutput.suggested_category_slug &&
        aiOutput.suggested_category_slug !== req.categorySlug &&
        aiOutput.category_confidence >= 0.8
      ) {
        const catMatch = await query<any[]>(
          'SELECT id FROM categories WHERE slug = ? LIMIT 1',
          [aiOutput.suggested_category_slug]
        );
        if (catMatch.length > 0) {
          suggestedCategoryId = catMatch[0].id;
        }
      }

      // Decision rules from Section 8:
      // Rule 1: Obvious junk -> REJECTED_FAKE (BOTH conditions required!)
      if (
        genuineScore !== null &&
        genuineScore < config.screening.junkThreshold &&
        aiOutput.obvious_junk === true
      ) {
        nextStatus = 'REJECTED_FAKE';
      }
      // Rule 2: Low score or security flags -> NEEDS_ADMIN_REVIEW
      else if (
        genuineScore === null ||
        genuineScore < config.screening.genuineThreshold ||
        screeningFlags.includes('IMAGE_REUSED') ||
        screeningFlags.includes('EXIF_MISMATCH')
      ) {
        nextStatus = 'NEEDS_ADMIN_REVIEW';
      }
      // Rule 3: All screening layers passed -> OPEN
      else {
        nextStatus = 'OPEN';
      }
    }

    // 8. Update request with computed AI fields
    await execute(
      `UPDATE requests SET 
        ai_genuine_score = ?,
        ai_priority_score = ?,
        final_priority = ?,
        ai_budget_min = ?,
        ai_budget_max = ?,
        ai_budget_reasoning = ?,
        ai_summary = ?,
        ai_easy = ?,
        ai_suggested_category_id = ?,
        screening_flags = ?
       WHERE id = ?`,
      [
        genuineScore,
        priorityScore,
        finalPriority,
        budgetMin,
        budgetMax,
        budgetReasoning,
        summary,
        isEasy,
        suggestedCategoryId,
        JSON.stringify(screeningFlags),
        requestId,
      ]
    );

    // 9. Execute state machine transition
    await requestStateMachine.transition(requestId, nextStatus, { id: null, role: 'SYSTEM' }, {
      note: `Screening completed with outcome: ${nextStatus}. Flags: [${screeningFlags.join(', ')}]`,
    });

    return {
      requestId,
      status: nextStatus,
      flags: screeningFlags,
      finalPriority,
    };
  }

  async checkStuckScreening(): Promise<number> {
    // Scheduled job: Requests in SCREENING for > 10 minutes go to NEEDS_ADMIN_REVIEW
    const stuckRows = await query<any[]>(
      `SELECT id, screening_flags as screeningFlags FROM requests 
       WHERE status = 'SCREENING' 
         AND updated_at <= DATE_SUB(NOW(), INTERVAL 10 MINUTE)`
    );

    for (const r of stuckRows) {
      let flags: string[] = [];
      try {
        flags = typeof r.screeningFlags === 'string' ? JSON.parse(r.screeningFlags) : (r.screeningFlags || []);
      } catch {}
      if (!flags.includes('SCREENING_TIMEOUT')) {
        flags.push('SCREENING_TIMEOUT');
      }

      await execute('UPDATE requests SET screening_flags = ? WHERE id = ?', [
        JSON.stringify(flags),
        r.id,
      ]);

      await requestStateMachine.transition(
        r.id,
        'NEEDS_ADMIN_REVIEW',
        { id: null, role: 'SYSTEM' },
        { note: 'Screening timed out after 10 minutes' }
      );
    }

    return stuckRows.length;
  }
}

export const screeningService = new ScreeningService();
