'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import './gate.css';

/** Duração do gesto contínuo até completar (ms). */
const HOLD_MS = 1100;
/** Tempo que o anel leva para esvaziar ao soltar antes do fim (ms). */
const DECAY_MS = 380;
/** Circunferência do anel de progresso (r = 54). */
const CIRC = 2 * Math.PI * 54;

/** Caminhos da digital (idênticos aos do gate original). */
const PRINT_PATHS = [
  'M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4',
  'M14 13.12c0 2.38 0 6.38-1 8.88',
  'M17.29 21.02c.12-.6.43-2.3.5-3.02',
  'M2 12a10 10 0 0 1 18-6',
  'M2 16h.01',
  'M21.8 16c.2-2 .131-5.354 0-6',
  'M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2',
  'M8.65 22c.21-.66.45-1.32.57-2',
  'M9 6.8a6 6 0 0 1 9 5.2v2',
];

/**
 * Trevos de quatro folhas que flutuam ao fundo do gate.
 *
 * As posições são fixas de propósito: se usássemos `Math.random`, o HTML
 * do servidor e o do cliente divergiriam e a hidratação quebraria.
 *   x, y  → posição em % da tela
 *   s     → tamanho em px
 *   d     → duração do ciclo em segundos
 *   t     → atraso (negativo = começa no meio do ciclo)
 *   dx    → quanto o trevo balança para o lado
 */
const CLOVERS = [
  { x: 5, y: 12, s: 30, d: 14, t: 0, dx: 26 },
  { x: 16, y: 60, s: 22, d: 17, t: -5, dx: -20 },
  { x: 27, y: 24, s: 26, d: 15, t: -9, dx: 18 },
  { x: 11, y: 84, s: 18, d: 18, t: -12, dx: -14 },
  { x: 30, y: 76, s: 20, d: 13, t: -3, dx: 22 },
  { x: 7, y: 42, s: 15, d: 20, t: -14, dx: -12 },
  { x: 68, y: 8, s: 24, d: 16, t: -6, dx: 24 },
  { x: 83, y: 32, s: 32, d: 14, t: -2, dx: -26 },
  { x: 72, y: 70, s: 20, d: 18, t: -13, dx: 16 },
  { x: 91, y: 56, s: 24, d: 15, t: -9, dx: -18 },
  { x: 85, y: 87, s: 17, d: 19, t: -5, dx: 20 },
  { x: 66, y: 92, s: 27, d: 13, t: -16, dx: -22 },
  { x: 95, y: 14, s: 18, d: 17, t: -7, dx: 14 },
  { x: 34, y: 6, s: 16, d: 21, t: -11, dx: 12 },
  { x: 67, y: 44, s: 14, d: 16, t: -4, dx: -10 },
  { x: 2, y: 70, s: 20, d: 15, t: -8, dx: 16 },
  { x: 45, y: 50, s: 28, d: 16, t: -2, dx: 22 },
  { x: 58, y: 25, s: 19, d: 19, t: -10, dx: -16 },
  { x: 38, y: 90, s: 23, d: 14, t: -7, dx: 20 },
  { x: 78, y: 15, s: 21, d: 18, t: -13, dx: -14 },
  { x: 23, y: 55, s: 25, d: 15, t: -5, dx: 18 },
  { x: 52, y: 68, s: 17, d: 20, t: -11, dx: -22 },
  { x: 88, y: 42, s: 22, d: 17, t: -8, dx: 16 },
  { x: 14, y: 35, s: 20, d: 13, t: -15, dx: -12 },
  { x: 72, y: 85, s: 24, d: 16, t: -3, dx: 20 },
  { x: 42, y: 78, s: 16, d: 21, t: -9, dx: -18 },
  { x: 60, y: 10, s: 28, d: 14, t: -6, dx: 24 },
  { x: 35, y: 45, s: 18, d: 19, t: -12, dx: -14 },
  { x: 80, y: 60, s: 22, d: 15, t: -4, dx: 22 },
  { x: 10, y: 95, s: 20, d: 17, t: -8, dx: -16 },
  { x: 50, y: 38, s: 26, d: 13, t: -14, dx: 18 },
  { x: 90, y: 75, s: 15, d: 20, t: -10, dx: -20 },
];

const SLOTS: typeof CLOVERS = [];

type GateProps = {
  /** Cores do tema do perfil, aplicadas como variáveis `--site-*`. */
  accent: string;
  bg: string;
  text: string;
  muted: string;
  surface: string;
  /** Banner usado como fundo desfocado. */
  coverUrl?: string | null;
  name: string;
  handle: string;
  /** Foto de perfil. */
  avatarUrl?: string | null;
  /** Exibe o selo de perfil oficial. */
  verified?: boolean;
  /** Chamado no instante em que a verificação é concluída. */
  onUnlock: () => void;
  /** Chamado depois que o gate termina a animação de saída. */
  onGone?: () => void;
};

export default function Gate({
  accent,
  bg,
  text,
  muted,
  surface,
  coverUrl,
  name,
  handle,
  avatarUrl,
  verified,
  onUnlock,
  onGone,
}: GateProps) {
  const gateRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const ringRef = useRef<SVGCircleElement>(null);
  const frameRef = useRef<number | null>(null);
  const progressRef = useRef(0);
  const holdingRef = useRef(false);
  const doneRef = useRef(false);
  const lastRef = useRef(0);

  const [holding, setHolding] = useState(false);
  const [done, setDone] = useState(false);
  const [hasPhoto, setHasPhoto] = useState(false);
  const [imgReady, setImgReady] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Quando a foto carrega, marca como pronta.
  const handleImgLoad = useCallback(() => {
    setImgReady(true);
    setHasPhoto(true);
  }, []);
  const handleImgError = useCallback(() => {
    setImgReady(false);
    setHasPhoto(false);
  }, []);

  // Pré-carrega a imagem de perfil em memória para que o navegador
  // tenha o cache pronto antes de renderizar o <img>.
  useEffect(() => {
    if (!avatarUrl || hasPhoto) return;
    const img = new Image();
    img.src = avatarUrl;
    const done = () => {
      setImgReady(true);
      setHasPhoto(true);
    };
    img.onload = done;
    img.onerror = handleImgError;
    if (img.complete) done();
  }, [avatarUrl, hasPhoto, handleImgError]);
  const [title, setTitle] = useState('Segure para entrar');
  const [hint, setHint] = useState('Toque e segure o círculo até ele completar.');

  const reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  /** Escreve o progresso no anel e na variável CSS `--hg-p`. */
  const paint = useCallback(() => {
    const p = progressRef.current;
    if (ringRef.current) {
      ringRef.current.style.strokeDasharray = String(CIRC);
      ringRef.current.style.strokeDashoffset = String(CIRC * (1 - p));
    }
    gateRef.current?.style.setProperty('--hg-p', p.toFixed(3));
  }, []);

  const stopLoop = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  }, []);

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    holdingRef.current = false;
    progressRef.current = 1;
    paint();
    stopLoop();

    setHolding(false);
    setDone(true);
    setTitle('Liberado!');
    setHint('Abrindo a página…');

    if (navigator.vibrate) {
      try { navigator.vibrate([18, 40, 26]); } catch { /* sem suporte */ }
    }

    onUnlock();

    // A página já aparece atrás; o gate some com uma revelação a partir do botão.
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      gateRef.current?.style.setProperty('--hg-x', `${rect.left + rect.width / 2}px`);
      gateRef.current?.style.setProperty('--hg-y', `${rect.top + rect.height / 2}px`);
    }

    window.setTimeout(() => {
      gateRef.current?.classList.add('hg-leave');
      window.setTimeout(() => onGone?.(), reduceMotion ? 200 : 900);
    }, reduceMotion ? 150 : 520);
  }, [onGone, onUnlock, paint, reduceMotion, stopLoop]);

  const tick = useCallback((now: number) => {
    const dt = Math.min(64, now - (lastRef.current || now));
    lastRef.current = now;

    // Segurando enche em HOLD_MS; soltando esvazia rápido (gesto contínuo).
    const p = holdingRef.current
      ? Math.min(1, progressRef.current + dt / HOLD_MS)
      : Math.max(0, progressRef.current - dt / DECAY_MS);
    progressRef.current = p;
    paint();

    if (p >= 1 && holdingRef.current) return finish();
    if (holdingRef.current || p > 0) {
      frameRef.current = requestAnimationFrame(tick);
    } else {
      frameRef.current = null;
    }
  }, [finish, paint]);

  const start = useCallback(() => {
    if (doneRef.current || holdingRef.current) return;
    holdingRef.current = true;
    lastRef.current = 0;
    setHolding(true);
    setTitle('Continue segurando…');
    setHint('Quase lá, não solte.');

    if (navigator.vibrate) {
      try { navigator.vibrate(12); } catch { /* sem suporte */ }
    }
    if (frameRef.current === null) {
      frameRef.current = requestAnimationFrame(tick);
    }
  }, [tick]);

  const stop = useCallback(() => {
    if (doneRef.current || !holdingRef.current) return;
    holdingRef.current = false;
    setHolding(false);
    if (progressRef.current < 1) {
      setTitle('Segure para entrar');
      setHint('Você soltou cedo. Segure até completar o círculo.');
    }
    if (frameRef.current === null) {
      frameRef.current = requestAnimationFrame(tick);
    }
  }, [tick]);

  useEffect(() => () => stopLoop(), [stopLoop]);

  const displayName = (name || 'Meus links').trim();
  const displayHandle = handle
    ? handle.startsWith('@')
      ? handle
      : `@${handle}`
    : '';

  const banner = coverUrl && /^https?:\/\//i.test(coverUrl) ? coverUrl : null;

  return (
    <div
      ref={gateRef}
      className={`hold-gate${done ? ' hg-done' : ''}${holding ? ' hg-holding' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="hg-title"
      aria-describedby="hg-hint"
      style={{
        '--site-accent': accent,
        '--site-background': bg,
        '--site-text': text,
        '--site-muted': muted,
        '--site-card': surface,
        ...(banner ? { '--hg-banner': `url("${banner}")` } : null),
      } as React.CSSProperties}
    >
      <div className="hg-backdrop" aria-hidden="true">
        <span className="hg-banner" />
        <span className="hg-orb one" />
        <span className="hg-orb two" />
        <span className="hg-grain" />
      </div>

      <div className="hg-clovers" aria-hidden="true">
        {CLOVERS.map((c, i) => (
          <span
            key={`c${i}`}
            className="hg-clover"
            style={{
              '--hg-cx': `${c.x}%`,
              '--hg-cy': `${c.y}%`,
              '--hg-csize': `${c.s}px`,
              '--hg-cdur': `${c.d}s`,
              '--hg-cdelay': `${c.t}s`,
              '--hg-cdx': `${c.dx}px`,
            } as React.CSSProperties}
          >
            🍀
          </span>
        ))}
      </div>

      <div className="hg-card-wrap">
        <span className="hg-laser" aria-hidden="true" />
        <div className="hg-card">
          <span className="hg-chip">
            <i className="hg-live" aria-hidden="true" />
            Verificação rápida
          </span>

        <div className="hg-profile">
          <span className={`hg-avatar${hasPhoto ? ' has-photo' : ''}`} aria-hidden="true">
            <span className="hg-avatar-inner">
              {!imgReady && <span className="hg-initial">{displayName.slice(0, 1).toUpperCase()}</span>}
              {avatarUrl && <img ref={imgRef} src={avatarUrl} alt="" fetchPriority="high" decoding="sync" onLoad={handleImgLoad} onError={handleImgError} />}
            </span>
          </span>

          <span className="hg-who">
            <strong className="hg-name">{displayName}</strong>
            <span className="hg-handle">{displayHandle || 'Página oficial'}</span>
          </span>

          {verified && (
            <svg className="hg-badge" viewBox="0 0 24 24" aria-label="Perfil oficial">
              <path d="m12 2 3 2 3.5.5L20 8l2 4-2 3-1.5 3.5L15 20l-3 2-3-2-3.5-1.5L4 15l-2-3 2-4 1.5-3.5L9 4Z" />
              <path d="m8 12 2.5 2.5L16 9" />
            </svg>
          )}
        </div>

        <button
          ref={buttonRef}
          className="hg-hold"
          type="button"
          aria-label={`Segure para entrar na página de ${displayName}`}
          onPointerDown={(e) => {
            if (e.button !== undefined && e.button > 0) return;
            e.preventDefault();
            try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* ignora */ }
            start();
          }}
          onPointerUp={stop}
          onPointerCancel={stop}
          onLostPointerCapture={stop}
          onContextMenu={(e) => e.preventDefault()}
          onKeyDown={(e) => {
            if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
              e.preventDefault();
              start();
            }
          }}
          onKeyUp={(e) => {
            if (e.key === ' ' || e.key === 'Enter') {
              e.preventDefault();
              stop();
            }
          }}
          onBlur={stop}
        >
          <span className="hg-pulse" aria-hidden="true" />
          <span className="hg-pulse two" aria-hidden="true" />

          <svg className="hg-ring" viewBox="0 0 120 120" aria-hidden="true">
            <circle className="hg-ring-track" cx="60" cy="60" r="54" />
            <circle ref={ringRef} className="hg-ring-fill" cx="60" cy="60" r="54" />
          </svg>

          <span className="hg-core" aria-hidden="true">
            <svg className="hg-print base" viewBox="0 0 24 24">
              {PRINT_PATHS.map((d) => <path key={d} d={d} />)}
            </svg>
            <svg className="hg-print fill" viewBox="0 0 24 24">
              {PRINT_PATHS.map((d) => <path key={d} d={d} />)}
            </svg>
            <span className="hg-scan" />
            <svg className="hg-check" viewBox="0 0 24 24">
              <path d="m5 12.5 4.5 4.5L19 7.5" />
            </svg>
          </span>
        </button>

        <h2 className="hg-title" id="hg-title" aria-live="polite">{title}</h2>
        <p className="hg-hint" id="hg-hint">{hint}</p>

        <div className="hg-steps" aria-hidden="true">
          <i style={{ '--n': 0 } as React.CSSProperties} />
          <i style={{ '--n': 1 } as React.CSSProperties} />
          <i style={{ '--n': 2 } as React.CSSProperties} />
        </div>

        <p className="hg-foot">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 3 5 6v5c0 4.5 3 8.3 7 9.5 4-1.2 7-5 7-9.5V6Z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
          Acesso protegido contra robôs
        </p>
      </div>
      </div>
    </div>
  );
}
