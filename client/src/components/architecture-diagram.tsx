import { motion, AnimatePresence } from "framer-motion";
import { GitMerge } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ArchitectureDiagram {
  nodes: Array<{
    id: string;
    label: string;
    x: number;
    y: number;
  }>;
  links: Array<{
    source: string;
    target: string;
  }>;
}

interface ArchitectureDiagramProps {
  diagram: ArchitectureDiagram | null;
}

export function ArchitectureDiagramComponent({ diagram }: ArchitectureDiagramProps) {
  const { theme } = useTheme();
  
  if (!diagram) return null;

  const findNode = (id: string) => diagram.nodes.find(n => n.id === id);
  
  const nodeColors = {
    dark: { bg: '#2d3748', text: '#e2e8f0', border: '#4a5568' },
    light: { bg: '#ffffff', text: '#2d3748', border: '#cbd5e0' }
  };
  
  const colors = nodeColors[theme as keyof typeof nodeColors] || nodeColors.light;

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center">
          <GitMerge size={14} className="mr-2 text-blue-500" />
          Architecture Diagram
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <svg width="100%" height="100%" viewBox="0 0 500 300" className="border rounded">
          <AnimatePresence>
            {diagram.links.map(({ source, target }) => {
              const sourceNode = findNode(source);
              const targetNode = findNode(target);
              if (!sourceNode || !targetNode) return null;
              
              return (
                <motion.line
                  key={`${source}-${target}`}
                  x1={sourceNode.x}
                  y1={sourceNode.y}
                  x2={targetNode.x}
                  y2={targetNode.y}
                  stroke={theme === 'dark' ? "#4a5568" : "#cbd5e0"}
                  strokeWidth="1.5"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                />
              );
            })}
          </AnimatePresence>
          
          <AnimatePresence>
            {diagram.nodes.map(node => (
              <motion.g
                key={node.id}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              >
                <motion.rect
                  x={node.x - 60}
                  y={node.y - 20}
                  width="120"
                  height="40"
                  rx="8"
                  fill={colors.bg}
                  stroke={colors.border}
                  strokeWidth="2"
                />
                <text
                  x={node.x}
                  y={node.y + 5}
                  textAnchor="middle"
                  fill={colors.text}
                  fontSize="12"
                  fontWeight="medium"
                >
                  {node.label}
                </text>
              </motion.g>
            ))}
          </AnimatePresence>
        </svg>
      </CardContent>
    </Card>
  );
}