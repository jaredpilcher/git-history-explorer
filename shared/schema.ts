import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const repositories = pgTable("repositories", {
  id: serial("id").primaryKey(),
  url: text("url").notNull().unique(),
  name: text("name").notNull(),
  lastAnalyzed: timestamp("last_analyzed"),
});

export const commits = pgTable("commits", {
  id: serial("id").primaryKey(),
  repositoryId: integer("repository_id").references(() => repositories.id),
  hash: text("hash").notNull(),
  message: text("message").notNull(),
  author: text("author").notNull(),
  date: timestamp("date").notNull(),
  filesChanged: jsonb("files_changed"),
});

export const insertRepositorySchema = createInsertSchema(repositories).omit({
  id: true,
  lastAnalyzed: true,
});

export const insertCommitSchema = createInsertSchema(commits).omit({
  id: true,
});

export type InsertRepository = z.infer<typeof insertRepositorySchema>;
export type Repository = typeof repositories.$inferSelect;
export type InsertCommit = z.infer<typeof insertCommitSchema>;
export type Commit = typeof commits.$inferSelect;

// Git analysis types
export const gitAnalysisSchema = z.object({
  repoUrl: z.string().url(),
  fromCommit: z.string().optional(),
  toCommit: z.string().optional(),
});

export type GitAnalysisRequest = z.infer<typeof gitAnalysisSchema>;

const baseFileTreeNodeSchema = z.object({
  name: z.string(),
  type: z.enum(["file", "folder"]),
  path: z.string(),
  status: z.enum(["added", "modified", "deleted", "unchanged"]).optional(),
  additions: z.number().optional(),
  deletions: z.number().optional(),
});

export const fileTreeNodeSchema: z.ZodType<any> = baseFileTreeNodeSchema.extend({
  children: z.lazy(() => fileTreeNodeSchema.array()).optional(),
});

export type FileTreeNode = z.infer<typeof baseFileTreeNodeSchema> & {
  children?: FileTreeNode[];
};

// Architecture diagram types
export const architectureDiagramNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  x: z.number(),
  y: z.number(),
});

export const architectureDiagramLinkSchema = z.object({
  source: z.string(),
  target: z.string(),
});

export const architectureDiagramSchema = z.object({
  nodes: z.array(architectureDiagramNodeSchema),
  links: z.array(architectureDiagramLinkSchema),
});

export type ArchitectureDiagramNode = z.infer<typeof architectureDiagramNodeSchema>;
export type ArchitectureDiagramLink = z.infer<typeof architectureDiagramLinkSchema>;
export type ArchitectureDiagram = z.infer<typeof architectureDiagramSchema>;

export const gitAnalysisResponseSchema = z.object({
  commits: z.array(z.object({
    oid: z.string(), // Note: using 'oid' to match original format
    hash: z.string(),
    message: z.string(),
    author: z.string(),
    date: z.string(),
    filesChanged: z.number(),
  })),
  fileTree: fileTreeNodeSchema,
  fileTreeHistory: z.array(fileTreeNodeSchema),
  architectureNotes: z.array(z.string()),
  architectureDiagrams: z.array(architectureDiagramSchema),
  fileContents: z.object({
    before: z.string(),
    after: z.string(),
  }),
  stats: z.object({
    totalAdditions: z.number(),
    totalDeletions: z.number(),
    filesChanged: z.number(),
    commitsCount: z.number(),
  }),
  fileDiffs: z.record(z.object({
    before: z.string(),
    after: z.string(),
    additions: z.number(),
    deletions: z.number(),
  })),
});

export type GitAnalysisResponse = z.infer<typeof gitAnalysisResponseSchema>;
