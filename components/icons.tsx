/**
 * Ícones SVG inline para a página pública.
 * Usamos `<use href>` no HTML para reutilizar, mas alguns ícones dinâmicos
 * são renderizados como JSX (por exemplo, o avatar padrão).
 */

export const Icons = {
  instagram: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="17.5" cy="6.5" r=".75" fill="currentColor" stroke="none" />
    </svg>
  ),

  whatsapp: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
      <path d="M20.5 11.7a8.5 8.5 0 0 1-12.7 7.4L3 20.5l1.3-4.8A8.5 8.5 0 1 1 20.5 11.7Z" />
      <path d="M8.2 7.7c-.6 2.8 2.5 6.8 6.1 7.7.8.2 1.7-.6 1.8-1.2l-2.4-1.4-.9 1c-1.5-.7-2.4-1.6-3-3l.9-.9-1.2-2.2Z" fill="#fff" />
    </svg>
  ),

  telegram: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
      <path d="M21.5 3.6 2.6 10.9c-.8.3-.8 1.4 0 1.7l4.6 1.6 1.8 5.6c.2.7 1.1.9 1.6.4l2.6-2.5 4.7 3.4c.6.4 1.4.1 1.6-.6L22.9 5c.2-.9-.6-1.7-1.4-1.4Z" />
      <path d="m7.2 14.2 9.9-6.4-7.4 7.9Z" />
    </svg>
  ),

  arrow: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 19V5M5 5l14 14" />
    </svg>
  ),

  play: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" />
    </svg>
  ),

  verified: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="m12 2 3 2 3.5.5L20 8l2 4-2 3-1.5 3.5L15 20l-3 2-3-2-3.5-1.5L4 15l-2-3 2-4 1.5-3.5L9 4Z" />
      <path d="m8 12 2.5 2.5L16 9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),

  close: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M7 7l10 10M17 7L7 17" strokeLinecap="round" />
    </svg>
  ),

  /** Avatar padrão quando a foto não foi enviada. */
  avatarPlaceholder: (
    <svg viewBox="0 0 120 120" width="80" height="80">
      <defs>
        <linearGradient id="avg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity=".9" />
          <stop offset="100%" stopColor="currentColor" stopOpacity=".35" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="58" fill="none" stroke="url(#avg)" strokeWidth="3" />
      <circle cx="60" cy="46" r="16" fill="currentColor" opacity=".8" />
      <path d="M28 98c0-22 14-38 32-38s32 16 32 38" fill="currentColor" opacity=".55" />
    </svg>
  ),
};

/** Retorna o ícone JSX a partir da chave. */
export function getIcon(name: string) {
  return (Icons as Record<string, React.ReactNode>)[name] ?? null;
}
