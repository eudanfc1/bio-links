'use client';

import { useEffect, useState } from 'react';

import { JOGOS, corDaPorcentagem, matizDoJogo, porcentagemDoJogo } from '@/lib/games';

/**
 * Grade "Nossos jogos": miniatura, nome e barra de porcentagem por jogo.
 *
 * As porcentagens são calculadas só no navegador (depois da montagem) para o
 * HTML do servidor não divergir da hidratação quando a janela de 10 minutos
 * virar entre um e outro. Enquanto não monta, a barra aparece vazia.
 */
export default function GamesGrid({ href }: { href?: string }) {
  const [valores, setValores] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    const calcular = () => {
      setValores(Object.fromEntries(JOGOS.map((jogo) => [jogo.id, porcentagemDoJogo(jogo.id)])));
    };
    calcular();
    // Reavalia a cada 30s para pegar a virada da janela de 10 minutos.
    const timer = setInterval(calcular, 30_000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase text-muted-foreground">
        <span className="h-1 w-1 bg-brand" />
        Nossos jogos
        <svg
          viewBox="0 0 24 24"
          width="14"
          height="14"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-3.5 w-3.5 text-brand-soft"
          aria-hidden="true"
        >
          <line x1="6" x2="10" y1="11" y2="11" />
          <line x1="8" x2="8" y1="9" y2="13" />
          <line x1="15" x2="15.01" y1="12" y2="12" />
          <line x1="18" x2="18.01" y1="10" y2="10" />
          <path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z" />
        </svg>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="flex items-center gap-2 text-[13px] font-bold text-foreground/85 @min-[600px]:text-sm">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
          <span className="relative flex h-2.5 w-2.5 shrink-0" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          Porcentagem de jogos
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 @min-[600px]:gap-3">
        {JOGOS.map((jogo) => {
          const pct = valores?.[jogo.id];
          const cor = pct === undefined ? 'rgba(255,255,255,.25)' : corDaPorcentagem(pct);
          const matiz = matizDoJogo(jogo.id);
          // Link próprio do jogo tem prioridade; senão usa o link geral dos jogos.
          const destino = (jogo.href || href || '').trim();
          const Tag = destino ? 'a' : 'div';

          return (
            <Tag
              key={jogo.id}
              {...(destino ? { href: destino, target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="group relative flex flex-col overflow-hidden rounded-lg border border-white/10 bg-black/40 no-underline"
            >
              <span className="relative block aspect-square overflow-hidden">
                {jogo.img ? (
                  <>
                    {/* A arte é deitada (3:2) e o card é quadrado: o fundo é a
                        própria imagem desfocada, assim nada é cortado. */}
                    <img
                      alt=""
                      aria-hidden="true"
                      src={jogo.img}
                      className="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover blur-md opacity-60"
                    />
                    <img
                      alt={jogo.name}
                      src={jogo.img}
                      className="relative z-10 h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                    />
                  </>
                ) : (
                  <span
                    className="grid h-full w-full place-items-center"
                    style={{
                      background: `linear-gradient(145deg, hsl(${matiz} 65% 32%), hsl(${(matiz + 40) % 360} 70% 18%))`,
                    }}
                  >
                    <span className="font-arena text-xl font-extrabold uppercase text-white/85">
                      {jogo.name.slice(0, 2)}
                    </span>
                  </span>
                )}
              </span>

              <span className="block px-1.5 pb-1.5 pt-1 @min-[600px]:px-2">
                <span className="block truncate text-[9px] font-bold leading-tight text-foreground @min-[600px]:text-[11px]">
                  {jogo.name}
                </span>
                <span
                  className="mt-1 flex h-3.5 items-center overflow-hidden rounded-full bg-white/10 @min-[600px]:h-4"
                  role="img"
                  aria-label={`Porcentagem de jogos: ${pct ?? 0}%`}
                >
                  <span
                    className="flex h-full items-center justify-start rounded-full pl-1.5 transition-[width,background-color] duration-700 ease-out"
                    style={{ width: `${pct ?? 0}%`, backgroundColor: cor }}
                  >
                    <span className="whitespace-nowrap text-[8px] font-extrabold tabular-nums text-black/80 @min-[600px]:text-[9px]">
                      {pct === undefined ? '' : `${pct}%`}
                    </span>
                  </span>
                </span>
              </span>
            </Tag>
          );
        })}
      </div>
    </>
  );
}
