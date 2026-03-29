const languageMatchers: Array<{ code: string; pattern: RegExp }> = [
  { code: 'fa', pattern: /[\u0600-\u06FF]/u },
  { code: 'ru', pattern: /[\u0400-\u04FF]/u },
  { code: 'ja', pattern: /[\u3040-\u30FF]/u },
  { code: 'zh', pattern: /[\u4E00-\u9FFF]/u },
  { code: 'ko', pattern: /[\uAC00-\uD7AF]/u },
  { code: 'hi', pattern: /[\u0900-\u097F]/u }
];

export function detectLanguage(message: string): string {
  for (const matcher of languageMatchers) {
    if (matcher.pattern.test(message)) {
      return matcher.code;
    }
  }

  return 'en';
}

