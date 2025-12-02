// frontend/src/components/ResizablePanel.tsx
import React, { useState, useRef, useEffect } from 'react';

interface ResizablePanelProps {
  direction: 'horizontal' | 'vertical';
  initialSize?: number;
  minSize?: number;
  maxSize?: number;
  children: [React.ReactNode, React.ReactNode];
  className?: string;
}

const ResizablePanel: React.FC<ResizablePanelProps> = ({
  direction,
  initialSize = 50,
  minSize = 20,
  maxSize = 80,
  children,
  className = ''
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [size, setSize] = useState(initialSize);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      let newSize;

      if (direction === 'horizontal') {
        const totalWidth = containerRect.width;
        const mouseX = e.clientX - containerRect.left;
        newSize = (mouseX / totalWidth) * 100;
      } else {
        const totalHeight = containerRect.height;
        const mouseY = e.clientY - containerRect.top;
        newSize = (mouseY / totalHeight) * 100;
      }

      // Constrain size within min/max bounds
      newSize = Math.max(minSize, Math.min(maxSize, newSize));
      setSize(newSize);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, direction, minSize, maxSize]);

  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const panelStyle = direction === 'horizontal' 
    ? { gridTemplateColumns: `${size}% 4px ${100 - size}%` }
    : { gridTemplateRows: `${size}% 4px ${100 - size}%` };

  return (
    <div
      ref={containerRef}
      className={`grid ${direction === 'horizontal' ? 'grid-cols-[1fr_4px_1fr]' : 'grid-rows-[1fr_4px_1fr]'} ${className}`}
      style={panelStyle}
    >
      {/* First Panel */}
      <div className="overflow-hidden">
        {children[0]}
      </div>

      {/* Resize Handle */}
      <div
        className={`
          relative group
          ${direction === 'horizontal' 
            ? 'cursor-col-resize hover:bg-blue-300' 
            : 'cursor-row-resize hover:bg-blue-300'
          }
          ${isDragging ? 'bg-blue-400' : 'bg-gray-300'}
          transition-colors duration-150
        `}
        onMouseDown={handleDragStart}
      >
        <div className={`
          absolute inset-0 flex items-center justify-center
          ${direction === 'horizontal' ? 'flex-col' : 'flex-row'}
        `}>
          <div className={`
            ${direction === 'horizontal' 
              ? 'w-1 h-6 bg-gray-400 group-hover:bg-blue-500' 
              : 'h-1 w-6 bg-gray-400 group-hover:bg-blue-500'
            }
            rounded-full transition-colors duration-150
          `} />
        </div>
      </div>

      {/* Second Panel */}
      <div className="overflow-hidden">
        {children[1]}
      </div>
    </div>
  );
};

export default ResizablePanel;