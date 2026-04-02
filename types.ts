export enum VoiceName {
  ZEPHYR = 'Zephyr',
  PUCK = 'Puck',
  KORE = 'Kore',
  FENRIR = 'Fenrir',
  CHARON = 'Charon'
}

export enum TargetLanguage {
  BURMESE = 'Burmese',
  ENGLISH = 'English',
  THAI = 'Thai'
}

export enum SpeakerType {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  CHILD = 'CHILD',
  ELDER = 'ELDER'
}

export interface VoiceProfile {
  id: VoiceName;
  name: string;
  type: SpeakerType;
  description: string;
}

export interface VideoMetadata {
  title: string;
  description: string;
  tags: string[];
  subtitles: {
    srt: string;
    vtt: string;
    ass: string;
  };
}

export interface TranscriptionResult {
  text: string;
  metadata?: VideoMetadata;
  status: 'idle' | 'processing' | 'success' | 'error';
  error?: string;
  thumbnailWide?: string; // 16:9
  thumbnailPortrait?: string; // 9:16
  targetLanguage?: TargetLanguage;
}

export interface ProcessingOptions {
  voice: VoiceName;
  pitch: 'normal' | 'soft' | 'energetic';
  targetLanguage: TargetLanguage;
  speed: number;
}