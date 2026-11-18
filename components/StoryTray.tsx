'use client';

import type { Story } from '@/lib/types';

type Props = {
  stories: Story[];
  accent: string;
  /** Slug usado para compor o caminho dos stories (ex: /api/stories/{slug}). */
  slug: string;
};

export default function StoryTray({ stories, accent, slug }: Props) {
  if (stories.length === 0) return null;

  return (
    <div className="story-tray">
      {stories.map((story) => (
        <button
          key={story.id}
          className="story-item"
          onClick={() => openStoryViewer(story, slug)}
          aria-label={`Story: ${story.caption || 'Sem legenda'}`}
        >
          <span className="story-ring" style={{ '--story-accent': accent } as React.CSSProperties}>
            <span className="story-thumb">
              {story.mediaType === 'video' ? (
                <video src={`/api/stories/${slug}/${story.id}`} preload="metadata" />
              ) : (
                <img
                  src={`/api/stories/${slug}/${story.id}`}
                  alt={story.caption}
                  loading="lazy"
                />
              )}
            </span>
            <span className="story-label">{story.caption || 'Story'}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

function openStoryViewer(story: Story, slug: string) {
  // Cria um lightbox de story.
  const overlay = document.createElement('div');
  overlay.className = 'story-overlay';
  overlay.innerHTML = `
    <div class="story-viewer">
      <div class="story-bar"><span></span><span></span></div>
      <div class="story-media-wrap">
        ${story.mediaType === 'video'
          ? `<video src="/api/stories/${slug}/${story.id}" autoplay controls />`
          : `<img src="/api/stories/${slug}/${story.id}" alt="${escapeHtml(story.caption)}" />`}
      </div>
      ${story.caption ? `<p class="story-caption">${escapeHtml(story.caption)}</p>` : ''}
      <button class="story-close" aria-label="Fechar story">
        <svg viewBox="0 0 24 24"><path d="M7 7l10 10M17 7L7 17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      </button>
    </div>
  `;

  const close = () => overlay.remove();
  overlay.querySelector('.story-close')?.addEventListener('click', close);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';
  overlay.addEventListener('click', close);
  (overlay.firstElementChild as HTMLElement)?.addEventListener('click', (e) => e.stopPropagation());
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
