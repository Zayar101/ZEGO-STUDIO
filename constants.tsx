import { VoiceName, SpeakerType, VoiceProfile } from './types';

export const VOICE_PROFILES: VoiceProfile[] = [
  { id: VoiceName.CHARON, name: 'Charon (ကလေး - Default)', type: SpeakerType.CHILD, description: 'ရွှင်မြူးပြီး ချစ်စရာကောင်းသောအသံ' },
  { id: VoiceName.FENRIR, name: 'Fenrir (ယောင်္ကျားလေး)', type: SpeakerType.MALE, description: 'နက်ရှိုင်းပြီး အာဏာပါသောအသံ' },
  { id: VoiceName.ZEPHYR, name: 'Zephyr (မိန်းကလေး)', type: SpeakerType.FEMALE, description: 'ယဉ်ကျေးပျူငှာပြီး တည်ငြိမ်သောအသံ' },
  { id: VoiceName.KORE, name: 'Kore (မိန်းကလေး - นူးညံ့)', type: SpeakerType.FEMALE, description: 'ကြည်လင်ပြီး သာယာသောအသံ' },
  { id: VoiceName.PUCK, name: 'Puck (ယောင်္ကျားလေး - ခန့်ညား)', type: SpeakerType.MALE, description: 'တက်ကြွပြီး ယုံကြည်မှုရှိသောအသံ' }
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
    name: 'Wave Money',
    number: '09775036112',
    accountName: 'Zay Yar Aung',
    color: 'bg-yellow-500'
  }
];
