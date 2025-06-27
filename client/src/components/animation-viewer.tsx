import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GitCommit } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface AnimationViewerProps {
  fromContent: string;
  toContent: string;
  progress: number;
  selectedFile: string;
  commit?: {
    oid: string;
    message: string;
    author: string;
    date: string;
  };
}

export function AnimationViewer({ fromContent, toContent, progress, selectedFile, commit }: AnimationViewerProps) {
  const [tooltip, setTooltip] = useState({ 
    visible: false, 
    content: '', 
    x: 0, 
    y: 0 
  });

  const handleLineClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltip({ 
      visible: true, 
      content: commit?.message || "No commit message available.", 
      x: rect.left + window.scrollX, 
      y: rect.top + window.scrollY - 10 
    });
  }, [commit]);

  const handleCloseTooltip = useCallback(() => {
    if (tooltip.visible) {
      setTooltip({ ...tooltip, visible: false });
    }
  }, [tooltip]);

  // Simple diff visualization (without external library for now)
  const renderDiff = () => {
    if (!fromContent || !toContent) {
      return (
        <div className="text-muted-foreground p-4 text-center">
          No file content available for comparison
        </div>
      );
    }

    const fromLines = fromContent.split('\n');
    const toLines = toContent.split('\n');
    const maxLines = Math.max(fromLines.length, toLines.length);

    return (
      <div className="space-y-1">
        {Array.from({ length: maxLines }, (_, i) => {
          const fromLine = fromLines[i] || '';
          const toLine = toLines[i] || '';
          const isDifferent = fromLine !== toLine;
          const isAdded = !fromLine && toLine;
          const isRemoved = fromLine && !toLine;
          
          const bgColor = isAdded 
            ? `rgba(22, 163, 74, ${progress * 0.3})` 
            : isRemoved 
            ? `rgba(220, 38, 38, ${(1 - progress) * 0.3})` 
            : isDifferent 
            ? `rgba(234, 179, 8, ${progress * 0.2})`
            : 'rgba(0, 0, 0, 0)';

          const sign = isAdded ? '+' : isRemoved ? '-' : isDifferent ? '~' : ' ';
          const lineColor = isAdded 
            ? 'text-green-400' 
            : isRemoved 
            ? 'text-red-400' 
            : isDifferent 
            ? 'text-yellow-400'
            : 'text-muted-foreground';

          return (
            <motion.div
              key={i}
              className={`flex ${isDifferent ? 'cursor-pointer' : ''}`}
              initial={{ opacity: 0, x: isAdded ? 20 : (isRemoved ? -20 : 0) }}
              animate={{ 
                opacity: isAdded ? progress : (isRemoved ? 1 - progress : 1), 
                x: 0,
                backgroundColor: bgColor
              }}
              onClick={isDifferent ? handleLineClick : undefined}
            >
              <span className={`w-8 select-none ${lineColor} text-xs`}>
                {sign}
              </span>
              <span className="flex-1 text-xs font-mono">
                {progress > 0.5 ? toLine : fromLine}
              </span>
            </motion.div>
          );
        })}
      </div>
    );
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0 pb-3">
        <div className="text-sm font-medium">
          {selectedFile || "Select a file to see changes"}
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto p-4 bg-slate-900 text-slate-100 rounded-b-lg">
        <div className="relative" onClick={handleCloseTooltip}>
          {renderDiff()}
          
          <AnimatePresence>
            {tooltip.visible && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                style={{ top: tooltip.y, left: tooltip.x }}
                className="absolute max-w-sm bg-black/90 text-white text-xs rounded-lg px-3 py-2 shadow-lg backdrop-blur-sm z-50 pointer-events-none -translate-y-full"
              >
                <div className="flex items-start gap-2">
                  <GitCommit size={14} className="mt-0.5 flex-shrink-0 text-slate-400" />
                  <span>{tooltip.content}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}