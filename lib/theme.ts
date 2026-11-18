import type { Theme } from './types';
import { defaultTheme as _ } from './theme'; // re-export type

export type { Theme } from './types';

/**
 * Paleta padrão da página pública.
 *
 * O painel administrativo envia essas cores como variáveis CSS e o
 * `renderProfileAppearance` aplica cada uma na região correta.
 */
export const defaultTheme: Theme = {
  accent: '#0284c7',
  accentBright: '#0ea5e9',
  accentAlt: '#7dd3fc',
  onAccent: '#ffffff',
  bg: '#bae6fd',
  surface: '#e0f2fe',
  text: '#0c4a6e',
  name: '#08304D',
  muted: '#64748b',
  border: '#ffffff',
  platform2: null,
  platform3: null,
  platform4: null,
  platform5: null,
  vip: null,
  telegram: null,
};

/**
 * Escolhe a cor de texto (clara ou escura) que contrasta com o fundo recebido.
 *
 * Usado para o botão principal: se o destaques for escuro, o texto fica claro.
 */
export function readableOn(hex: string): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return defaultTheme.onAccent;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  // Luminância relativa (fórmula WCAG).
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.55 ? '#08110b' : '#f2f7f2';
}

/** Converte `#rrggbb` em `r, g, b` para uso em `rgb(var(--x) / alpha)`. */
export function hexToRgb(hex: string): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return '0, 0, 0';
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

/** Valida uma cor hexadecimal. Devolve `null` quando inválida. */
export function normalizeHex(value: string | null | undefined): string | null {
  if (!value) return null;
  const clean = value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(clean)) return clean.toLowerCase();
  if (/^#[0-9a-fA-F]{3}$/.test(clean)) {
    const [r, g, b] = clean.slice(1).split('');
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return null;
}
