
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { VoiceName, VideoMetadata, TargetLanguage } from "../types";
import { decode, mergeUint8Arrays } from "../utils/audioUtils";
import { TTS_CHUNK_SIZE, TTS_DELAY_MS, THUMBNAIL_DELAY_MS } from "../constants";

export class GeminiService {
  constructor() {}

  private extractJson(text: string): string {
    if (!text) return "{}";
    try {
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      if (start !== -1 && end !== -1) {
        return text.substring(start, end + 1);
      }
      return text.trim();
    } catch (e) {
      return "{}";
    }
  }

  private async retry<T>(fn: () => Promise<T>, retries = 10, baseDelay = 5000): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      const errorMsg = (error.message || "").toLowerCase();
      const isRetryable = 
        errorMsg.includes("429") || 
        errorMsg.includes("503") ||
        errorMsg.includes("504") ||
        errorMsg.includes("resource_exhausted") || 
        errorMsg.includes("500") || 
        errorMsg.includes("quota") ||
        errorMsg.includes("overloaded") ||
        errorMsg.includes("unavailable") ||
        errorMsg.includes("service unavailable") ||
        errorMsg.includes("deadline_exceeded") ||
        errorMsg.includes("internal error");
      
      if (retries > 0 && isRetryable) {
        const jitter = Math.random() * 3000;
        const delay = baseDelay + jitter;
        console.warn(`ZEGOTECH: API Quota/Server Busy (Error: ${errorMsg}). Retrying in ${(delay / 1000).toFixed(1)}s... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.retry(fn, retries - 1, baseDelay * 1.5);
      }
      throw error;
    }
  }

  private segmentScript(text: string, limit: number): string[] {
    if (!text) return [];
    const segments: string[] = [];
    let current = "";
    const chunks = text.split(/([။၊.!?\n])/);
    
    for (let i = 0; i < chunks.length; i++) {
      const part = chunks[i];
      if ((current.length + part.length) > limit && current.length > 0) {
        segments.push(current.trim());
        current = "";
      }
      current += part;
    }
    if (current.trim()) segments.push(current.trim());
    return segments;
  }

  private getApiKey(): string {
    // 1. Prioritize manual key (per computer/user)
    const manualKey = localStorage.getItem('zegotech_manual_api_key');
    if (manualKey) return manualKey;

    // 2. Fallback to platform/environment key
    return process.env.API_KEY || "";
  }

  async processVideoFull(fileBase64: string, mimeType: string, targetLanguage: TargetLanguage, durationSeconds: number): Promise<{ text: string, metadata: VideoMetadata & { english_filename_base: string } }> {
    return this.retry(async () => {
      const apiKey = this.getApiKey();
      if (!apiKey) throw new Error("API_KEY_MISSING: Please connect your own Gemini API Key to use this service.");
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: {
          parts: [
            { inlineData: { data: fileBase64, mimeType: mimeType } },
            {
              text: `TRANSCRIPTION & ULTRA-ACCURATE TRANSLATION MASTER.
              TARGET LANGUAGE: ${targetLanguage}.
              
              INSTRUCTIONS:
              1. Deeply analyze the audio and visual context.
              2. Translate every spoken word with 100% accuracy.
              3. Maintain the original emotional tone, narrative flow, and character personality.
              4. Ensure the ${targetLanguage} translation sounds natural, professional, and culturally appropriate.
              5. Avoid literal translation where it breaks the story's meaning; prioritize semantic precision.
              6. MANDATORY: Return a complete production package in strict JSON format.
              
              SCHEMA:
              {
                "translatedText": "The full, high-accuracy script in ${targetLanguage}",
                "title": "A viral, professional title in ${targetLanguage}",
                "english_filename_base": "descriptive-english-slug",
                "description": "Engaging marketing description in ${targetLanguage}",
                "tags": ["trending-tag-1", "trending-tag-2", "trending-tag-3", "trending-tag-4", "trending-tag-5"],
                "ass": "Advanced Substation Alpha subtitles with precise timing",
                "srt": "SubRip Subtitle format",
                "vtt": "WebVTT subtitle format"
              }`,
            },
          ],
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              translatedText: { type: Type.STRING },
              title: { type: Type.STRING },
              english_filename_base: { type: Type.STRING },
              description: { type: Type.STRING },
              tags: { type: Type.ARRAY, items: { type: Type.STRING } },
              ass: { type: Type.STRING },
              srt: { type: Type.STRING },
              vtt: { type: Type.STRING }
            },
            required: ["translatedText", "title", "english_filename_base", "description", "tags", "ass", "srt", "vtt"],
          }
        }
      });

      const jsonStr = this.extractJson(response.text || "{}");
      const data = JSON.parse(jsonStr);

      if (!data.translatedText) throw new Error("AI_CORE_EMPTY: High-accuracy script generation failed.");

      return {
        text: data.translatedText,
        metadata: {
          title: data.title,
          english_filename_base: data.english_filename_base,
          description: data.description,
          tags: data.tags,
          subtitles: { srt: data.srt, vtt: data.vtt, ass: data.ass }
        }
      };
    });
  }

  async generateThumbnailSequential(title: string): Promise<{ wide: string, portrait: string }> {
    try {
      const portrait = await this.retry(async () => {
        const apiKey = this.getApiKey();
        if (!apiKey) throw new Error("API_KEY_MISSING");
        const ai = new GoogleGenAI({ apiKey });
        const res = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [{ text: `Cinematic professional movie poster for "${title}". Ultra-high definition, 4k, cinematic lighting. STICTLY NO TEXT, NO LOGOS, NO LETTERS, NO NUMBERS. Purely visual composition for Photoshop editing.` }],
          },
          config: { imageConfig: { aspectRatio: "9:16" } }
        });
        const part = res.candidates?.[0]?.content?.parts.find(p => p.inlineData);
        return part?.inlineData?.data || "";
      }, 2); 

      return { wide: "", portrait };
    } catch (e) {
      console.error("ZEGOTECH: Thumbnail generation failed.", e);
      return { wide: "", portrait: "" };
    }
  }

  async generateSpeechChunked(text: string, voice: VoiceName, onProgress?: (current: number, total: number) => void): Promise<string> {
    if (!text) return "";
    const segments = this.segmentScript(text, TTS_CHUNK_SIZE);
    const audioBuffers: Uint8Array[] = [];

    for (let i = 0; i < segments.length; i++) {
      if (onProgress) onProgress(i + 1, segments.length);
      
      const audioBase64 = await this.retry(async () => {
        const apiKey = this.getApiKey();
        if (!apiKey) throw new Error("API_KEY_MISSING");
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash-preview-tts",
          contents: [{ parts: [{ text: segments[i] }] }],
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: { 
              voiceConfig: { 
                prebuiltVoiceConfig: { voiceName: voice } 
              } 
            },
          },
        });
        const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!data) throw new Error(`TTS_PART_${i+1}_FAILED: No audio data.`);
        return data;
      });

      if (audioBase64) audioBuffers.push(decode(audioBase64));
      if (i < segments.length - 1) await new Promise(r => setTimeout(r, TTS_DELAY_MS));
    }

    if (audioBuffers.length === 0) throw new Error("TTS_PRODUCTION_FAILED: No audio generated.");

    const merged = mergeUint8Arrays(audioBuffers);
    let binary = '';
    const len = merged.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(merged[i]);
    }
    return btoa(binary);
  }
}

export const geminiService = new GeminiService();
