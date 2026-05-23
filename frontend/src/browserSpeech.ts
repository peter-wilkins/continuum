export const browserSpeechRecognitionCaveat =
  'Continuum does not store raw audio here. Browser speech recognition may use a vendor service.';

export const speechRecognitionUnavailableMessage =
  'Speech is not available in this browser.';

type BrowserSpeechRecognitionAlternative = {
  transcript: string;
};

type BrowserSpeechRecognitionResult = {
  readonly isFinal: boolean;
  readonly length: number;
  readonly [index: number]: BrowserSpeechRecognitionAlternative | undefined;
};

type BrowserSpeechRecognitionResultList = {
  readonly length: number;
  readonly [index: number]: BrowserSpeechRecognitionResult | undefined;
};

export type BrowserSpeechRecognitionEvent = Event & {
  resultIndex: number;
  results: BrowserSpeechRecognitionResultList;
};

export type BrowserSpeechRecognitionErrorEvent = Event & {
  error?: string;
  message?: string;
};

export type BrowserSpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onend: (() => void) | null;
  onerror: ((event: BrowserSpeechRecognitionErrorEvent) => void) | null;
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null;
  onstart: (() => void) | null;
  abort(): void;
  start(): void;
  stop(): void;
};

type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

export function getSpeechRecognitionConstructor(): BrowserSpeechRecognitionConstructor | null {
  const browserWindow = window as Window & {
    SpeechRecognition?: BrowserSpeechRecognitionConstructor;
    webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
  };

  return browserWindow.SpeechRecognition ?? browserWindow.webkitSpeechRecognition ?? null;
}

export function transcriptFromSpeechEvent(event: BrowserSpeechRecognitionEvent): string {
  const transcripts: string[] = [];

  for (let index = event.resultIndex; index < event.results.length; index += 1) {
    const result = event.results[index];
    const transcript = result?.[0]?.transcript.trim();
    if (transcript) {
      transcripts.push(transcript);
    }
  }

  return normalizeSpokenText(transcripts.join(' '));
}

export function normalizeSpokenText(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}
