'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Story } from '@/lib/types';

type Props = {
  stories: Story[];
  initialIndex?: number;
  onClose: () => void;
  slug: string;
};

const STORY_DURATION = 7000; // 7s para imagens; vídeos avançam quando terminam

export default function StoryViewer({ stories, initialIndex = 0, onClose, slug }: Props) {
  const [current, setCurrent] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef<number>(Date.now());
  const accRef = useRef<number>(0);

  const story = stories[current];
  const isVideo = story?.mediaType === 'video';

  const goTo = useCallback((idx: number) => {
    if (idx >= stories.length) { onClose(); return; }
    if (idx < 0) { onClose(); return; }
    setCurrent(idx);
    setProgress(0);
    accRef.current = 0;
    startRef.current = Date.now();
  }, [stories.length, onClose]);

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  // Timer para imagens
  useEffect(() => {
    if (isVideo) return;
    if (paused) return;

    startRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      const elapsed = accRef.current + (Date.now() - startRef.current);
      const pct = Math.min((elapsed / STORY_DURATION) * 100, 100);
      setProgress(pct);
      if (pct >= 100) next();
    }, 50);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [current, isVideo, paused, next]);

  // Para vídeo: avança quando termina
  useEffect(() => {
    if (!isVideo) return;
    const v = videoRef.current;
    if (!v) return;
    setProgress(0);

    const onTimeUpdate = () => {
      if (v.duration) setProgress((v.currentTime / v.duration) * 100);
    };
    const onEnded = () => next();

    v.addEventListener('timeupdate', onTimeUpdate);
    v.addEventListener('ended', onEnded);
    return () => {
      v.removeEventListener('timeupdate', onTimeUpdate);
      v.removeEventListener('ended', onEnded);
    };
  }, [current, isVideo, next]);

  // Pausa/retoma o vídeo
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !isVideo) return;
    if (paused) v.pause(); else v.play().catch(() => {});
  }, [paused, isVideo]);

  // Pausa acumulando tempo
  const handlePause = () => {
    if (paused) {
      startRef.current = Date.now();
    } else {
      accRef.current += Date.now() - startRef.current;
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    setPaused(p => !p);
  };

  // Fechar com ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, next, prev]);

  if (!story) return null;

  const mediaUrl = `/api/stories/${slug}/${story.id}`;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black"
      style={{ touchAction: 'none' }}
    >
      {/* Story card */}
      <div className="relative mx-auto flex h-full w-full max-w-sm flex-col overflow-hidden bg-black select-none">

        {/* Progress bars */}
        <div className="absolute top-0 left-0 right-0 z-30 flex gap-1 p-2">
          {stories.map((_, i) => (
            <div key={i} className="h-[2px] flex-1 overflow-hidden rounded-full bg-white/30">
              <div
                className="h-full bg-white transition-none"
                style={{
                  width: i < current ? '100%' : i === current ? `${progress}%` : '0%',
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-6 left-0 right-0 z-30 flex items-center gap-3 px-4 pt-1">
          <div className="h-8 w-8 overflow-hidden rounded-full border-2 border-white/60">
            <div className="h-full w-full bg-brand/40 flex items-center justify-center text-xs font-bold text-white">S</div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white leading-tight truncate">Story</p>
            <p className="text-[10px] text-white/60 leading-tight">
              {story.caption || ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-full text-white/80 hover:text-white"
            aria-label="Fechar"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Media */}
        <div className="relative flex h-full w-full items-center justify-center bg-black">
          {isVideo ? (
            <video
              ref={videoRef}
              src={mediaUrl}
              className="h-full w-full object-contain"
              autoPlay
              playsInline
              preload="auto"
            />
          ) : (
            <img
              src={mediaUrl}
              alt={story.caption || 'Story'}
              className="h-full w-full object-contain"
              draggable={false}
            />
          )}
        </div>

        {/* Caption */}
        {story.caption && (
          <div className="absolute bottom-16 left-0 right-0 z-30 px-4">
            <p className="rounded-lg bg-black/50 px-3 py-2 text-center text-sm text-white backdrop-blur-sm">
              {story.caption}
            </p>
          </div>
        )}

        {/* Touch / click zones */}
        <div className="absolute inset-0 z-20 flex">
          {/* Prev */}
          <div
            className="h-full w-1/3"
            onClick={prev}
            onPointerDown={() => handlePause()}
            onPointerUp={() => paused && handlePause()}
          />
          {/* Pause (centro) */}
          <div
            className="h-full flex-1"
            onPointerDown={() => handlePause()}
            onPointerUp={() => handlePause()}
          />
          {/* Next */}
          <div
            className="h-full w-1/3"
            onClick={next}
            onPointerDown={() => handlePause()}
            onPointerUp={() => paused && handlePause()}
          />
        </div>

        {/* Nav arrows (desktop) */}
        <button
          onClick={prev}
          className="absolute left-2 top-1/2 z-40 -translate-y-1/2 hidden sm:flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60"
          aria-label="Story anterior"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
        <button
          onClick={next}
          className="absolute right-2 top-1/2 z-40 -translate-y-1/2 hidden sm:flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60"
          aria-label="Próximo story"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
