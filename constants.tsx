import { VoiceName, SpeakerType, VoiceProfile } from './types';

export const VOICE_PROFILES: VoiceProfile[] = [
  { id: VoiceName.CHARON, name: 'Charon (English - Default)', type: SpeakerType.CHILD, description: 'Cheerful and cute voice' },
  { id: VoiceName.FENRIR, name: 'Fenrir (Male)', type: SpeakerType.MALE, description: 'Deep and authoritative voice' },
  { id: VoiceName.ZEPHYR, name: 'Zephyr (Female)', type: SpeakerType.FEMALE, description: 'Polite and steady voice' },
  { id: VoiceName.KORE, name: 'Kore (Female - Soft)', type: SpeakerType.FEMALE, description: 'Clear and pleasant voice' },
  { id: VoiceName.PUCK, name: 'Puck (Male - Elegant)', type: SpeakerType.MALE, description: 'Energetic and confident voice' }
];

export const MAX_FILE_SIZE = 70 * 1024 * 1024; 
export const TTS_CHUNK_SIZE = 4000; // Balanced for Burmese script safety and speed
export const TTS_DELAY_MS = 200; // Minimal inter-chunk delay
export const PHASE_DELAY_MS = 50; // Ultra-responsive transitions
export const THUMBNAIL_DELAY_MS = 400; 
export const COOLDOWN_SECONDS = 15; // Rapid turnaround
export const ESTIMATED_TOTAL_SECONDS = 60; // Production target for average clips

export const DONATION_INFO = [
  {
    name: 'KPay',
    number: '09775036112',
    accountName: 'Zay Yar Aung',
    color: 'bg-blue-600'
  },
  {
    name: 'Kasikornbank (Thailand)',
    number: '1483703615',
    accountName: 'MS. KAY THWAL AUNG',
    color: 'bg-emerald-600'
  }
];
