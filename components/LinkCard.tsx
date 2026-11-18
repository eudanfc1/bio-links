'use client';

import type { ProfileLink } from '@/lib/types';
import { getIcon } from './icons';

type LinkCardProps = {
  link: ProfileLink;
  accent: string;
  profileName: string;
  onTrack: (target: string) => void;
};

function getGlowClass(icon: string): string {
  if (icon === 'whatsapp') return 'glow-whatsapp';
  if (icon === 'telegram') return 'glow-telegram';
  if (icon === 'instagram') return 'glow-instagram';
  return 'glow-brand';
}

export default function LinkCard({ link, accent, profileName, onTrack }: LinkCardProps) {
  const glowClass = getGlowClass(link.icon);
  const isPlatform = link.kind === 'platform';

  return (
    <a
      href={link.url}
      className={`arena-shortcut glass-card neon-btn neon-border relative flex min-h-16 items-center gap-3 rounded-md px-4 py-4 ${glowClass}`}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => onTrack(link.id)}
      data-link={link.id}
    >
      {isPlatform ? (
        <>
          <span className="arena-cta-emoji shrink-0 text-2xl">🎮</span>
          <span className="min-w-0 flex-1 break-words font-arena text-xl font-extrabold uppercase tracking-wide">
            {link.label}
          </span>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 shrink-0">
            <path d="M7 7h10v10"/>
            <path d="M7 17 17 7"/>
          </svg>
          <span aria-hidden="true" className="arena-cta-shine" />
          <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]" />
        </>
      ) : (
        <>
          <span className="arena-social-icon grid shrink-0 place-items-center rounded-md h-10 w-10">
            <span className="flex items-center justify-center text-brand-soft">
              {getIcon(link.icon)}
            </span>
          </span>
          <span className="min-w-0 flex-1 break-words text-sm font-semibold">
            <span className="block break-words text-xs font-bold">{link.label}</span>
          </span>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-muted-foreground shrink-0">
            <path d="M7 7h10v10"/>
            <path d="M7 17 17 7"/>
          </svg>
          <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]" />
        </>
      )}
    </a>
  );
}
