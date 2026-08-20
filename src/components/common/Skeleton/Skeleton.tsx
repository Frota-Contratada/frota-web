import { type CSSProperties } from 'react';
import styles from './Skeleton.module.css';

export interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded' | 'card';
  width?: string | number;
  height?: string | number;
  className?: string;
  count?: number;
  style?: CSSProperties;
}

export function Skeleton({
  variant = 'text',
  width,
  height,
  className = '',
  count = 1,
  style,
}: SkeletonProps) {
  const customStyle: CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    ...style,
  };

  if (count > 1) {
    return (
      <>
        {Array.from({ length: count }, (_, i) => (
          <span
            key={i}
            className={`${styles.skeleton} ${styles[variant]} ${className}`}
            style={customStyle}
            aria-hidden="true"
          />
        ))}
      </>
    );
  }

  return (
    <span
      className={`${styles.skeleton} ${styles[variant]} ${className}`}
      style={customStyle}
      aria-hidden="true"
    />
  );
}
