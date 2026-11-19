'use client';

import { useState } from 'react';
import type { Story } from '@/lib/types';
import StoryViewer from './StoryViewer';

type Props = {
  stories: Story[];
  slug: string;
  avatarUrl?: string;
  handle?: string;
};

export default function StoryBar({ stories, slug, avatarUrl, handle }: Props) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [startIdx, setStartIdx] = useState(0);

  const active = stories.filter(s => new Date(s.expiresAt) > new Date());
  if (active.length === 0) return null;

  const open = (idx: number) => { setStartIdx(idx); setViewerOpen(true); };

  return (
    <>
      <div className="flex gap-3 overflow-x-auto px-5 py-3 @min-[600px]:px-8 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
        {/* Avatar principal com anel de story */}
        <button
          onClick={() => open(0)}
          className="flex shrink-0 flex-col items-center gap-1"
          aria-label="Ver stories"
        >
          <span className="story-ring block rounded-full p-[2px]" style={{
            background: 'linear-gradient(135deg, #833ab4, #e1306c, #fd1d1d, #fcb045)',
            padding: '2px',
          }}>
            <span className="block overflow-hidden rounded-full" style={{ width: 56, height: 56, background: '#111' }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt={handle || 'story'} className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-xl font-bold text-white">
                  {(handle || 'S')[0].toUpperCase()}
                </span>
              )}
            </span>
          </span>
          <span className="text-[9px] font-semibold text-white/70 max-w-[56px] truncate">
            {handle ? `@${handle}` : 'Stories'}
          </span>
        </button>

        {/* Thumbs extras se tiver mais de 1 story */}
        {active.length > 1 && active.slice(1).map((story, i) => (
          <button
            key={story.id}
            onClick={() => open(i + 1)}
            className="flex shrink-0 flex-col items-center gap-1"
            aria-label={story.caption || `Story ${i + 2}`}
          >
            <span className="block rounded-full" style={{
              background: 'linear-gradient(135deg, #833ab4, #e1306c, #fd1d1d)',
              padding: '2px',
            }}>
              <span className="block overflow-hidden rounded-full" style={{ width: 56, height: 56, background: '#111' }}>
                {story.mediaType === 'video' ? (
                  <span className="flex h-full w-full items-center justify-center bg-black/60">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="white">
                      <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z"/>
                    </svg>
                  </span>
                ) : (
                  <img src={`/api/stories/${slug}/${story.id}`} alt={story.caption || 'story'} className="h-full w-full object-cover" />
                )}
              </span>
            </span>
            <span className="text-[9px] text-white/60 max-w-[56px] truncate">
              {story.caption || `Story ${i + 2}`}
            </span>
          </button>
        ))}
      </div>

      {viewerOpen && (
        <StoryViewer
          stories={active}
          initialIndex={startIdx}
          slug={slug}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </>
  );
}
