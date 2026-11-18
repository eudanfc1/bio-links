'use client';

import { useEffect, useMemo, useState } from 'react';

type NoticeBarProps = {
  kicker: string;
  text: string;
  url: string;
  endsAt: string | null;
  accent: string;
};

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export default function NoticeBar({ kicker, text, url, endsAt, accent }: NoticeBarProps) {
  const [timeLeft, setTimeLeft] = useState<string>('00:00:00');
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!endsAt) return;

    const tick = () => {
      const diff = Math.max(0, new Date(endsAt).getTime() - Date.now());
      if (diff === 0) {
        setTimeLeft('00:00:00');
        setHidden(true);
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${pad(h)}:${pad(m)}:${pad(s)}`);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  if (hidden) return null;

  const parts = timeLeft.split(':');
  return (
    <a
      className="notice-bar"
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      hidden={hidden}
    >
      <span className="nb-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M3 10.5v3a1 1 0 0 0 1 1h2.2l5.3 3.7a1 1 0 0 0 1.5-.8V6.6a1 1 0 0 0-1.5-.8L6.2 9.5H4a1 1 0 0 0-1 1Z" />
          <path className="nb-wave" d="M16 9a4 4 0 0 1 0 6M18.6 6.4a7.6 7.6 0 0 1 0 11.2" />
        </svg>
      </span>
      <span className="nb-body">
        <span className="nb-kicker">
          <i className="nb-live" aria-hidden="true" />
          {kicker || 'AVISO'}
        </span>
        <span className="nb-text">{text}</span>
      </span>
      {endsAt && (
        <span className="nb-timer" aria-label="Tempo restante">
          <span className="nb-cell"><b data-unit="h">{parts[0]}</b><small>horas</small></span>
          <span className="nb-cell"><b data-unit="m">{parts[1]}</b><small>min</small></span>
          <span className="nb-cell"><b data-unit="s">{parts[2]}</b><small>seg</small></span>
        </span>
      )}
      <span className="nb-go" aria-hidden="true">
        <svg viewBox="0 0 24 24"><path d="m9.5 5.5 6.5 6.5-6.5 6.5" /></svg>
      </span>
    </a>
  );
}
