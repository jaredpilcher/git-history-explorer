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
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

import type { GitAnalysisResponse, FileTreeNode, ArchitectureDiagram } from "@shared/schema";

interface AnimatedGitExplorerProps {
  data: GitAnalysisResponse;
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
  const [isLargeRepository, setIsLargeRepository] = useState(false);
  const [fileContent, setFileContent] = useState({ before: '', after: '' });
  const [contentCache, setContentCache] = useState(new Map<string, { before: string; after: string }>());
  const [showChangedOnly, setShowChangedOnly] = useState(true); // Default to showing only changed files
  const [scrollPosition, setScrollPosition] = useState(0); // Track scroll position to prevent jumping
  const speeds = [0.5, 1, 2, 4];
  
  // Performance optimization: Limit commits for large repositories
  const maxCommitsToDisplay = 50;
  
  const { theme, setTheme } = useTheme();

  // Mutation for fetching specific file content with caching
  const fileContentMutation = useMutation({
    mutationFn: async ({ filePath, fromCommit, toCommit }: { filePath: string; fromCommit?: string; toCommit?: string }) => {
      // Create cache key
      const cacheKey = `${filePath}-${fromCommit}-${toCommit}`;
      
      // Check cache first
      if (contentCache.has(cacheKey)) {
        return contentCache.get(cacheKey)!;
      }
      
      const response = await fetch('/api/file-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repoUrl,
          filePath,
          fromCommit,
          toCommit
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch file content');
      }
      
      const data = await response.json();
      
      // Cache the result
      setContentCache(cache => new Map(cache.set(cacheKey, data)));
      
      return data;
    },
    onSuccess: (data: { before: string; after: string }) => {
      setFileContent(data);
    }
  });

  // Initialize commit range and check for large repository
  useEffect(() => {
    if (data.commits && data.commits.length > 0) {
      setFromCommit(data.commits[0].oid);
      setToCommit(data.commits[data.commits.length - 1].oid);
      const firstFile = data.fileTree?.children?.find((c: FileTreeNode) => c.type === 'file');
      setSelectedFile(firstFile?.path || '');
      
      // Set large repository flag for performance optimizations
      setIsLargeRepository(data.commits.length > maxCommitsToDisplay);
      
      // Use initial file content from data or set fallback
      if (data.fileContents) {
        setFileContent(data.fileContents);
      }
    }
  }, [data, maxCommitsToDisplay]);

  // Handle file selection - simplified without real-time fetching during animations
  const handleFileSelect = useCallback((filePath: string) => {
    setSelectedFile(filePath);
    
    // Only fetch new content when user manually changes file and not during animations
    if (fromCommit && toCommit && filePath && !isPlaying) {
      const cacheKey = `${filePath}-${fromCommit}-${toCommit}`;
      
      // Check cache first to avoid API calls
      if (contentCache.has(cacheKey)) {
        setFileContent(contentCache.get(cacheKey)!);
      } else {
        fileContentMutation.mutate({
          filePath,
          fromCommit,
          toCommit
        });
      }
    }
  }, [fromCommit, toCommit, isPlaying, contentCache]);

  // Simplified: Only update file content when commit selectors change manually, not during playback
  useEffect(() => {
    if (selectedFile && fromCommit && toCommit && !isPlaying) {
      const cacheKey = `${selectedFile}-${fromCommit}-${toCommit}`;
      
      if (contentCache.has(cacheKey)) {
        setFileContent(contentCache.get(cacheKey)!);
      }
    }
  }, [fromCommit, toCommit, selectedFile, isPlaying, contentCache]);

  const { commitsInRange, fromIndex, displayCommits } = useMemo(() => {
    if (!data?.commits) return { commitsInRange: [], fromIndex: -1, displayCommits: [] };
    
    // For large repositories, limit the number of commits to display
    const commits = isLargeRepository ? data.commits.slice(0, maxCommitsToDisplay) : data.commits;
    
    const fromI = commits.findIndex(c => c.oid === fromCommit);
    const toI = commits.findIndex(c => c.oid === toCommit);
    if (fromI === -1 || toI === -1 || fromI > toI) return { commitsInRange: [], fromIndex: -1, displayCommits: commits };
    
    return { 
      commitsInRange: commits.slice(fromI, toI + 1), 
      fromIndex: fromI,
      displayCommits: commits 
    };
  }, [fromCommit, toCommit, data, isLargeRepository, maxCommitsToDisplay]);

  const currentCommit = commitsInRange[currentCommitIndex] || null;
  
  // Dynamic file tree based on current commit - shows only files changed in that commit
  const currentFileTree = useMemo(() => {
    if (data.fileTreeHistory && data.fileTreeHistory[currentCommitIndex]) {
      return data.fileTreeHistory[currentCommitIndex];
    }
    return data?.fileTree || null;
  }, [data.fileTreeHistory, data.fileTree, currentCommitIndex]);

  // Check if currently selected file has changes in current commit
  const isCurrentFileChanged = useMemo(() => {
    if (!currentFileTree || !selectedFile) return false;
    
    const findFile = (node: FileTreeNode): boolean => {
      if (node.path === selectedFile && node.status && node.status !== 'unchanged') {
        return true;
      }
      if (node.children) {
        return node.children.some(child => findFile(child));
      }
      return false;
    };
    
    return findFile(currentFileTree);
  }, [currentFileTree, selectedFile]);
  
  const currentArchNote = "";  // For now, no architecture notes in GitAnalysisResponse
  const currentArchDiagram = null;  // For now, no architecture diagrams in GitAnalysisResponse
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
          <button 
            onClick={onReset} 
            className="flex items-center gap-3 hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary rounded-md p-1"
            aria-label={`Return to repository selection. Currently viewing ${repoUrl}`}
          >
            <GitBranch className="text-primary h-6 w-6 flex-shrink-0" />
            <div className="flex flex-col">
              <h1 className="text-lg font-semibold truncate hover:underline">
                {repoUrl}
              </h1>
              {isLargeRepository && (
                <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                  <AlertTriangle size={12} aria-hidden="true" />
                  <span className="text-xs" role="status" aria-live="polite">
                    Showing first {maxCommitsToDisplay} commits for performance
                  </span>
                </div>
              )}
            </div>
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
          commits={displayCommits} 
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
              onFileSelect={handleFileSelect} 
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
                fromContent={fileContent.before} 
                toContent={fileContent.after} 
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