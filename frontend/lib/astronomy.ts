import { BodyType, BodyVisualKind, CelestialBodyData, PlanetClass } from './types';

const sadnessPattern = /\b(sad|alone|lonely|hurt|cry|miss|grief|broken|empty|lost|ache)\b/i;
const hopePattern = /\b(hope|heal|light|rise|dream|begin|bloom|alive|future|tomorrow)\b/i;
const neutralPattern = /\b(today|quiet|ordinary|simple|steady|still|normal|plain|calm)\b/i;

export function classifyBody(message: string, likes: number): {
  type: BodyType;
  planetClass: PlanetClass;
  color: string;
} {
  const length = message.length;

  if (likes >= 1000) {
    return { type: 'neutron_star', planetClass: null, color: '#ffffff' };
  }

  if (likes >= 100) {
    return { type: 'star', planetClass: null, color: '#fde68a' };
  }

  if (length > 300) {
    return { type: 'planet', planetClass: 'gas', color: '#f59e0b' };
  }

  if (length > 150) {
    return { type: 'planet', planetClass: 'ocean', color: '#3b82f6' };
  }

  if (length > 80) {
    return { type: 'planet', planetClass: 'rocky', color: '#ef4444' };
  }

  if (length > 40) {
    return { type: 'planet', planetClass: 'ice', color: '#67e8f9' };
  }

  return { type: 'asteroid', planetClass: null, color: '#9ca3af' };
}

export function calculateBodySize(message: string, likes: number, type: BodyType): number {
  const baseSize = type === 'asteroid' ? 0.6 : type === 'planet' ? 1.2 : 2;
  return baseSize + likes * 0.015 + message.length / 120;
}

export function inferEmotion(message: string): 'sadness' | 'hope' | 'neutral' | 'fire' {
  if (sadnessPattern.test(message)) {
    return 'sadness';
  }

  if (hopePattern.test(message)) {
    return 'hope';
  }

  if (neutralPattern.test(message)) {
    return 'neutral';
  }

  return 'fire';
}

export function getVisualProfile(body: Pick<CelestialBodyData, 'message' | 'likes' | 'type' | 'planetClass' | 'color'>): {
  kind: BodyVisualKind;
  label: string;
  icon: string;
  color: string;
  ringed: boolean;
  tone: number;
} {
  const emotion = inferEmotion(body.message);

  if (body.likes > 500) {
    return {
      kind: 'neutron_star',
      label: 'Neutron Star',
      icon: '?',
      color: '#ffffff',
      ringed: false,
      tone: 523.25,
    };
  }

  if (body.likes > 100) {
    return {
      kind: 'main_star',
      label: 'Main Star',
      icon: '?',
      color: '#fde68a',
      ringed: false,
      tone: 392,
    };
  }

  if (body.message.length < 20 && body.likes === 0) {
    return {
      kind: 'asteroid',
      label: 'Asteroid',
      icon: '?',
      color: '#9ca3af',
      ringed: false,
      tone: 196,
    };
  }

  if (body.message.length > 300 || body.planetClass === 'gas') {
    return {
      kind: 'gas_giant',
      label: 'Gas Giant',
      icon: '?',
      color: '#f59e0b',
      ringed: true,
      tone: 329.63,
    };
  }

  if (emotion === 'sadness' || emotion === 'hope' || body.planetClass === 'ocean') {
    return {
      kind: 'ocean_planet',
      label: 'Ocean Planet',
      icon: '?',
      color: '#38bdf8',
      ringed: false,
      tone: 261.63,
    };
  }

  if (emotion === 'neutral' || body.planetClass === 'ice') {
    return {
      kind: 'ice_giant',
      label: 'Ice Giant',
      icon: '?',
      color: '#67e8f9',
      ringed: false,
      tone: 293.66,
    };
  }

  if (body.message.length < 50) {
    return {
      kind: 'hot_planet',
      label: 'Hot Planet',
      icon: '?',
      color: '#fb7185',
      ringed: false,
      tone: 349.23,
    };
  }

  return {
    kind: 'hot_planet',
    label: 'Hot Planet',
    icon: '?',
    color: body.color,
    ringed: false,
    tone: 311.13,
  };
}

export function getPreviewBody(message: string): {
  label: string;
  kind: BodyVisualKind;
  color: string;
} {
  const preview = getVisualProfile({
    message,
    likes: 0,
    type: classifyBody(message, 0).type,
    planetClass: classifyBody(message, 0).planetClass,
    color: classifyBody(message, 0).color,
  });

  return {
    label: preview.label,
    kind: preview.kind,
    color: preview.color,
  };
}

export function formatRelativeTime(value: string): string {
  const now = Date.now();
  const then = new Date(value).getTime();
  const diffSeconds = Math.max(1, Math.floor((now - then) / 1000));

  if (diffSeconds < 60) {
    return `${diffSeconds} seconds ago`;
  }

  const minutes = Math.floor(diffSeconds / 60);
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export function languageToFlag(language: string): string {
  const normalized = language.toLowerCase();
  const flags: Record<string, string> = {
    en: 'US',
    fa: 'AF',
    ru: 'RU',
    ja: 'JP',
    zh: 'CN',
    ko: 'KR',
    hi: 'IN',
  };

  return flags[normalized] ?? 'UN';
}

export function trimMessagePreview(message: string, length = 40): string {
  return message.length > length ? `${message.slice(0, length)}...` : message;
}

export function hashStringToUnit(value: string): number {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash % 1000) / 1000;
}
