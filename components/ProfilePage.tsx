'use client';

import './../styles/profile-reference.css';

import { useState, useEffect, useCallback, useMemo } from 'react';

import type { ProfileBundle } from '@/lib/types';
import { defaultTheme, hexToRgb } from '@/lib/theme';
import type { Theme } from '@/lib/theme';
import Gate from './Gate';
import GamesGrid from './GamesGrid';
import Lightbox from './Lightbox';
import { getIcon } from './icons';

type Props = {
  bundle: ProfileBundle;
  slug: string;
};

const DESTINO_ICONS: Record<string, JSX.Element> = {
  whatsapp: <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.87 9.87 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91A9.85 9.85 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.25-8.23a8.23 8.23 0 0 1 8.23 8.24c0 4.54-3.7 8.23-8.23 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.16.04-.31-.02-.43-.06-.13-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.1-.22-.16-.47-.29Z"/></svg>,
  instagram: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>,
  telegram: <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M21.94 4.3 18.8 19.12c-.24 1.05-.86 1.31-1.74.82l-4.8-3.54-2.32 2.23c-.26.26-.47.47-.97.47l.35-4.9 8.92-8.06c.39-.35-.08-.54-.6-.19L6.62 12.88 1.87 11.4c-1.03-.32-1.05-1.03.22-1.53L20.6 2.74c.86-.32 1.61.19 1.34 1.56Z"/></svg>,
  platform: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="6" x2="10" y1="11" y2="11"/><line x1="8" x2="8" y1="9" y2="13"/><line x1="15" x2="15.01" y1="12" y2="12"/><line x1="18" x2="18.01" y1="10" y2="10"/><path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z"/></svg>,
  custom: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
};

const DESTINO_DESC: Record<string, string> = {
  whatsapp: 'Fique por dentro de tudo',
  instagram: 'Me acompanha por lá',
  telegram: 'Avisos em primeira mão',
  platform: 'Acessar plataforma',
  custom: 'Clique para acessar',
};

/**
 * O campo `icon` de um link guarda a chave de um ícone inline (`"telegram"`,
 * `"play"`, ...) — ver `components/icons.tsx`. Quando o painel envia uma
 * imagem, o valor é uma URL. Só nesse caso usamos `<img>`.
 */
function isIconUrl(icon: string) {
  return /^(https?:\/\/|\/|data:)/.test(icon);
}

/**
 * Devolve a chave semântica do ícone mesmo quando `icon` é uma imagem
 * ("/assets/.../instagram.png?v=1" → "instagram"), para que a legenda
 * do card continue sendo escolhida pelo serviço, e não pela URL.
 */
function iconKey(icon: string) {
  if (!icon) return '';
  if (!isIconUrl(icon)) return icon;
  const match = icon.match(/([a-z0-9_-]+)\.(?:png|jpe?g|webp|svg|gif|avif)(?:\?|$)/i);
  return match ? match[1].toLowerCase() : '';
}

export default function ProfilePage({ bundle, slug }: Props) {
  const { profile, links, partners, stories } = bundle;
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [gateOpen, setGateOpen] = useState(true);
  const [dockAberto, setDockAberto] = useState(true);

  /** Rola suavemente até uma seção da página (usado pela barra inferior). */
  const rolarPara = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const theme = useMemo(() => ({ ...defaultTheme, ...profile.theme }) as Theme, [profile.theme]);
  const accent = theme.accent || defaultTheme.accent;
  const accentAlt = theme.accentAlt || defaultTheme.accentAlt;
  const onAccent = theme.onAccent || defaultTheme.onAccent;

  const handleUnlock = useCallback(() => {
    fetch('/api/click', {
      method: 'POST',
      body: JSON.stringify({ target: 'gate', profileId: profile.id, linkId: null }),
      headers: { 'Content-Type': 'application/json' },
    }).catch(() => {});
  }, [profile.id]);

  const handleGateDone = useCallback(() => {
    setGateOpen(false);
  }, []);

  useEffect(() => {
    const root = document.documentElement.style;
    root.setProperty('--brand', hexToRgb(accent));
    root.setProperty('--brand-soft', hexToRgb(accentAlt || accent));
    root.setProperty('--foreground', hexToRgb('#fff'));
    root.setProperty('--muted-foreground', hexToRgb('rgba(255,255,255,0.65)'));
    root.setProperty('--bio-bg', '220 40% 6%');
    root.setProperty('--bio-surface', '220 30% 10%');
    root.setProperty('--bio-text', '210 40% 96%');
    root.setProperty('--border', '220 30% 18%');
    document.title = `${profile.name || 'Meus links'} • Meus links`;
  }, [profile.name, accent, accentAlt]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const track = async (target: string, linkId?: string) => {
    try {
      await fetch('/api/click', {
        method: 'POST',
        body: JSON.stringify({ target, profileId: profile.id, linkId: linkId ?? null }),
        headers: { 'Content-Type': 'application/json' },
      });
    } catch {}
  };

  const bg = theme.bg || defaultTheme.bg;
  const surface = theme.surface || defaultTheme.surface;
  const text = theme.text || defaultTheme.text;
  const muted = theme.muted || defaultTheme.muted;
  const border = theme.border || defaultTheme.border;
  const accentBright = theme.accentBright || defaultTheme.accentBright;

  // Active stories (last 24h)
  const activeStories = stories.filter(s => new Date(s.expiresAt) > new Date());

  /** Perfil do Instagram; clicar na foto leva para lá (é onde ficam os stories). */
  const instagramUrl = (profile.instagram || '').trim();

  /**
   * Link do botão "Suporte". No painel dá para colar a URL completa ou só o
   * número (ex.: 85999286481) — aqui ele vira um link do WhatsApp.
   */
  const suporteUrl = (() => {
    const valor = (profile.supportUrl || '').trim();
    if (!valor) return '';
    if (/^https?:\/\//i.test(valor)) return valor;
    const digitos = valor.replace(/\D/g, '').replace(/^0+/, '');
    if (!digitos) return '';
    // Número local (DDD + número) ganha o código do Brasil.
    return `https://wa.me/${digitos.length <= 11 ? `55${digitos}` : digitos}`;
  })();

  const avatarCircle = (
    <div className="avatar-glow relative rounded-full p-[2px] h-24 w-24 @min-[600px]:h-36 @min-[600px]:w-36">
      <div className="avatar-bubble h-full w-full overflow-hidden rounded-full bg-bio-surface">
        {profile.avatarUrl ? (
          <img alt={profile.name} className="h-full w-full object-cover" src={profile.avatarUrl} />
        ) : (
          <span className="grid h-full w-full place-items-center text-brand-soft">
            {getIcon('avatarPlaceholder')}
          </span>
        )}
      </div>
    </div>
  );

  // Build money rain emojis
  const moneyEmojis = useMemo(() => {
    const emojis = ['💸', '💵', '💰', '🪙', '💶', '💷', '💴'];
    const items = [];
    for (let i = 0; i < 25; i++) {
      items.push({
        emoji: emojis[i % emojis.length],
        left: `${(i * 7.3 + 2) % 100}%`,
        delay: `${(i * 0.8) % 20}s`,
        duration: `${8 + (i % 7)}s`,
      });
    }
    return items;
  }, []);

  // Build star particles for banner
  const stars = useMemo(() => {
    const items = [];
    for (let i = 0; i < 15; i++) {
      items.push({
        left: `${(i * 13.7) % 100}%`,
        top: `${(i * 7.1) % 100}%`,
        delay: `${(i * 0.7) % 4}s`,
        size: 1 + (i % 3),
      });
    }
    return items;
  }, []);

  return (
    <>
      {/* ====== GATE / VERIFICATION ====== */}
      {gateOpen && (
        <Gate
          accent={accent}
          bg={bg}
          text={text}
          muted={muted}
          surface={surface}
          coverUrl={profile.coverUrl}
          name={profile.name}
          handle={profile.handle}
          avatarUrl={profile.avatarUrl}
          verified={profile.verified}
          onUnlock={handleUnlock}
          onGone={handleGateDone}
        />
      )}

      {/* ====== MONEY RAIN OVERLAY ====== */}
      <div className="bio-money-rain pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-20">
        {moneyEmojis.map((item, i) => (
          <span
            key={i}
            className="absolute inset-y-0 w-8 select-none text-2xl"
            style={{
              left: item.left,
              animation: `money-rain ${item.duration} linear infinite`,
              animationDelay: item.delay,
            }}
          >
            {item.emoji}
          </span>
        ))}
      </div>

      <div data-bio-theme="babyblue" className="arena-page relative min-h-full overflow-clip pb-4 text-foreground">
        {/* ====== ARENA HEADER ====== */}
        <header className="arena-header mx-auto grid w-full max-w-6xl grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-center gap-3 px-5 py-4 @min-[600px]:px-8">
          {/* Coluna vazia: mantém o título centralizado sem o ícone da moeda. */}
          <span aria-hidden="true" className="h-10 w-10 shrink-0" />
          <div className="min-w-0 text-center">
            <div className="header-handle-sway flex items-center justify-center gap-2">
              <svg viewBox="0 0 24 24" width="27" height="27" fill="none" stroke="url(#ig-gradient)" strokeWidth="2" className="header-ig shrink-0">
                <defs>
                  <linearGradient id="ig-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#833ab4"/>
                    <stop offset="50%" stopColor="#e1306c"/>
                    <stop offset="100%" stopColor="#fd1d1d"/>
                  </linearGradient>
                </defs>
                <rect x="2" y="2" width="20" height="20" rx="5"/>
                <circle cx="12" cy="12" r="5"/>
                <circle cx="17.5" cy="6.5" r="1.5" fill="url(#ig-gradient)" stroke="none"/>
              </svg>
              <span className="truncate text-[22px] font-bold leading-tight">@{profile.handle}</span>
            </div>
          </div>
          {/* Coluna vazia: mantém o título centralizado sem o botão de menu. */}
          <span aria-hidden="true" className="h-11 w-11 shrink-0" />
        </header>

        {/* ====== HERO SECTION ====== */}
        <main className="relative z-10">
          <section className="arena-hero relative mx-auto max-w-6xl overflow-hidden">
            {/* Background scenery */}
            {profile.backgroundUrl ? (
              <img
                alt=""
                decoding="async"
                className="arena-scenery absolute inset-0 h-full w-full object-cover"
                src={profile.backgroundUrl}
                style={{ opacity: 0.3 }}
              />
            ) : (
              <div className="arena-scenery absolute inset-0 h-full w-full" style={{
                background: 'linear-gradient(180deg, #0a0a1a 0%, #1a1a3e 50%, #0a0a1a 100%)',
                opacity: 0.4
              }} />
            )}
            <div className="arena-hero-shade absolute inset-0" />

            {/* Banner */}
            <div className="bio-banner-frame relative mx-5 mt-4 rounded-lg p-[2px] @min-[600px]:mx-8">
              <div className="bio-banner-image overflow-hidden rounded-md relative">
                <img
                  alt="Banner"
                  className="w-full aspect-[2/1] object-cover"
                  fetchPriority="high"
                  src={profile.coverUrl || ''}
                />
                {/* Banner shimmer */}
                <span aria-hidden="true" className="absolute inset-0 overflow-hidden rounded-[inherit]" style={{ zIndex: 2 }}>
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" style={{ animation: 'bio-banner-sweep 6s ease-in-out infinite' }} />
                </span>
              </div>
            </div>

            {/* Hero content grid */}
            <div className="relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 pb-3 pt-10 @min-[600px]:gap-8 @min-[600px]:px-8 @min-[600px]:pt-16 !pt-5">
              {/* Left column - content */}
              <div className="col-span-2 row-start-2 min-w-0">
                {/* Name */}
                <img
                  alt="LEVIVROG"
                  className="logo-flash mx-auto h-16 w-auto object-contain @min-[600px]:h-20"
                  src="/images/levivrog-logo.png"
                  style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'none' : 'translateY(20px)' }}
                />

                {/* Verified */}
                <p className="mt-3 flex items-center justify-center gap-1.5 text-[10px] font-semibold uppercase text-brand-soft">
                  <svg viewBox="0 0 24 24" width="16" height="16" className="h-4 w-4 shrink-0 drop-shadow-[0_0_6px_rgba(29,155,240,0.55)]">
                    <path
                      fill="#1d9bf0"
                      d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"
                    />
                    <path
                      d="m9 12 2 2 4-4"
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Perfil verificado
                </p>

                {/* Scroll hint */}
                <p className="mt-2 text-center text-xs leading-relaxed text-foreground/75 @min-[600px]:text-sm">Role para baixo para acessar aos links.</p>

                {/* Partner section */}
                {partners.filter((p) => p.active).length > 0 && (
                <div className="mt-6 w-full border-y border-brand/30 py-4">
                  {partners.filter((p) => p.active).map((partner, idx) => (
                  <div key={partner.id} className={idx > 0 ? 'mt-6 pt-6 border-t border-brand/20' : ''}>
                    <div className="arena-partner grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 pb-2">
                      <img
                        alt={partner.name || profile.name}
                        className="bio-platform-logo h-28 w-28 shrink-0 rounded-full object-cover @min-[600px]:h-36 @min-[600px]:w-36"
                        src={partner.logoUrl || profile.avatarUrl}
                      />
                      <div className="min-w-0">
                        <p className="mb-2 text-[11px] font-semibold uppercase text-muted-foreground">Parceiro oficial</p>
                        <h2 className="break-words font-arena text-4xl font-extrabold uppercase leading-tight text-brand-soft @min-[600px]:text-5xl">{partner.name || profile.name}</h2>
                      </div>
                      <svg viewBox="0 0 24 24" width="28" height="28" className="h-7 w-7 shrink-0 drop-shadow-[0_0_8px_rgba(29,155,240,0.55)]">
                        <path
                          fill="#1d9bf0"
                          d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"
                        />
                        <path
                          d="m9 12 2 2 4-4"
                          fill="none"
                          stroke="#ffffff"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>

                    {/* Partner CTA */}
                    <div className="arena-cta-wrap isolate mt-3">
                      <a
                        href={partner.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="arena-primary glass-card neon-btn neon-border relative flex min-h-16 items-center gap-3 rounded-md px-4 py-4"
                      >
                        <span aria-hidden="true" className="arena-cta-shine" />
                        <span aria-hidden="true" className="arena-cta-emoji shrink-0 text-2xl">🎮</span>
                        <span className="min-w-0 flex-1 break-words font-arena text-xl font-extrabold uppercase tracking-wide @min-[600px]:text-2xl">
                          {partner.label || 'Jogar agora'}
                        </span>
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 shrink-0">
                          <path d="M7 7h10v10"/>
                          <path d="M7 17 17 7"/>
                        </svg>
                        <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]" />
                      </a>
                    </div>
                  </div>
                  ))}
                </div>
                )}
              </div>

              {/* Right column - foto de perfil (com o story, quando houver) */}
              <div className="relative z-10 col-start-2 row-start-1 -mt-[68px] flex w-36 flex-col items-center self-start @min-[600px]:-mt-[92px] @min-[600px]:w-56">
                {/* Selo acima da foto — aparece sempre, com ou sem story ativo. */}
                <span
                  className="story-bubble pointer-events-none absolute left-1/2 -top-2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full px-2.5 py-1 text-[9px] font-bold uppercase @min-[600px]:text-[10px]"
                >
                  Assista meus storys
                </span>
                {activeStories.length > 0 ? (
                  <a
                    href={instagramUrl || '#'}
                    {...(instagramUrl ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    aria-label={instagramUrl ? `Ver os stories de @${profile.handle} no Instagram` : undefined}
                    className="story-link relative block rounded-full"
                  >
                    <span className="story-ring block rounded-full p-1">
                      {avatarCircle}
                    </span>
                  </a>
                ) : instagramUrl ? (
                  /* Sem story ativo a foto continua aparecendo — e leva ao Instagram. */
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Ver o Instagram de @${profile.handle}`}
                    className="block rounded-full transition-transform duration-200 hover:scale-[1.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  >
                    {avatarCircle}
                  </a>
                ) : (
                  avatarCircle
                )}
              </div>
            </div>
          </section>

          {/* ====== DESTINOS DISPONÍVEIS ====== */}
          <section className="mx-auto max-w-6xl px-5 @min-[600px]:px-8">
            <div className="mb-4 flex items-center gap-2 text-[10px] font-semibold uppercase text-muted-foreground">
              <span className="h-1 w-1 bg-brand" />
              Destinos Disponíveis
            </div>
            <div className="grid grid-cols-2 gap-3 @min-[600px]:grid-cols-4">
              {partners.filter((p) => p.active).map((partner) => (
                <a
                  key={`partner-${partner.id}`}
                  href={partner.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => track(`parceiro:${partner.id}`, partner.id)}
                  className="arena-shortcut glass-card neon-btn neon-border relative flex h-full min-h-32 flex-col items-start gap-3 rounded-md p-4 glow-brand"
                >
                  {partner.backgroundUrl && (
                    <>
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 rounded-[inherit] bg-cover bg-center"
                        style={{ backgroundImage: `url("${partner.backgroundUrl}")` }}
                      />
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-b from-black/20 via-black/40 to-black/75"
                      />
                    </>
                  )}
                  <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]" />
                  <div className="relative z-10 flex w-full justify-between">
                    <span className="arena-social-icon grid shrink-0 place-items-center rounded-md h-16 w-16">
                      {partner.logoUrl ? (
                        <img alt={partner.name} className="h-full w-full rounded-md object-contain" src={partner.logoUrl} />
                      ) : (
                        <span className="flex items-center justify-center text-brand-soft [&_svg]:h-8 [&_svg]:w-8">
                          {DESTINO_ICONS.custom}
                        </span>
                      )}
                    </span>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0 text-muted-foreground">
                      <path d="M7 7h10v10" />
                      <path d="M7 17 17 7" />
                    </svg>
                  </div>
                  <span className="relative z-10 block w-full min-w-0">
                    <span className="block break-words text-xs font-bold">{partner.name || profile.name}</span>
                    <span className="mt-1 block text-[10px] text-muted-foreground">
                      {partner.label || 'Parceiro oficial'}
                    </span>
                  </span>
                </a>
              ))}
              {links.filter((l) => l.active && l.kind !== 'platform').map((link) => {
                const icon = link.icon;
                return (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => track(`destino:${link.kind}`, link.id)}
                    className={`arena-shortcut glass-card neon-btn neon-border relative flex h-full min-h-32 flex-col items-start gap-3 rounded-md p-4 ${link.icon === 'whatsapp' ? 'glow-whatsapp' : link.icon === 'telegram' ? 'glow-telegram' : link.icon === 'instagram' ? 'glow-instagram' : 'glow-brand'}`}
                  >
                    {link.backgroundUrl && (
                      <>
                        <span
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-0 rounded-[inherit] bg-cover bg-center"
                          style={{ backgroundImage: `url("${link.backgroundUrl}")` }}
                        />
                        <span
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-b from-black/20 via-black/40 to-black/75"
                        />
                      </>
                    )}
                    <div className="relative z-10 flex w-full justify-between">
                      <span className="arena-social-icon grid shrink-0 place-items-center rounded-md h-16 w-16">
                        {icon && isIconUrl(icon) ? (
                          <img alt={link.label} className="h-full w-full rounded-md object-contain" src={icon} />
                        ) : (
                          <span className="flex items-center justify-center text-brand-soft [&_svg]:h-8 [&_svg]:w-8">
                            {getIcon(icon) || DESTINO_ICONS[link.kind] || DESTINO_ICONS.custom}
                          </span>
                        )}
                      </span>
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0 text-muted-foreground">
                        <path d="M7 7h10v10" />
                        <path d="M7 17 17 7" />
                      </svg>
                    </div>
                    <span className="relative z-10 block w-full min-w-0">
                      <span className="block break-words text-xs font-bold">{link.label}</span>
                      <span className="mt-1 block text-[10px] text-muted-foreground">
                        {DESTINO_DESC[iconKey(link.icon)] || DESTINO_DESC[link.kind] || 'Clique para acessar'}
                      </span>
                    </span>
                    <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]" />
                  </a>
                );
              })}
            </div>
          </section>

          {/* ====== NOSSOS JOGOS ====== */}
          <section id="jogos" className="mx-auto max-w-6xl scroll-mt-6 px-5 @min-[600px]:px-8">
            <GamesGrid href={profile.gamesUrl} />
          </section>

          {/* ====== VIP / REFERRAL SECTION ====== */}
          <section id="vip" className="mx-auto max-w-6xl scroll-mt-6 px-5 @min-[600px]:px-8">
            <div className="mt-10 border-t border-border pt-7">
              <div className="relative overflow-hidden rounded-2xl border border-brand/30 bg-gradient-to-b from-brand/[0.14] via-transparent to-transparent px-5 py-6 text-center shadow-[0_24px_70px_-45px_hsl(var(--brand)/0.9)] @min-[600px]:px-7 @min-[600px]:py-7">
                {/* Brilho decorativo atrás do ícone */}
                <span aria-hidden="true" className="pointer-events-none absolute -top-20 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-brand/25 blur-3xl" />

                <span className="relative mx-auto flex h-9 w-9 items-center justify-center rounded-full border border-brand/40 bg-brand/10 text-brand-soft">
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <path d="M16.17 7.83 2 22" />
                    <path d="M4.02 12a2.827 2.827 0 1 1 3.81-4.17A2.827 2.827 0 1 1 12 4.02a2.827 2.827 0 1 1 4.17 3.81A2.827 2.827 0 1 1 19.98 12a2.827 2.827 0 1 1-3.81 4.17A2.827 2.827 0 1 1 12 19.98a2.827 2.827 0 1 1-4.17-3.81A1 1 0 1 1 4 12" />
                    <path d="m7.83 7.83 8.34 8.34" />
                  </svg>
                </span>

                <p className="relative mt-2 text-[9px] font-bold uppercase tracking-[0.28em] text-brand">Oportunidade VIP</p>

                <h2 className="relative mx-auto mt-2 max-w-[19rem] text-balance bg-gradient-to-b from-white via-white to-white/75 bg-clip-text font-arena text-lg font-extrabold uppercase leading-[1.2] text-transparent @min-[600px]:max-w-[22rem] @min-[600px]:text-xl">
                  Cansado de ter seus stories derrubados pelo Instagram por causa de link?
                </h2>

                <p className="relative mx-auto mt-2.5 max-w-[19rem] text-[10.5px] leading-relaxed text-muted-foreground @min-[600px]:text-[11px]">
                  Temos a solução perfeita para você. Sua página, seu estilo, seus links — tudo com a sua cara.
                </p>

                <a
                  href="https://wa.me/5585999286481?text=FALA%20DAN!%20VI%20UM%20SITE%20SEU%20E%20QUERO%20O%20MEU%20TAMB%C3%89M"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-card neon-btn neon-border group relative mx-auto mt-4 flex w-fit items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-foreground"
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" className="h-5 w-5 shrink-0 transition-transform group-hover:scale-110">
                    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.87 9.87 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91A9.85 9.85 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.25-8.23a8.23 8.23 0 0 1 8.23 8.24c0 4.54-3.7 8.23-8.23 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.16.04-.31-.02-.43-.06-.13-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.1-.22-.16-.47-.29Z" />
                  </svg>
                  <span className="text-sm font-extrabold uppercase tracking-wide">Falar com o Dan</span>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0">
                    <path d="M7 7h10v10" />
                    <path d="M7 17 17 7" />
                  </svg>
                  <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]" />
                </a>

                <p className="relative mt-2.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Garanta já o seu
                </p>
              </div>
            </div>
          </section>

          {/* ====== FOOTER ====== */}
          <footer className="pb-5 pt-8 text-center text-[10px] text-muted-foreground">
            <p>+18 · Jogue com responsabilidade</p>
            <p className="mt-2">PAINEL EXCLUSIVO ~ Dan</p>
          </footer>
        </main>

        {/* ====== BOTTOM DOCK ====== */}
        {dockAberto ? (
          <div className="arena-dock sticky bottom-3 z-30 mx-auto mt-6 flex max-w-md items-center rounded-lg border border-brand/25 p-1.5 w-[calc(100%-2rem)]">
            <nav aria-label="Navegação do site" className="grid min-w-0 flex-1 grid-flow-col auto-cols-fr">
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="flex flex-col items-center justify-center gap-1 px-4 py-2 h-14 text-[10px] text-brand-soft"
              >
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/>
                  <path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                </svg>
                Início
              </button>
              <button
                type="button"
                onClick={() => rolarPara('jogos')}
                className="flex flex-col items-center justify-center gap-1 px-4 py-2 h-14 text-[10px]"
              >
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <line x1="6" x2="10" y1="11" y2="11"/>
                  <line x1="8" x2="8" y1="9" y2="13"/>
                  <line x1="15" x2="15.01" y1="12" y2="12"/>
                  <line x1="18" x2="18.01" y1="10" y2="10"/>
                  <path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z"/>
                </svg>
                Porcentagens
              </button>
              <a href={suporteUrl || 'https://chat.whatsapp.com/JocqEzVVX2eKkSaG9xxHWi'} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center gap-1 px-4 py-2 h-14 text-[10px]">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/>
                </svg>
                Suporte
              </a>
              <button
                type="button"
                onClick={() => rolarPara('vip')}
                className="flex flex-col items-center justify-center gap-1 px-4 py-2 h-14 text-[10px]"
              >
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <circle cx="12" cy="12" r="1"/>
                  <circle cx="19" cy="12" r="1"/>
                  <circle cx="5" cy="12" r="1"/>
                </svg>
                Mais
              </button>
            </nav>
            <button
              type="button"
              onClick={() => setDockAberto(false)}
              className="h-14 w-11 shrink-0 text-brand-soft flex items-center justify-center"
              aria-label="Esconder barra"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"/>
                <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/>
                <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"/>
                <path d="m2 2 20 20"/>
              </svg>
            </button>
          </div>
        ) : (
          /* Botão flutuante para trazer a barra de volta. */
          <button
            type="button"
            onClick={() => setDockAberto(true)}
            className="fixed bottom-3 right-3 z-30 flex h-11 w-11 items-center justify-center rounded-full border border-brand/30 bg-black/70 text-brand-soft backdrop-blur"
            aria-label="Mostrar barra de navegação"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
        )}
      </div>

      {lightbox && (
        <Lightbox src={lightbox.src} alt={lightbox.alt} open={!!lightbox} onClose={() => setLightbox(null)} />
      )}
    </>
  );
}
