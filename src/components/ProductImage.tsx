'use client';
import { useState } from 'react';
import { ImageOff } from 'lucide-react';

interface Props {
  src?: string | null;
  alt?: string;
  className?: string;
}

export function ProductImage({ src, alt = '', className = '' }: Props) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 text-slate-400 ${className}`}>
        <ImageOff className="h-6 w-6" />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} onError={() => setFailed(true)} />
  );
}
