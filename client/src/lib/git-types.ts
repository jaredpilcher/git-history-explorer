export interface FileTreeNode {
  name: string;
  type: "file" | "folder";
  path: string;
  status?: "added" | "modified" | "deleted" | "unchanged";
  children?: FileTreeNode[];
  additions?: number;
  deletions?: number;
}

export interface GitCommit {
  hash: string;
  message: string;
  author: string;
  date: string;
  filesChanged: number;
}

export interface GitStats {
  totalAdditions: number;
  totalDeletions: number;
  filesChanged: number;
  commitsCount: number;
}

export interface FileDiff {
  before: string;
  after: string;
  additions: number;
  deletions: number;
}

export interface GitAnalysisResponse {
  commits: GitCommit[];
  fileTree: FileTreeNode;
  stats: GitStats;
  fileDiffs: Record<string, FileDiff>;
}

export interface GitAnalysisRequest {
  repoUrl: string;
  fromCommit?: string;
  toCommit?: string;
}
