import { User, GitCommit } from "lucide-react";
import type { GitAnalysisResponse } from "@shared/schema";

interface CommitHistoryProps {
  commits: GitAnalysisResponse['commits'];
}

export function CommitHistory({ commits }: CommitHistoryProps) {
  return (
    <div className="h-full overflow-y-auto p-2" data-testid="commit-history-panel">
      <h3 className="text-sm font-semibold p-2 mb-2 text-muted-foreground uppercase tracking-wider">
        Commit History
      </h3>
      
      {commits && commits.length > 0 ? (
        <ul className="space-y-1">
          {commits.map(commit => (
            <li 
              key={commit.oid} 
              data-testid="commit-history-item" 
              className="p-2 rounded-md hover:bg-muted transition-colors"
            >
              <p className="font-medium text-sm truncate">
                {commit.message}
              </p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                <span className="flex items-center gap-1">
                  <User size={12} /> 
                  {commit.author}
                </span>
                <span className="flex items-center gap-1 font-mono">
                  <GitCommit size={12} /> 
                  {commit.oid.substring(0, 7)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="p-4 text-center text-sm text-muted-foreground">
          No commits in range.
        </p>
      )}
    </div>
  );
}