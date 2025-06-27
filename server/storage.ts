import { repositories, commits, type Repository, type InsertRepository, type Commit, type InsertCommit } from "@shared/schema";

export interface IStorage {
  getRepository(id: number): Promise<Repository | undefined>;
  getRepositoryByUrl(url: string): Promise<Repository | undefined>;
  createRepository(repository: InsertRepository): Promise<Repository>;
  updateRepository(id: number, updates: Partial<Repository>): Promise<Repository | undefined>;
  
  getCommitsByRepository(repositoryId: number): Promise<Commit[]>;
  createCommit(commit: InsertCommit): Promise<Commit>;
  getCommitsByRange(repositoryId: number, fromHash?: string, toHash?: string): Promise<Commit[]>;
}

export class MemStorage implements IStorage {
  private repositories: Map<number, Repository>;
  private commits: Map<number, Commit>;
  private currentRepoId: number;
  private currentCommitId: number;

  constructor() {
    this.repositories = new Map();
    this.commits = new Map();
    this.currentRepoId = 1;
    this.currentCommitId = 1;
  }

  async getRepository(id: number): Promise<Repository | undefined> {
    return this.repositories.get(id);
  }

  async getRepositoryByUrl(url: string): Promise<Repository | undefined> {
    return Array.from(this.repositories.values()).find(
      (repo) => repo.url === url,
    );
  }

  async createRepository(insertRepository: InsertRepository): Promise<Repository> {
    const id = this.currentRepoId++;
    const repository: Repository = { 
      ...insertRepository, 
      id,
      lastAnalyzed: new Date(),
    };
    this.repositories.set(id, repository);
    return repository;
  }

  async updateRepository(id: number, updates: Partial<Repository>): Promise<Repository | undefined> {
    const repo = this.repositories.get(id);
    if (!repo) return undefined;
    
    const updated = { ...repo, ...updates };
    this.repositories.set(id, updated);
    return updated;
  }

  async getCommitsByRepository(repositoryId: number): Promise<Commit[]> {
    return Array.from(this.commits.values()).filter(
      (commit) => commit.repositoryId === repositoryId,
    );
  }

  async createCommit(insertCommit: InsertCommit): Promise<Commit> {
    const id = this.currentCommitId++;
    const commit: Commit = { ...insertCommit, id };
    this.commits.set(id, commit);
    return commit;
  }

  async getCommitsByRange(repositoryId: number, fromHash?: string, toHash?: string): Promise<Commit[]> {
    const allCommits = await this.getCommitsByRepository(repositoryId);
    
    if (!fromHash && !toHash) {
      return allCommits;
    }
    
    // Simple implementation - in production would need proper git commit ordering
    let filteredCommits = allCommits;
    
    if (fromHash) {
      const fromIndex = allCommits.findIndex(c => c.hash === fromHash);
      if (fromIndex >= 0) {
        filteredCommits = allCommits.slice(fromIndex);
      }
    }
    
    if (toHash) {
      const toIndex = filteredCommits.findIndex(c => c.hash === toHash);
      if (toIndex >= 0) {
        filteredCommits = filteredCommits.slice(0, toIndex + 1);
      }
    }
    
    return filteredCommits;
  }
}

export const storage = new MemStorage();
