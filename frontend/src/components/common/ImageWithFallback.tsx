import React, { useState, useEffect } from 'react';
import { getImageUrl } from '@/utils/image';

// A simple SVG placeholder of a cat info icon/paw in gray
const CAT_ERROR_SVG = `
<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <rect width="200" height="200" fill="#f3f4f6"/>
  <path d="M100 60 C 70 60, 50 90, 50 120 C 50 150, 70 180, 100 180 C 130 180, 150 150, 150 120 C 150 90, 130 60, 100 60 Z" fill="#e5e7eb"/>
  <path d="M70 80 Q 60 40, 90 60" fill="#e5e7eb" stroke="#d1d5db" stroke-width="5"/>
  <path d="M130 80 Q 140 40, 110 60" fill="#e5e7eb" stroke="#d1d5db" stroke-width="5"/>
  <circle cx="85" cy="110" r="5" fill="#9ca3af"/>
  <circle cx="115" cy="110" r="5" fill="#9ca3af"/>
  <path d="M100 130 L 95 140 L 105 140 Z" fill="#9ca3af"/>
  <text x="100" y="170" font-family="Arial" font-size="14" text-anchor="middle" fill="#9ca3af">No Image</text>
</svg>
`;

const ERROR_IMG_SRC = `data:image/svg+xml;base64,${Buffer.from(CAT_ERROR_SVG).toString('base64')}`;

// Props definition extending standard img props
interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
}

export function ImageWithFallback(props: ImageWithFallbackProps) {
  const { src, alt, style, className, fallbackSrc = ERROR_IMG_SRC, ...rest } = props;
  const [imgSrc, setImgSrc] = useState<string>(getImageUrl(src, fallbackSrc));

  useEffect(() => {
    setImgSrc(getImageUrl(src, fallbackSrc));
  }, [src, fallbackSrc]);

  const handleError = () => {
    if (imgSrc !== getImageUrl(fallbackSrc)) {
      setImgSrc(getImageUrl(fallbackSrc));
    }
  };

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      style={style}
      onError={handleError}
      {...rest}
    />
  );
}
