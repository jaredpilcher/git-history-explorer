import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GitCommit } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { diffLines } from 'diff';

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

  // Enhanced diff visualization with proper line-by-line diffing
  const diffParts = useMemo(() => {
    if (!fromContent || !toContent) return [];
    return diffLines(fromContent, toContent);
  }, [fromContent, toContent]);

  const renderDiff = () => {
    if (!fromContent || !toContent) {
      return (
        <div className="text-muted-foreground p-4 text-center">
          No file content available for comparison
        </div>
      );
    }

    if (diffParts.length === 0) {
      return (
        <div className="text-muted-foreground p-4 text-center">
          No differences found between the selected commits
        </div>
      );
    }

    return (
      <div className="space-y-0.5">
        {diffParts.map((part, index) => {
          const isAdded = part.added;
          const isRemoved = part.removed;
          const isUnchanged = !isAdded && !isRemoved;
          
          // Split the part value into lines for better visualization
          const lines = part.value.split('\n').filter((line, i, arr) => 
            // Keep empty lines except the last one if it's empty
            line.length > 0 || i < arr.length - 1
          );

          return lines.map((line, lineIndex) => {
            const lineKey = `${index}-${lineIndex}`;
            const sign = isAdded ? '+' : isRemoved ? '-' : ' ';
            const lineColor = isAdded 
              ? 'text-green-400' 
              : isRemoved 
              ? 'text-red-400' 
              : 'text-muted-foreground';

            // Animation variants for fading effect
            const variants = {
              initial: { 
                opacity: isAdded ? 0 : 1, 
                x: isAdded ? 20 : (isRemoved ? 0 : 0),
                backgroundColor: 'rgba(0, 0, 0, 0)'
              },
              animate: { 
                opacity: isAdded ? progress : (isRemoved ? 1 - progress : 1),
                x: 0,
                backgroundColor: isAdded 
                  ? `rgba(22, 163, 74, ${progress * 0.2})` 
                  : isRemoved 
                  ? `rgba(220, 38, 38, ${(1 - progress) * 0.2})` 
                  : 'rgba(0, 0, 0, 0)'
              }
            };

            return (
              <motion.div
                key={lineKey}
                className={`flex ${(isAdded || isRemoved) ? 'cursor-pointer' : ''} hover:bg-slate-800/50 transition-colors`}
                variants={variants}
                initial="initial"
                animate="animate"
                transition={{ duration: 0.3, ease: "easeInOut" }}
                onClick={(isAdded || isRemoved) ? handleLineClick : undefined}
              >
                <span className={`w-8 select-none ${lineColor} text-xs flex-shrink-0 text-center`}>
                  {sign}
                </span>
                <span className="flex-1 text-xs font-mono whitespace-pre-wrap break-all">
                  {line || ' '}
                </span>
              </motion.div>
            );
          });
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