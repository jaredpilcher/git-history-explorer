import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { 
  GitBranch, 
  Share2, 
  Settings, 
  Sun, 
  Moon, 
  User, 
  Loader2, 
  AlertTriangle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { CommitSelector } from "./commit-selector";
import { FileTreeView } from "./file-tree-view";
import { CommitHistory } from "./commit-history";
import { AnimationViewer } from "./animation-viewer";
import { ArchitectureNotes } from "./architecture-notes";
import { ArchitectureDiagramComponent } from "./architecture-diagram";
import { Timeline } from "./timeline";
import { PlaybackControls } from "./playback-controls";

interface GitCommit {
  oid: string;
  hash: string;
  message: string;
  author: string;
  date: string;
  filesChanged: number;
}

interface FileTreeNode {
  name: string;
  type: "file" | "folder";
  path: string;
  status?: "added" | "modified" | "deleted" | "unchanged";
  children?: FileTreeNode[];
  additions?: number;
  deletions?: number;
}

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

interface GitAnalysisData {
  commits: GitCommit[];
  fileTreeHistory: FileTreeNode[];
  architectureNotes: string[];
  architectureDiagrams: ArchitectureDiagram[];
  fileContents: {
    before: string;
    after: string;
  };
}

interface AnimatedGitExplorerProps {
  data: GitAnalysisData;
  repoUrl: string;
  onReset: () => void;
}

export function AnimatedGitExplorer({ data, repoUrl, onReset }: AnimatedGitExplorerProps) {
  const [fromCommit, setFromCommit] = useState('');
  const [toCommit, setToCommit] = useState('');
  const [selectedFile, setSelectedFile] = useState('');
  const [currentCommitIndex, setCurrentCommitIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const speeds = [0.5, 1, 2, 4];
  
  const { theme, setTheme } = useTheme();

  // Initialize commit range
  useEffect(() => {
    if (data.commits && data.commits.length > 0) {
      setFromCommit(data.commits[0].oid);
      setToCommit(data.commits[data.commits.length - 1].oid);
      const firstFile = data.fileTreeHistory?.[0]?.children?.find(c => c.type === 'file');
      setSelectedFile(firstFile?.name || '');
    }
  }, [data]);

  const { commitsInRange, fromIndex } = useMemo(() => {
    if (!data?.commits) return { commitsInRange: [], fromIndex: -1 };
    const fromI = data.commits.findIndex(c => c.oid === fromCommit);
    const toI = data.commits.findIndex(c => c.oid === toCommit);
    if (fromI === -1 || toI === -1 || fromI > toI) return { commitsInRange: [], fromIndex: -1 };
    return { commitsInRange: data.commits.slice(fromI, toI + 1), fromIndex: fromI };
  }, [fromCommit, toCommit, data]);

  const currentCommit = commitsInRange[currentCommitIndex] || null;
  const currentFileTree = data?.fileTreeHistory[fromIndex + currentCommitIndex] || null;
  const currentArchNote = data?.architectureNotes[fromIndex + currentCommitIndex] || "";
  const currentArchDiagram = data?.architectureDiagrams[fromIndex + currentCommitIndex] || null;
  const animationProgress = commitsInRange.length > 1 ? currentCommitIndex / (commitsInRange.length - 1) : (commitsInRange.length === 1 ? 1 : 0);

  const handlePlayPause = useCallback(() => {
    if (currentCommitIndex === commitsInRange.length - 1) {
      setCurrentCommitIndex(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(prev => !prev);
    }
  }, [currentCommitIndex, commitsInRange.length]);

  const handleStep = useCallback((direction: number) => {
    setIsPlaying(false);
    setCurrentCommitIndex(prev => {
      const next = prev + direction;
      return Math.max(0, Math.min(next, commitsInRange.length - 1));
    });
  }, [commitsInRange.length]);

  const handleSpeedChange = () => {
    const currentIndex = speeds.indexOf(speed);
    setSpeed(speeds[(currentIndex + 1) % speeds.length]);
  };

  const handleTimelineChange = (index: number) => {
    if (index >= 0 && index < commitsInRange.length) {
      setCurrentCommitIndex(index);
    }
  };

  // Playback automation
  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setCurrentCommitIndex(prev => {
          if (prev >= commitsInRange.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1500 / speed);
      return () => clearInterval(interval);
    }
  }, [isPlaying, speed, commitsInRange.length]);

  // Reset on commit range change
  useEffect(() => {
    setCurrentCommitIndex(0);
    setIsPlaying(false);
  }, [fromCommit, toCommit]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-3 bg-background/70 backdrop-blur-sm border-b sticky top-0 left-0 right-0 h-16 z-30">
        <div className="flex items-center gap-3 overflow-hidden">
          <button onClick={onReset} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <GitBranch className="text-primary h-6 w-6 flex-shrink-0" />
            <h1 className="text-lg font-semibold truncate hover:underline">
              {repoUrl}
            </h1>
          </button>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon">
            <Share2 size={20} />
          </Button>
          <Button variant="ghost" size="icon">
            <Settings size={20} />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </Button>
          <Button variant="ghost" size="icon" className="hidden sm:flex">
            <User size={20} />
            <span className="text-sm font-medium hidden lg:inline ml-2">Sign In</span>
          </Button>
        </div>
      </header>

      {/* Commit Selector */}
      <div className="p-4 border-b">
        <CommitSelector 
          commits={data.commits} 
          fromCommit={fromCommit} 
          toCommit={toCommit} 
          onFromChange={setFromCommit} 
          onToChange={setToCommit} 
        />
      </div>

      {/* Main Content */}
      <main className="flex-grow flex flex-col md:flex-row overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-full md:w-1/4 md:max-w-xs flex flex-col border-r-0 md:border-r border-b md:border-b-0 bg-card/50">
          <div className="flex-1 h-64 md:h-1/2 overflow-y-auto">
            <FileTreeView 
              tree={currentFileTree} 
              onFileSelect={setSelectedFile} 
              selectedFile={selectedFile} 
            />
          </div>
          <div className="flex-shrink-0 h-64 md:h-1/2 border-t overflow-y-auto">
            <CommitHistory commits={commitsInRange} />
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-grow flex flex-col lg:flex-row p-4 overflow-hidden gap-4">
            {/* Animation Viewer */}
            <div className="flex-1 min-h-[50vh] lg:min-h-full">
              <AnimationViewer 
                fromContent={data.fileContents.before} 
                toContent={data.fileContents.after} 
                progress={animationProgress} 
                selectedFile={selectedFile} 
                commit={currentCommit}
              />
            </div>
            
            {/* Right Sidebar - Architecture */}
            <aside className="w-full lg:w-1/3 flex flex-col gap-4">
              <div className="flex-1 h-auto lg:h-1/2 lg:min-h-[200px]">
                <ArchitectureNotes note={currentArchNote} />
              </div>
              <div className="flex-1 h-64 lg:h-1/2 lg:min-h-[200px]">
                <ArchitectureDiagramComponent diagram={currentArchDiagram} />
              </div>
            </aside>
          </div>
          
          {/* Bottom Controls */}
          <div className="flex-shrink-0 border-t">
            <Timeline 
              commits={commitsInRange} 
              currentIndex={currentCommitIndex} 
              onTimelineChange={handleTimelineChange} 
            />
            <PlaybackControls 
              isPlaying={isPlaying} 
              onPlayPause={handlePlayPause} 
              onRewind={() => handleStep(-1)} 
              onFastForward={() => handleStep(1)} 
              speed={speed} 
              onSpeedChange={handleSpeedChange} 
            />
          </div>
        </div>
      </main>
    </div>
  );
}