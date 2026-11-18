'use client';

type Story = {
  id: string;
  mediaUrl: string;
  caption: string;
  mediaType: 'image' | 'video';
};

type Props = {
  story: Story;
  onClick: () => void;
};

export default function StoryCircle({ story, onClick }: Props) {
  return (
    <div className="story-item" onClick={onClick}>
      <div className="story-ring">
        {story.mediaType === 'video' ? (
          <div style={{
            width: '100%', height: '100%', borderRadius: '50%',
            background: 'var(--acc)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="#fff">
              <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" />
            </svg>
          </div>
        ) : (
          <img src={story.mediaUrl} alt={story.caption || 'Story'} />
        )}
      </div>
      <span className="story-name">{story.caption || 'Story'}</span>
    </div>
  );
}
