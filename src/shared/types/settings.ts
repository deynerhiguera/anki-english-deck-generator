export interface AppSettings {
  openaiModel: string;
  openaiTtsVoice: string;
  openaiTtsModel: string;
  ankiConnectUrl: string;
  ankiDeckName: string;
  ankiModelName: string;
  strictValidation: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  openaiModel: 'gpt-4o',
  openaiTtsVoice: 'nova',
  openaiTtsModel: 'tts-1',
  ankiConnectUrl: 'http://127.0.0.1:8765',
  ankiDeckName: 'English Automatic',
  ankiModelName: 'English Automatic',
  strictValidation: false,
};
