import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  GitBranch, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward,
  FileText,
  Folder,
  FolderOpen,
  Sun,
  Moon,
  Share2,
  Settings,
  Plus,
  Minus,
  GitCommit
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/components/theme-provider";
import type { GitAnalysisResponse, FileTreeNode } from "@/lib/git-types";

interface GitExplorerProps {
  data: GitAnalysisResponse;
  repoUrl: string;
  onReset: () => void;
}

export function GitExplorer({ data, repoUrl, onReset }: GitExplorerProps) {
  const [selectedCommitIndex, setSelectedCommitIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState("file-tree");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["/"]));
  const { theme, setTheme } = useTheme();

  const repoName = repoUrl.split('/').slice(-2).join('/');
  const selectedCommit = data.commits[selectedCommitIndex];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && selectedCommitIndex < data.commits.length - 1) {
      interval = setInterval(() => {
        setSelectedCommitIndex(prev => {
          if (prev >= data.commits.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, selectedCommitIndex, data.commits.length]);

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const renderFileTree = (node: FileTreeNode, level = 0) => {
    const isExpanded = expandedFolders.has(node.path);
    const hasChildren = node.children && node.children.length > 0;

    const getStatusColor = (status?: string) => {
      switch (status) {
        case "added": return "text-green-600 dark:text-green-400";
        case "modified": return "text-yellow-600 dark:text-yellow-400";
        case "deleted": return "text-red-600 dark:text-red-400";
        default: return "text-slate-600 dark:text-slate-400";
      }
    };

    const getStatusBadge = (status?: string, additions?: number, deletions?: number) => {
      if (!status || status === "unchanged") return null;
      
      if (status === "added" && additions) {
        return <Badge variant="outline" className="text-green-600 border-green-600 ml-2">+{additions}</Badge>;
      }
      if (status === "deleted" && deletions) {
        return <Badge variant="outline" className="text-red-600 border-red-600 ml-2">-{deletions}</Badge>;
      }
      if (status === "modified" && (additions || deletions)) {
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600 ml-2">~{(additions || 0) + (deletions || 0)}</Badge>;
      }
      return null;
    };

    return (
      <div key={node.path}>
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
          className={`flex items-center gap-2 p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer ${getStatusColor(node.status)}`}
          style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}
          onClick={() => node.type === "folder" && toggleFolder(node.path)}
        >
          {node.type === "folder" ? (
            <>
              {isExpanded ? (
                <FolderOpen className="h-4 w-4 text-yellow-600" />
              ) : (
                <Folder className="h-4 w-4 text-yellow-600" />
              )}
              <span className="font-medium">{node.name}</span>
            </>
          ) : (
            <>
              <div className={`w-2 h-2 rounded-full ${
                node.status === "added" ? "bg-green-500" :
                node.status === "modified" ? "bg-yellow-500" :
                node.status === "deleted" ? "bg-red-500" :
                "bg-slate-300 dark:bg-slate-600"
              }`} />
              <FileText className="h-4 w-4" />
              <span className={node.status === "deleted" ? "line-through" : ""}>{node.name}</span>
              {getStatusBadge(node.status, node.additions, node.deletions)}
            </>
          )}
        </motion.div>
        
        <AnimatePresence>
          {node.type === "folder" && isExpanded && hasChildren && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              {node.children!.map(child => renderFileTree(child, level + 1))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onReset} className="flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-primary" />
              <span className="font-semibold">{repoName}</span>
            </Button>
            <div className="text-sm text-muted-foreground">
              {data.commits.length} commits analyzed
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
            <Button variant="ghost" size="icon">
              <Share2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-80 border-r bg-card h-[calc(100vh-73px)]">
          <ScrollArea className="h-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Commit Timeline</h2>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedCommitIndex(Math.max(0, selectedCommitIndex - 1))}
                    disabled={selectedCommitIndex === 0}
                  >
                    <SkipBack className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsPlaying(!isPlaying)}
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedCommitIndex(Math.min(data.commits.length - 1, selectedCommitIndex + 1))}
                    disabled={selectedCommitIndex === data.commits.length - 1}
                  >
                    <SkipForward className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {data.commits.map((commit, index) => (
                  <motion.div
                    key={commit.hash}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      index === selectedCommitIndex
                        ? "bg-primary/10 border-primary"
                        : "border-border hover:bg-muted"
                    }`}
                    onClick={() => setSelectedCommitIndex(index)}
                  >
                    <div className="flex items-start gap-3">
                      <GitCommit className={`h-4 w-4 mt-1 ${
                        index === selectedCommitIndex ? "text-primary" : "text-muted-foreground"
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {commit.message}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span>{commit.author}</span>
                          <span>•</span>
                          <span>{new Date(commit.date).toLocaleDateString()}</span>
                          <span>•</span>
                          <span className="font-mono">{commit.hash.slice(0, 7)}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </ScrollArea>
        </aside>

        {/* Main Content */}
        <main className="flex-1 h-[calc(100vh-73px)]">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <div className="border-b bg-card">
              <TabsList className="h-auto p-0 bg-transparent">
                <TabsTrigger value="file-tree" className="data-[state=active]:bg-background">
                  <Folder className="mr-2 h-4 w-4" />
                  File Tree
                </TabsTrigger>
                <TabsTrigger value="statistics" className="data-[state=active]:bg-background">
                  <GitCommit className="mr-2 h-4 w-4" />
                  Statistics
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6 h-full overflow-auto">
              <TabsContent value="file-tree" className="mt-0">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold">Repository File Tree</h3>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-green-500 rounded-full" />
                      <span>Added</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                      <span>Modified</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-red-500 rounded-full" />
                      <span>Deleted</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-slate-300 dark:bg-slate-600 rounded-full" />
                      <span>Unchanged</span>
                    </div>
                  </div>
                </div>

                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-1">
                      {renderFileTree(data.fileTree)}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="statistics" className="mt-0">
                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-2">Repository Statistics</h3>
                  <p className="text-muted-foreground">Quantitative analysis of repository changes</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Lines Added</CardTitle>
                      <Plus className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">{data.stats.totalAdditions}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Lines Removed</CardTitle>
                      <Minus className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">{data.stats.totalDeletions}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Files Changed</CardTitle>
                      <FileText className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">{data.stats.filesChanged}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Commits</CardTitle>
                      <GitBranch className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-purple-600">{data.stats.commitsCount}</div>
                    </CardContent>
                  </Card>
                </div>

                {selectedCommit && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Selected Commit</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div>
                          <span className="font-medium">Message:</span> {selectedCommit.message}
                        </div>
                        <div>
                          <span className="font-medium">Author:</span> {selectedCommit.author}
                        </div>
                        <div>
                          <span className="font-medium">Date:</span> {new Date(selectedCommit.date).toLocaleString()}
                        </div>
                        <div>
                          <span className="font-medium">Hash:</span> <code className="bg-muted px-2 py-1 rounded">{selectedCommit.hash}</code>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
