import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GitBranch, Loader2, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { AnimatedGitExplorer } from "@/components/animated-git-explorer";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { GitAnalysisResponse } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [repoUrl, setRepoUrl] = useState("https://github.com/facebook/react");
  const [analysisData, setAnalysisData] = useState<GitAnalysisResponse | null>(null);
  const { toast } = useToast();

  const analysisMutation = useMutation({
    mutationFn: async (url: string) => {
      const response = await apiRequest("POST", "/api/analyze", { repoUrl: url });
      return response.json() as Promise<GitAnalysisResponse>;
    },
    onSuccess: (data) => {
      setAnalysisData(data);
      toast({
        title: "Repository analyzed",
        description: `Successfully analyzed ${data.commits.length} commits`,
      });
    },
    onError: (error: any) => {
      let errorMessage = "Failed to analyze repository";
      let errorTitle = "Analysis failed";
      
      // Handle different types of errors with specific messages
      if (error.message?.includes("Authentication failed")) {
        errorTitle = "Authentication Error";
        errorMessage = "This repository requires authentication. Please make sure it's a public repository or you have access.";
      } else if (error.message?.includes("Repository not found")) {
        errorTitle = "Repository Not Found";
        errorMessage = "The repository URL couldn't be found. Please check the URL and try again.";
      } else if (error.message?.includes("timeout")) {
        errorTitle = "Request Timeout";
        errorMessage = "The repository is taking too long to analyze. It might be very large or the server is busy.";
      } else if (error.message?.includes("Network error")) {
        errorTitle = "Network Error";
        errorMessage = "There was a problem connecting to the repository. Please check your internet connection.";
      } else if (error.message?.includes("rate limit")) {
        errorTitle = "Rate Limited";
        errorMessage = "Too many requests. Please wait a moment before trying again.";
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl.trim()) return;
    analysisMutation.mutate(repoUrl);
  };

  const handleReset = () => {
    setAnalysisData(null);
    setRepoUrl("https://github.com/facebook/react");
  };

  if (analysisData) {
    return <AnimatedGitExplorer data={analysisData} repoUrl={repoUrl} onReset={handleReset} />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 text-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="max-w-2xl w-full"
      >
        <div className="mb-6 sm:mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <GitBranch className="mx-auto text-primary mb-4 h-12 w-12 sm:h-16 sm:w-16" />
          </motion.div>
          
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-slate-800 dark:text-white mb-4 leading-tight"
          >
            <span className="block sm:inline">Animated Git</span>{" "}
            <span className="block sm:inline">Change Explorer</span>
          </motion.h1>
          
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-base sm:text-lg lg:text-xl text-slate-600 dark:text-slate-400 mb-6 sm:mb-8 px-4"
          >
            Visualize code evolution and repository changes like never before
          </motion.p>
        </div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <Card className="w-full max-w-xl mx-auto">
            <CardContent className="p-4 sm:p-6">
              <form onSubmit={handleAnalyze} className="space-y-4">
                <div className="relative">
                  <Github className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="url"
                    placeholder="https://github.com/username/repository"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    className="pl-10 text-sm sm:text-base"
                    required
                    disabled={analysisMutation.isPending}
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-11 text-sm sm:text-base"
                  disabled={analysisMutation.isPending || !repoUrl.trim()}
                >
                  {analysisMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span className="hidden sm:inline">Analyzing Repository...</span>
                      <span className="sm:hidden">Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <GitBranch className="mr-2 h-4 w-4" />
                      <span className="hidden sm:inline">Analyze Repository</span>
                      <span className="sm:hidden">Analyze</span>
                    </>
                  )}
                </Button>
              </form>
              
              <div className="flex items-center justify-center text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-4">
                <div className="flex items-center gap-2 text-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                  <span className="leading-relaxed">
                    <span className="hidden sm:inline">Enter a public GitHub repository URL to begin analysis</span>
                    <span className="sm:hidden">Enter a GitHub URL to start</span>
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
