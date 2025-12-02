// frontend/src/components/IntelliSense.tsx
import React, { useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { 
  Lightbulb, 
  Code, 
  FileText, 
  Key, 
  Zap 
} from 'lucide-react';

interface Suggestion {
  text: string;
  type: 'keyword' | 'property' | 'value' | 'identifier' | 'snippet';
  description: string;
  insertText: string;
  priority: number;
  detail?: string;
}

interface IntelliSenseProps {
  suggestions: Suggestion[];
  position: { top: number; left: number };
  onSelect: (suggestion: Suggestion) => void;
  onDismiss: () => void;
  selectedIndex: number;
}

const IntelliSense: React.FC<IntelliSenseProps> = ({
  suggestions,
  position,
  onSelect,
  selectedIndex
}) => {
  const { isDark } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to selected item
    if (containerRef.current && selectedIndex >= 0) {
      const selectedElement = containerRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  const getIconForType = (type: string) => {
    switch (type) {
      case 'keyword':
        return <Key size={14} className="text-purple-500" />;
      case 'snippet':
        return <Zap size={14} className="text-yellow-500" />;
      case 'property':
        return <FileText size={14} className="text-blue-500" />;
      case 'value':
        return <Code size={14} className="text-green-500" />;
      default:
        return <Lightbulb size={14} className="text-gray-500" />;
    }
  };

  const getTypeLabel = (type: string): string => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  if (suggestions.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className={`fixed z-50 ${
        isDark ? 'bg-[#1E1E1E] border-[#3F3F46]' : 'bg-white border-gray-300'
      } border rounded-lg shadow-xl overflow-hidden`}
      style={{
        top: position.top,
        left: position.left,
        maxHeight: '300px',
        minWidth: '350px',
        maxWidth: '500px'
      }}
    >
      <div className="overflow-y-auto max-h-[300px]">
        {suggestions.map((suggestion, index) => (
          <div
            key={index}
            className={`px-3 py-2 cursor-pointer flex items-start gap-3 transition-colors ${
              index === selectedIndex
                ? isDark
                  ? 'bg-[#094771]'
                  : 'bg-blue-50'
                : isDark
                ? 'hover:bg-[#2D2E30]'
                : 'hover:bg-gray-50'
            }`}
            onClick={() => onSelect(suggestion)}
            onMouseEnter={() => {}}
          >
            <div className="pt-0.5">
              {getIconForType(suggestion.type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`font-mono text-sm font-semibold ${
                  isDark ? 'text-[#F3F4F6]' : 'text-[#111827]'
                }`}>
                  {suggestion.text}
                </span>
                <span className={`text-xs px-1.5 py-0.5 rounded ${
                  isDark ? 'bg-[#3F3F46] text-[#A1A1AA]' : 'bg-gray-200 text-gray-600'
                }`}>
                  {getTypeLabel(suggestion.type)}
                </span>
              </div>
              
              <div className={`text-xs mt-0.5 ${
                isDark ? 'text-[#A1A1AA]' : 'text-gray-600'
              }`}>
                {suggestion.description}
              </div>
              
              {suggestion.detail && (
                <div className={`text-xs mt-1 font-mono ${
                  isDark ? 'text-[#6B7280]' : 'text-gray-500'
                }`}>
                  {suggestion.detail}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className={`px-3 py-1.5 text-xs border-t flex items-center justify-between ${
        isDark 
          ? 'bg-[#252526] border-[#3F3F46] text-[#6B7280]' 
          : 'bg-gray-50 border-gray-200 text-gray-500'
      }`}>
        <span>↑↓ Navigate</span>
        <span>↵ Select</span>
        <span>Esc Dismiss</span>
      </div>
    </div>
  );
};

export default IntelliSense;