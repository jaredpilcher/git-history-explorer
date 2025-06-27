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
        
        await git.clone(repoUrl, tempDir, ['--depth=100']);
        const repoGit = simpleGit(tempDir);
        
        // Get commit log
        const log = await repoGit.log();
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
        
        if (fromCommit && toCommit) {
          try {
            diffSummary = await repoGit.diffSummary([fromCommit, toCommit]);
            
            // Get detailed diff for each file
            for (const file of diffSummary.files) {
              try {
                const diff = await repoGit.diff([fromCommit, toCommit, '--', file.file]);
                fileDiffs[file.file] = {
                  before: '', // In a real implementation, would extract before content
                  after: '',  // In a real implementation, would extract after content
                  additions: file.insertions,
                  deletions: file.deletions,
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
          // If no specific commits, analyze overall repository structure
          try {
            const status = await repoGit.status();
            diffSummary = { 
              files: [], 
              insertions: 0, 
              deletions: 0, 
              changed: status.files.length 
            };
          } catch (statusError) {
            diffSummary = { files: [], insertions: 0, deletions: 0, changed: 0 };
          }
        }

        // Build file tree from git ls-tree
        try {
          const lsTree = await repoGit.raw(['ls-tree', '-r', '--name-only', 'HEAD']);
          const files = lsTree.trim().split('\n').filter(f => f);
          
          fileTree = buildFileTree(files, diffSummary?.files || []);
        } catch (treeError) {
          console.warn('Could not get file tree:', treeError);
          fileTree = {
            name: 'root',
            type: 'folder',
            path: '/',
            children: [],
          };
        }

        const analysisResponse: GitAnalysisResponse = {
          commits,
          fileTree,
          fileTreeHistory: mockFileTreeHistory.slice(0, commits.length),
          architectureNotes: mockArchitectureNotes.slice(0, commits.length),
          architectureDiagrams: mockArchitectureDiagrams.slice(0, commits.length),
          fileContents: {
            before: mockFileContentBefore,
            after: mockFileContentAfter
          },
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
        const errorMessage = gitError.message?.includes('Authentication failed') || 
                           gitError.message?.includes('could not read') ||
                           gitError.message?.includes('not found')
          ? 'Failed to clone repository. Please check the URL and ensure it is a public repository.'
          : 'Failed to analyze repository. Please try again.';
        
        res.status(400).json({ error: errorMessage });
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
    changedFiles.map(f => [f.file, { additions: f.insertions, deletions: f.deletions }])
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
        child = {
          name: part,
          type: isFile ? 'file' : 'folder',
          path: currentPath,
          status: changeInfo ? (changeInfo.additions > 0 && changeInfo.deletions > 0 ? 'modified' : 
                               changeInfo.additions > 0 ? 'added' : 'deleted') : 'unchanged',
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
