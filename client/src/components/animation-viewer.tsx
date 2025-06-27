import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GitCommit, ChevronDown, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

  // Enhanced diff visualization with context-aware collapsible sections
  const diffData = useMemo(() => {
    if (!fromContent || !toContent) return { parts: [], contextSections: [] };
    
    const parts = diffLines(fromContent, toContent);
    const contextSections: Array<{
      type: 'unchanged' | 'changed';
      startLine: number;
      endLine: number;
      content: string[];
      isCollapsible: boolean;
    }> = [];
    
    let currentLine = 0;
    let currentSection: any = null;
    
    parts.forEach(part => {
      const lines = part.value.split('\n').filter((line, i, arr) => 
        line.length > 0 || i < arr.length - 1
      );
      
      const isChanged = part.added || part.removed;
      
      if (isChanged) {
        // End any current unchanged section
        if (currentSection && currentSection.type === 'unchanged') {
          contextSections.push(currentSection);
          currentSection = null;
        }
        
        // Start or continue changed section
        if (!currentSection || currentSection.type !== 'changed') {
          currentSection = {
            type: 'changed',
            startLine: currentLine,
            endLine: currentLine + lines.length - 1,
            content: [...lines],
            isCollapsible: false
          };
        } else {
          currentSection.endLine = currentLine + lines.length - 1;
          currentSection.content.push(...lines);
        }
      } else {
        // End any current changed section
        if (currentSection && currentSection.type === 'changed') {
          contextSections.push(currentSection);
          currentSection = null;
        }
        
        // Handle unchanged content - make collapsible if more than 5 lines
        if (lines.length > 5) {
          // Add context before (first 3 lines)
          if (lines.length > 3) {
            contextSections.push({
              type: 'unchanged',
              startLine: currentLine,
              endLine: currentLine + 2,
              content: lines.slice(0, 3),
              isCollapsible: false
            });
          }
          
          // Add collapsible middle section if there are more than 6 lines
          if (lines.length > 6) {
            contextSections.push({
              type: 'unchanged',
              startLine: currentLine + 3,
              endLine: currentLine + lines.length - 4,
              content: lines.slice(3, -3),
              isCollapsible: true
            });
          }
          
          // Add context after (last 3 lines)
          if (lines.length > 3) {
            contextSections.push({
              type: 'unchanged',
              startLine: currentLine + lines.length - 3,
              endLine: currentLine + lines.length - 1,
              content: lines.slice(-3),
              isCollapsible: false
            });
          }
        } else {
          // Small unchanged section - show all
          contextSections.push({
            type: 'unchanged',
            startLine: currentLine,
            endLine: currentLine + lines.length - 1,
            content: lines,
            isCollapsible: false
          });
        }
      }
      
      currentLine += lines.length;
    });
    
    // Add final section if exists
    if (currentSection) {
      contextSections.push(currentSection);
    }
    
    return { parts, contextSections };
  }, [fromContent, toContent]);

  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());

  const toggleSection = (sectionIndex: number) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionIndex)) {
      newExpanded.delete(sectionIndex);
    } else {
      newExpanded.add(sectionIndex);
    }
    setExpandedSections(newExpanded);
  };

  const renderDiff = () => {
    if (!fromContent || !toContent) {
      return (
        <div className="text-muted-foreground p-4 text-center">
          No file content available for comparison
        </div>
      );
    }

    if (diffData.parts.length === 0) {
      return (
        <div className="text-muted-foreground p-4 text-center">
          No differences found between the selected commits
        </div>
      );
    }

    return (
      <div className="space-y-0.5">
        {diffData.contextSections.map((section, sectionIndex) => {
          const isExpanded = expandedSections.has(sectionIndex);
          const isChanged = section.type === 'changed';
          
          if (section.isCollapsible && !isExpanded) {
            // Render collapsed section
            return (
              <motion.div
                key={`section-${sectionIndex}`}
                className="border-l-2 border-gray-500 pl-2 my-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSection(sectionIndex)}
                  className="text-xs text-muted-foreground hover:text-foreground p-1 h-auto"
                >
                  <ChevronRight size={12} className="mr-1" />
                  <span className="text-xs">
                    ... {section.content.length} unchanged lines ({section.startLine + 1}-{section.endLine + 1})
                  </span>
                </Button>
              </motion.div>
            );
          }

          // Render expanded section or non-collapsible section
          return (
            <div key={`section-${sectionIndex}`}>
              {section.isCollapsible && isExpanded && (
                <motion.div
                  className="border-l-2 border-gray-500 pl-2 mb-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSection(sectionIndex)}
                    className="text-xs text-muted-foreground hover:text-foreground p-1 h-auto"
                  >
                    <ChevronDown size={12} className="mr-1" />
                    <span className="text-xs">
                      Collapse {section.content.length} lines
                    </span>
                  </Button>
                </motion.div>
              )}
              
              <AnimatePresence>
                {section.content.map((line, lineIndex) => {
                  const lineNumber = section.startLine + lineIndex;
                  const isAdded = isChanged && lineIndex % 3 === 0; // Demo logic for now
                  const isRemoved = isChanged && lineIndex % 3 === 1;
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
                      key={`${sectionIndex}-${lineIndex}`}
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
                      <span className="w-12 select-none text-gray-500 text-xs flex-shrink-0 text-right pr-2">
                        {lineNumber + 1}
                      </span>
                      <span className="flex-1 text-xs font-mono whitespace-pre-wrap break-all">
                        {line || ' '}
                      </span>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
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