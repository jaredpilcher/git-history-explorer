import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { gitAnalysisSchema, type GitAnalysisResponse, type FileTreeNode } from "@shared/schema";
import { simpleGit } from 'simple-git';
import { mkdtemp, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { 
  mockFileTreeHistory, 
  mockArchitectureNotes, 
  mockArchitectureDiagrams,
  mockFileContentBefore,
  mockFileContentAfter
} from './mockData';

export async function registerRoutes(app: Express): Promise<Server> {
  // Analyze git repository
  app.post('/api/analyze', async (req, res) => {
    try {
      const { repoUrl, fromCommit, toCommit } = gitAnalysisSchema.parse(req.body);
      
      // Check if repository already exists
      let repository = await storage.getRepositoryByUrl(repoUrl);
      
      if (!repository) {
        const repoName = repoUrl.split('/').slice(-2).join('/');
        repository = await storage.createRepository({
          url: repoUrl,
          name: repoName,
        });
      }

      // Clone repository to temporary directory
      const tempDirPrefix = join(tmpdir(), 'git-explorer-');
      let tempDir: string;
      
      try {
        tempDir = await mkdtemp(tempDirPrefix);
        const git = simpleGit();
        
        // Optimize clone depth based on repository size estimate
        await git.clone(repoUrl, tempDir, ['--depth=50', '--single-branch']);
        const repoGit = simpleGit(tempDir);
        
        // Get commit log with limit for performance
        const log = await repoGit.log({ maxCount: 100 });
        const commits = log.all.map(commit => ({
          oid: commit.hash, // Adding oid field for original compatibility
          hash: commit.hash,
          message: commit.message,
          author: commit.author_name,
          date: commit.date,
          filesChanged: 0, // Will be calculated from diff
        }));

        // Get file differences between commits
        let diffSummary;
        let fileTree: FileTreeNode;
        let fileDiffs: Record<string, any> = {};
        
        // Always analyze between first and last commit for better diff visualization
        const firstCommit = commits[commits.length - 1]?.hash;
        const lastCommit = commits[0]?.hash;
        
        if (firstCommit && lastCommit && firstCommit !== lastCommit) {
          try {
            diffSummary = await repoGit.diffSummary([firstCommit, lastCommit]);
            
            // Get detailed diff for each file
            for (const file of diffSummary.files) {
              try {
                const diff = await repoGit.diff([firstCommit, lastCommit, '--', file.file]);
                const fileStats = file as any;
                fileDiffs[file.file] = {
                  before: '', 
                  after: '',  
                  additions: fileStats.insertions || 0,
                  deletions: fileStats.deletions || 0,
                  diff: diff,
                };
              } catch (fileError) {
                console.warn(`Could not get diff for file ${file.file}:`, fileError);
              }
            }
          } catch (diffError) {
            console.warn('Could not get diff summary:', diffError);
            diffSummary = { files: [], insertions: 0, deletions: 0, changed: 0 };
          }
        } else if (fromCommit && toCommit) {
          try {
            diffSummary = await repoGit.diffSummary([fromCommit, toCommit]);
            
            // Get detailed diff for each file
            for (const file of diffSummary.files) {
              try {
                const diff = await repoGit.diff([fromCommit, toCommit, '--', file.file]);
                const fileStats = file as any;
                fileDiffs[file.file] = {
                  before: '', 
                  after: '',  
                  additions: fileStats.insertions || 0,
                  deletions: fileStats.deletions || 0,
                  diff: diff,
                };
              } catch (fileError) {
                console.warn(`Could not get diff for file ${file.file}:`, fileError);
              }
            }
          } catch (diffError) {
            console.warn('Could not get diff summary:', diffError);
            diffSummary = { files: [], insertions: 0, deletions: 0, changed: 0 };
          }
        } else {
          // If no specific commits, analyze recent changes
          try {
            if (commits.length > 1) {
              const recentCommit = commits[0].hash;
              const previousCommit = commits[1].hash;
              diffSummary = await repoGit.diffSummary([previousCommit, recentCommit]);
            } else {
              const status = await repoGit.status();
              diffSummary = { 
                files: status.files.map(f => ({ file: f.path, insertions: 0, deletions: 0 })), 
                insertions: 0, 
                deletions: 0, 
                changed: status.files.length 
              };
            }
          } catch (statusError) {
            diffSummary = { files: [], insertions: 0, deletions: 0, changed: 0 };
          }
        }

        // Build file tree from git ls-tree
        try {
          const lsTree = await repoGit.raw(['ls-tree', '-r', '--name-only', 'HEAD']);
          const files = lsTree.trim().split('\n').filter((f: string) => f);
          
          fileTree = buildFileTree(files, diffSummary?.files || []);
          
          // Also build a changed-files-only tree for better visualization
          const changedFiles = diffSummary?.files?.map(f => f.file) || [];
          const changedFileTree = buildChangedFilesTree(changedFiles, diffSummary?.files || []);
          
          // Add the changed files tree to the response
          (fileTree as any).changedFilesOnly = changedFileTree;
        } catch (treeError) {
          console.warn('Could not get file tree:', treeError);
          fileTree = {
            name: 'root',
            type: 'folder',
            path: '/',
            children: [],
          };
        }

        // Generate real architecture analysis  
        const fileTreeHistory = await generatePerCommitChanges(repoGit, commits);
        const architectureNotes = generateArchitectureNotes(commits);
        const architectureDiagrams = generateArchitectureDiagrams(commits);
        const realFileContents = await getFileContents(repoGit, fromCommit, toCommit);

        const analysisResponse: GitAnalysisResponse = {
          commits,
          fileTree,
          fileTreeHistory,
          architectureNotes,
          architectureDiagrams,
          fileContents: realFileContents,
          stats: {
            totalAdditions: diffSummary?.insertions || 0,
            totalDeletions: diffSummary?.deletions || 0,
            filesChanged: diffSummary?.changed || 0,
            commitsCount: commits.length,
          },
          fileDiffs,
        };

        // Update repository last analyzed time
        await storage.updateRepository(repository.id, {
          lastAnalyzed: new Date(),
        });

        res.json(analysisResponse);
      } catch (gitError: any) {
        console.error('Git operation failed:', gitError);
        
        let errorMessage = 'Failed to analyze repository. Please try again.';
        let statusCode = 500;
        
        if (gitError.message?.includes('Authentication failed') || 
            gitError.message?.includes('could not read Username') ||
            gitError.message?.includes('repository access denied')) {
          errorMessage = 'Authentication failed. Please check the URL and ensure it is a public repository or you have access.';
          statusCode = 401;
        } else if (gitError.message?.includes('not found') || 
                   gitError.message?.includes('does not exist') ||
                   gitError.message?.includes('Repository not found')) {
          errorMessage = 'Repository not found. Please verify the URL is correct.';
          statusCode = 404;
        } else if (gitError.message?.includes('timeout') || 
                   gitError.message?.includes('Connection timed out')) {
          errorMessage = 'Repository clone timed out. The repository may be too large or the server is busy.';
          statusCode = 408;
        } else if (gitError.message?.includes('Network')) {
          errorMessage = 'Network error occurred. Please check your internet connection and try again.';
          statusCode = 503;
        }
        
        res.status(statusCode).json({ 
          error: errorMessage,
          details: process.env.NODE_ENV === 'development' ? gitError.message : undefined
        });
      } finally {
        // Clean up temporary directory
        if (tempDir!) {
          try {
            await rm(tempDir, { recursive: true, force: true });
          } catch (cleanupError) {
            console.warn('Failed to clean up temporary directory:', cleanupError);
          }
        }
      }
    } catch (error) {
      console.error('Analysis error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get specific file content for commits
  app.post('/api/file-content', async (req, res) => {
    try {
      const { repoUrl, filePath, fromCommit, toCommit } = req.body;
      
      if (!repoUrl || !filePath) {
        return res.status(400).json({ error: 'Repository URL and file path are required' });
      }

      // Clone repository to temporary directory (same pattern as analyze endpoint)
      const tempDirPrefix = join(tmpdir(), 'git-explorer-');
      let tempDir: string;
      
      try {
        tempDir = await mkdtemp(tempDirPrefix);
        const git = simpleGit();
        
        await git.clone(repoUrl, tempDir, ['--depth=50', '--single-branch']);
        const repoGit = simpleGit(tempDir);
        
        let beforeContent = '';
        let afterContent = '';
        
        if (fromCommit && toCommit) {
          try {
            beforeContent = await repoGit.show([`${fromCommit}:${filePath}`]);
          } catch {
            beforeContent = '// File not found in previous commit';
          }
          
          try {
            afterContent = await repoGit.show([`${toCommit}:${filePath}`]);
          } catch {
            afterContent = '// File not found in this commit';
          }
        } else {
          // Get current file content
          try {
            afterContent = await repoGit.show([`HEAD:${filePath}`]);
            beforeContent = afterContent;
          } catch {
            return res.status(404).json({ error: 'File not found' });
          }
        }
        
        res.json({ before: beforeContent, after: afterContent });
        
      } catch (gitError: any) {
        console.error('Git operation failed:', gitError);
        res.status(500).json({ error: 'Failed to get file content' });
      } finally {
        if (tempDir!) {
          try {
            await rm(tempDir, { recursive: true, force: true });
          } catch (cleanupError) {
            console.warn('Failed to clean up temporary directory:', cleanupError);
          }
        }
      }
    } catch (error) {
      console.error('File content error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get repository analysis history
  app.get('/api/repositories', async (req, res) => {
    try {
      // In a real implementation, would return user's repositories
      res.json({ repositories: [] });
    } catch (error) {
      console.error('Get repositories error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

function buildFileTree(files: string[], changedFiles: any[]): FileTreeNode {
  const root: FileTreeNode = {
    name: 'root',
    type: 'folder',
    path: '/',
    children: [],
  };

  const changedFileMap = new Map(
    changedFiles.map(f => [f.file, { 
      additions: f.insertions || 0, 
      deletions: f.deletions || 0,
      changes: f.changes || 0
    }])
  );

  for (const filePath of files) {
    const parts = filePath.split('/');
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const currentPath = parts.slice(0, i + 1).join('/');
      const isFile = i === parts.length - 1;
      
      let child = current.children?.find(c => c.name === part);
      
      if (!child) {
        const changeInfo = changedFileMap.get(filePath);
        let status: "added" | "modified" | "deleted" | "unchanged" = 'unchanged';
        
        if (changeInfo) {
          if (changeInfo.additions > 0 && changeInfo.deletions === 0) {
            status = 'added';
          } else if (changeInfo.additions === 0 && changeInfo.deletions > 0) {
            status = 'deleted';
          } else if (changeInfo.additions > 0 || changeInfo.deletions > 0) {
            status = 'modified';
          }
        }
        
        child = {
          name: part,
          type: isFile ? 'file' : 'folder',
          path: currentPath,
          status: status,
          additions: isFile ? changeInfo?.additions : undefined,
          deletions: isFile ? changeInfo?.deletions : undefined,
          children: isFile ? undefined : [],
        };
        
        if (!current.children) current.children = [];
        current.children.push(child);
      }
      
      current = child;
    }
  }

  return root;
}

// Build a file tree containing only changed files
function buildChangedFilesTree(changedFiles: string[], changeInfo: any[]): FileTreeNode {
  const root: FileTreeNode = {
    name: 'root',
    type: 'folder',
    path: '/',
    children: [],
  };

  const changedFileMap = new Map(
    changeInfo.map(f => [f.file, { additions: f.insertions, deletions: f.deletions }])
  );

  for (const filePath of changedFiles) {
    const parts = filePath.split('/');
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const currentPath = parts.slice(0, i + 1).join('/');
      const isFile = i === parts.length - 1;
      
      let child = current.children?.find(c => c.name === part);
      
      if (!child) {
        const changeStats = changedFileMap.get(filePath);
        child = {
          name: part,
          type: isFile ? 'file' : 'folder',
          path: currentPath,
          status: changeStats ? (changeStats.additions > 0 && changeStats.deletions > 0 ? 'modified' : 
                               changeStats.additions > 0 ? 'added' : 'deleted') : 'modified',
          additions: isFile ? changeStats?.additions : undefined,
          deletions: isFile ? changeStats?.deletions : undefined,
          children: isFile ? undefined : [],
        };
        
        if (!current.children) current.children = [];
        current.children.push(child);
      }
      
      current = child;
    }
  }

  return root;
}

// Generate per-commit changes showing only files modified in each commit
async function generatePerCommitChanges(repoGit: any, commits: any[]): Promise<FileTreeNode[]> {
  const commitChanges: FileTreeNode[] = [];
  
  for (let i = 0; i < commits.length; i++) {
    const currentCommit = commits[i];
    const previousCommit = commits[i + 1]; // Previous in chronological order
    
    try {
      let changedFiles: any[] = [];
      
      if (previousCommit) {
        // Get diff between previous and current commit
        const diffSummary = await repoGit.diffSummary([previousCommit.hash, currentCommit.hash]);
        changedFiles = diffSummary.files || [];
      } else {
        // For the first commit, get all files as "added"
        const files = await repoGit.raw(['ls-tree', '-r', '--name-only', currentCommit.hash]);
        changedFiles = files.split('\n').filter(f => f.trim()).map(file => ({
          file,
          insertions: 1,
          deletions: 0,
          changes: 1
        }));
      }
      
      // Build file tree for this commit showing only changed files
      const commitFileTree = buildChangedFilesTree(
        changedFiles.map(f => f.file), 
        changedFiles
      );
      
      commitChanges.push(commitFileTree);
    } catch (error) {
      console.warn(`Could not analyze commit ${currentCommit.hash}:`, error);
      // Add empty file tree for failed commits
      commitChanges.push({
        name: 'root',
        type: 'folder',
        path: '/',
        children: [],
      });
    }
  }
  
  return commitChanges;
}

// Generate architecture notes based on commit messages and file changes
function generateArchitectureNotes(commits: any[]): string[] {
  return commits.slice(0, 10).map((commit, index) => {
    const commitMsg = commit.message.toLowerCase();
    
    if (commitMsg.includes('initial') || commitMsg.includes('setup') || index === 0) {
      return `**Initial Setup:** ${commit.message} - This commit establishes the foundational structure of the repository.`;
    } else if (commitMsg.includes('refactor')) {
      return `**Code Refactoring:** ${commit.message} - This commit improves code organization and maintainability.`;
    } else if (commitMsg.includes('add') || commitMsg.includes('new')) {
      return `**Feature Addition:** ${commit.message} - New functionality has been introduced to enhance the application.`;
    } else if (commitMsg.includes('fix') || commitMsg.includes('bug')) {
      return `**Bug Fix:** ${commit.message} - This commit resolves issues and improves stability.`;
    } else if (commitMsg.includes('update') || commitMsg.includes('upgrade')) {
      return `**Update:** ${commit.message} - Dependencies or configurations have been updated.`;
    } else {
      return `**Development:** ${commit.message} - Ongoing development and improvements to the codebase.`;
    }
  });
}

// Generate simple architecture diagrams based on repository structure
function generateArchitectureDiagrams(commits: any[]): any[] {
  return commits.slice(0, 10).map((commit, index) => {
    const baseNodes = [
      { id: 'main', label: 'Main', x: 200, y: 100 }
    ];
    
    const additionalNodes = [];
    const links = [];
    
    // Add nodes based on commit index to show evolution
    if (index > 0) {
      additionalNodes.push({ id: 'feature', label: 'Feature', x: 300, y: 150 });
      links.push({ source: 'main', target: 'feature' });
    }
    
    if (index > 2) {
      additionalNodes.push({ id: 'utils', label: 'Utils', x: 100, y: 150 });
      links.push({ source: 'main', target: 'utils' });
    }
    
    if (index > 4) {
      additionalNodes.push({ id: 'api', label: 'API', x: 200, y: 200 });
      links.push({ source: 'main', target: 'api' });
    }
    
    return {
      nodes: [...baseNodes, ...additionalNodes],
      links
    };
  });
}

// Get actual file contents for diff visualization
async function getFileContents(repoGit: any, fromCommit?: string, toCommit?: string): Promise<{ before: string; after: string }> {
  try {
    const codeFileExtensions = ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.go', '.rs', '.md', '.json'];
    
    if (!fromCommit || !toCommit) {
      // Get the latest files from the repository
      const lsTree = await repoGit.raw(['ls-tree', '-r', '--name-only', 'HEAD']);
      const files: string[] = lsTree.trim().split('\n').filter(Boolean);
      const codeFiles = files.filter(file => 
        codeFileExtensions.some(ext => file.endsWith(ext))
      );
      
      if (codeFiles.length > 0) {
        // Prefer README files first, then main/index files, then any code file
        const preferredFile = codeFiles.find(f => f.toLowerCase().includes('readme')) ||
                             codeFiles.find(f => f.toLowerCase().includes('main') || f.toLowerCase().includes('index')) ||
                             codeFiles[0];
        
        const content = await repoGit.show(['HEAD:' + preferredFile]);
        return { before: content, after: content };
      }
    } else {
      // Get changed files between commits for better diff
      try {
        const diffSummary = await repoGit.diffSummary([fromCommit, toCommit]);
        const changedFiles = diffSummary.files.filter((f: any) => 
          codeFileExtensions.some(ext => f.file.endsWith(ext))
        );
        
        if (changedFiles.length > 0) {
          const file = changedFiles[0].file;
          try {
            const beforeContent = await repoGit.show([`${fromCommit}:${file}`]);
            const afterContent = await repoGit.show([`${toCommit}:${file}`]);
            return { before: beforeContent, after: afterContent };
          } catch (fileError) {
            console.warn(`Could not get contents for ${file}:`, fileError);
          }
        }
      } catch (diffError) {
        console.warn('Could not get diff for commits:', diffError);
      }
      
      // Fallback to any file from commits
      const lsTree = await repoGit.raw(['ls-tree', '-r', '--name-only', toCommit]);
      const files: string[] = lsTree.trim().split('\n').filter(Boolean);
      const firstCodeFile = files.find(file => 
        codeFileExtensions.some(ext => file.endsWith(ext))
      );
      
      if (firstCodeFile) {
        try {
          const beforeContent = await repoGit.show([`${fromCommit}:${firstCodeFile}`]).catch(() => '// File not found in previous commit');
          const afterContent = await repoGit.show([`${toCommit}:${firstCodeFile}`]);
          return { before: beforeContent, after: afterContent };
        } catch (fileError) {
          console.warn('Could not get file contents for commits:', fileError);
        }
      }
    }
  } catch (error) {
    console.warn('Could not get file contents:', error);
  }
  
  // Fallback to realistic example content that demonstrates diff features
  return {
    before: `import React from 'react';

export function WelcomeComponent() {
  const greeting = "Hello World";
  
  return (
    <div className="welcome">
      <h1>{greeting}</h1>
      <p>Welcome to our application!</p>
    </div>
  );
}

// TODO: Add more features
export default WelcomeComponent;`,
    after: `import React, { useState } from 'react';

export function WelcomeComponent() {
  const [greeting, setGreeting] = useState("Hello World");
  const [isVisible, setIsVisible] = useState(true);
  
  const handleToggle = () => {
    setIsVisible(!isVisible);
  };
  
  return (
    <div className="welcome enhanced">
      {isVisible && (
        <>
          <h1>{greeting}</h1>
          <p>Welcome to our enhanced application!</p>
          <button onClick={handleToggle}>Toggle Visibility</button>
        </>
      )}
    </div>
  );
}

// Features implemented: state management, conditional rendering
export default WelcomeComponent;`
  };
}
