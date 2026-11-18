'use client';

import { useEffect, useRef } from 'react';

export default function Particles() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    const count = isTouch ? 18 : 36;

    for (let i = 0; i < count; i++) {
      const dot = document.createElement('i');
      dot.className = 'particle';
      dot.style.left = `${(i * 73.13) % 100}%`;
      dot.style.top = `${(i * 37.73) % 100}%`;
      dot.style.animationDelay = `${-(i % 12)}s`;
      dot.style.width = dot.style.height = `${i % 4 === 0 ? 3 : 1.5}px`;
      container.appendChild(dot);
    }

    return () => { container.innerHTML = ''; };
  }, []);

  return <div className="particles" ref={containerRef} aria-hidden="true" />;
}
