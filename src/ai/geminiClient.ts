import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { config } from '../config';
import { AppError } from '../common/errors';
import { execute } from '../database/db';

export interface GeminiAnalysisOutput {
  genuine_score: number;
  obvious_junk: boolean;
  photo_matches_category: boolean;
  photo_matches_description: boolean;
  genuine_reasoning: string;
  suggested_category_slug: string;
  category_confidence: number;
  severity_score: number;
  severity_reasoning: string;
  budget_min: number;
  budget_max: number;
  budget_reasoning: string;
  easy_to_fix: boolean;
  summary: string;
}

export interface RequestContext {
  requestId: number;
  categoryName: string;
  categorySlug: string;
  description: string;
  latitude: number;
  longitude: number;
  addressText: string;
  photos: Array<{ url: string; mimeType: string; filePath?: string }>;
  categoriesList: string;
}

export interface GeminiClient {
  analyzeRequest(context: RequestContext): Promise<GeminiAnalysisOutput>;
  transcribe(audioBuffer: Buffer, mime: string): Promise<string>;
}

export class MockGeminiClient implements GeminiClient {
  async analyzeRequest(context: RequestContext): Promise<GeminiAnalysisOutput> {
    const desc = (context.description || '').toLowerCase();

    // Trigger AI failure simulation if requested in test
    if (desc.includes('force_ai_failure')) {
      throw new Error('Simulated Gemini API timeout / connection failure');
    }

    // Trigger obvious junk simulation
    if (desc.includes('obvious spam') || desc.includes('fake meme junk')) {
      return {
        genuine_score: 0.05,
        obvious_junk: true,
        photo_matches_category: false,
        photo_matches_description: false,
        genuine_reasoning: 'Obvious spam or test payload detected.',
        suggested_category_slug: context.categorySlug,
        category_confidence: 0.1,
        severity_score: 5,
        severity_reasoning: 'Non-civic issue.',
        budget_min: 0,
        budget_max: 0,
        budget_reasoning: 'No repair needed.',
        easy_to_fix: false,
        summary: 'Spam or junk content detected.',
      };
    }

    // Default mock response for genuine civic issue
    return {
      genuine_score: 0.92,
      obvious_junk: false,
      photo_matches_category: true,
      photo_matches_description: true,
      genuine_reasoning: 'Photographic evidence matches reported civic issue and location.',
      suggested_category_slug: context.categorySlug,
      category_confidence: 0.95,
      severity_score: 65,
      severity_reasoning: 'Presents hazard to traffic and pedestrians.',
      budget_min: 2500,
      budget_max: 8000,
      budget_reasoning: 'Standard asphalt patching and labor required.',
      easy_to_fix: false,
      summary: context.description ? context.description.substring(0, 200) : 'Civic issue report',
    };
  }

  async transcribe(audioBuffer: Buffer, mime: string): Promise<string> {
    return 'Simulated voice transcription: There is a serious water pipe leakage on Main Road.';
  }
}

export class GoogleGenAiClient implements GeminiClient {
  private ai: GoogleGenAI;
  private promptTemplate: string;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: config.gemini.apiKey });
    const promptPath = path.join(__dirname, 'prompts', 'genuineness_v1.txt');
    this.promptTemplate = fs.existsSync(promptPath)
      ? fs.readFileSync(promptPath, 'utf-8')
      : '';
  }

  async analyzeRequest(context: RequestContext): Promise<GeminiAnalysisOutput> {
    const prompt = this.promptTemplate
      .replace('{{categoriesList}}', context.categoriesList)
      .replace('{{categoryName}}', context.categoryName)
      .replace('{{categorySlug}}', context.categorySlug)
      .replace('{{latitude}}', String(context.latitude))
      .replace('{{longitude}}', String(context.longitude))
      .replace('{{addressText}}', context.addressText || 'N/A')
      .replace('{{description}}', context.description || 'Voice report');

    const contents: any[] = [{ text: prompt }];

    // Attach inline photo images if available on disk
    for (const photo of context.photos) {
      if (photo.filePath && fs.existsSync(photo.filePath)) {
        const fileBuffer = fs.readFileSync(photo.filePath);
        contents.push({
          inlineData: {
            mimeType: photo.mimeType,
            data: fileBuffer.toString('base64'),
          },
        });
      }
    }

    // Call Gemini with retries and exponential backoff
    let lastError: any = null;
    const maxRetries = config.gemini.maxRetries;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.ai.models.generateContent({
          model: config.gemini.model,
          contents,
          config: {
            responseMimeType: 'application/json',
          },
        });

        const text = response.text || '';
        const parsed: GeminiAnalysisOutput = JSON.parse(text);

        // Validate basic schema
        if (
          typeof parsed.genuine_score !== 'number' ||
          typeof parsed.obvious_junk !== 'boolean' ||
          typeof parsed.severity_score !== 'number'
        ) {
          throw new Error('Gemini response did not conform to expected schema');
        }

        return parsed;
      } catch (err: any) {
        lastError = err;
        if (attempt < maxRetries) {
          const delayMs = attempt === 0 ? 1000 : 3000;
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }

    throw lastError || new Error('Gemini analysis failed after retries');
  }

  async transcribe(audioBuffer: Buffer, mime: string): Promise<string> {
    const response = await this.ai.models.generateContent({
      model: config.gemini.model,
      contents: [
        {
          inlineData: {
            mimeType: mime,
            data: audioBuffer.toString('base64'),
          },
        },
        {
          text: 'Transcribe this civic issue voice report into plain text English or Hindi accurately without commentary.',
        },
      ],
    });

    return response.text ? response.text.trim() : '';
  }
}

let geminiClientInstance: GeminiClient | null = null;

export function getGeminiClient(): GeminiClient {
  if (!geminiClientInstance) {
    if (config.gemini.apiKey && config.gemini.apiKey.trim().length > 0) {
      geminiClientInstance = new GoogleGenAiClient();
    } else {
      geminiClientInstance = new MockGeminiClient();
    }
  }
  return geminiClientInstance;
}

export async function logAiAnalysis(
  requestId: number,
  task: string,
  model: string,
  outputJson: any,
  latencyMs: number,
  success: boolean,
  errorMessage: string | null = null
) {
  await execute(
    `INSERT INTO ai_analyses (request_id, task, model, output_json, latency_ms, success, error_message, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      requestId,
      task,
      model,
      outputJson ? JSON.stringify(outputJson) : null,
      latencyMs,
      success,
      errorMessage,
    ]
  );
}
