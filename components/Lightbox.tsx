'use client';

import { useEffect, useRef } from 'react';

type LightboxProps = {
  src: string;
  alt: string;
  open: boolean;
  onClose: () => void;
};

export default function Lightbox({ src, alt, open, onClose }: LightboxProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!open) return;
    const el = dialogRef.current;
    if (!el) return;
    el.showModal();
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const close = () => {
    dialogRef.current?.close();
    onClose();
  };

  return (
    <dialog ref={dialogRef} id="image-lightbox" className="lightbox" onCancel={close}>
      <button className="lightbox-close" onClick={close} aria-label="Fechar">
        <svg viewBox="0 0 24 24" width="28" height="28">
          <path d="M7 7l10 10M17 7L7 17" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </button>
      <img
        ref={imgRef}
        className="lightbox-image"
        src={src}
        alt={alt}
        onClick={close}
      />
    </dialog>
  );
}
