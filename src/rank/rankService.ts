import { query, execute } from '../database/db';
import { config } from '../config';

export class RankService {
  async recalculateNgoRank(ngoId: number): Promise<number> {
    const ngos = await query<any[]>('SELECT * FROM ngos WHERE id = ?', [ngoId]);
    if (ngos.length === 0) return 0;
    const ngo = ngos[0];

    // 1. Verified completed count (only admin-CLOSED requests where this NGO completed work)
    const [compRows]: any = await query(
      `SELECT COUNT(DISTINCT r.id) as totalCompleted,
              COALESCE(AVG(TIMESTAMPDIFF(SECOND, cl.claimed_at, r.closed_at) / 3600.0), 0) as avgHours
       FROM requests r
       JOIN ngo_claims cl ON cl.request_id = r.id
       WHERE cl.ngo_id = ? AND r.status = 'CLOSED'`,
      [ngoId]
    );

    const verifiedCompletedCount = Number(compRows.totalCompleted);
    const avgActualHours = Number(compRows.avgHours);

    // 2. Average rating (1-5 stars)
    const [ratingRows]: any = await query(
      'SELECT COALESCE(AVG(stars), 0) as avgRating FROM ratings WHERE ngo_id = ?',
      [ngoId]
    );
    const avgRating = Number(ratingRows.avgRating);

    // 3. Speed score (0-1): min(1.0, expected_resolution_hours / avg_actual_hours)
    // Fetch average expected resolution hours of categories handled by this NGO
    const [catExpectRows]: any = await query(
      `SELECT COALESCE(AVG(c.expected_resolution_hours), 48) as expectedHours
       FROM requests r
       JOIN categories c ON r.category_id = c.id
       JOIN ngo_claims cl ON cl.request_id = r.id
       WHERE cl.ngo_id = ? AND r.status = 'CLOSED'`,
      [ngoId]
    );
    const expectedHours = Number(catExpectRows.expectedHours);
    const speedScore =
      avgActualHours > 0 ? Math.min(1.0, expectedHours / avgActualHours) : 1.0;

    // 4. Abandonment count
    const abandonmentCount = Number(ngo.abandonment_count) || 0;

    // 5. Rejection rate percent: (rejections / (rejections + claims) * 100)
    const [claimCountRows]: any = await query(
      'SELECT COUNT(*) as totalClaims FROM ngo_claims WHERE ngo_id = ?',
      [ngoId]
    );
    const totalClaims = Number(claimCountRows.totalClaims);
    const totalRejections = Number(ngo.rejection_count) || 0;
    const totalDecisions = totalRejections + totalClaims;
    const rejectionRatePercent =
      totalDecisions > 0 ? (totalRejections / totalDecisions) * 100 : 0;

    // Formula from Section 16:
    // rank_score = w1 * verified_completed_count + w2 * avg_rating + w3 * speed_score - w4 * abandonment_count - w5 * rejection_rate_percent
    const w1 = config.rank.w1; // 1.0
    const w2 = config.rank.w2; // 10
    const w3 = config.rank.w3; // 5
    const w4 = config.rank.w4; // 15
    const w5 = config.rank.w5; // 0.5

    const rawRankScore =
      w1 * verifiedCompletedCount +
      w2 * avgRating +
      w3 * speedScore -
      w4 * abandonmentCount -
      w5 * rejectionRatePercent;

    const rankScore = Math.max(0, Number(rawRankScore.toFixed(3)));

    // Update ngos table
    await execute(
      `UPDATE ngos SET 
        total_completed = ?, 
        avg_rating = ?, 
        avg_resolution_hours = ?, 
        rank_score = ?
       WHERE id = ?`,
      [verifiedCompletedCount, avgRating, avgActualHours, rankScore, ngoId]
    );

    return rankScore;
  }

  async recalculateAllNgos() {
    const ngos = await query<any[]>('SELECT id FROM ngos WHERE deleted_at IS NULL');
    for (const ngo of ngos) {
      await this.recalculateNgoRank(ngo.id);
    }
  }
}

export const rankService = new RankService();
