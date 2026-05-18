import { useState, useCallback, useEffect } from 'react';

type Direction = 'horizontal' | 'vertical';

interface UseResizerProps {
  initialSize: number;
  direction: Direction;
  minSize?: number;
  maxSize?: number;
  storageKey?: string;
  reverse?: boolean; // If true, dragging down/right decreases size instead of increasing
}

export function useResizer({
  initialSize,
  direction,
  minSize = 100,
  maxSize = 800,
  storageKey,
  reverse = false
}: UseResizerProps) {
  const [size, setSize] = useState(() => {
    if (storageKey) {
      const stored = localStorage.getItem(storageKey);
      if (stored) return parseInt(stored, 10);
    }
    return initialSize;
  });

  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (storageKey) {
      localStorage.setItem(storageKey, size.toString());
    }
  }, [size, storageKey]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);

    const startPos = direction === 'horizontal' ? e.clientX : e.clientY;
    const startSize = size;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const currentPos = direction === 'horizontal' ? moveEvent.clientX : moveEvent.clientY;
      const diff = currentPos - startPos;
      
      let newSize = reverse ? startSize - diff : startSize + diff;
      
      if (newSize < minSize) newSize = minSize;
      if (maxSize && newSize > maxSize) newSize = maxSize;
      
      setSize(newSize);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [direction, reverse, size, minSize, maxSize]);

  return { size, isDragging, handleMouseDown, setSize };
}
