import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { File, Folder, FolderOpen, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FileTreeNode {
  name: string;
  type: "file" | "folder";
  path: string;
  status?: "added" | "modified" | "deleted" | "unchanged";
  children?: FileTreeNode[];
  additions?: number;
  deletions?: number;
}

interface FileTreeViewProps {
  tree: FileTreeNode | null;
  onFileSelect: (filePath: string) => void;
  selectedFile: string;
  isCurrentFileChanged?: boolean; // Whether the selected file has changes in current commit
}

export function FileTreeView({ tree, onFileSelect, selectedFile, isCurrentFileChanged = true }: FileTreeViewProps) {
  const [showChangedOnly, setShowChangedOnly] = useState(true); // Default to showing only changed files

  // Filter tree to show only changed files, but always include the selected file
  const filterChangedFiles = (node: FileTreeNode): FileTreeNode | null => {
    if (!node) return null;
    
    if (node.type === 'file') {
      // Always include the selected file, even if unchanged
      const isSelected = node.path === selectedFile;
      const hasChanges = node.status && node.status !== 'unchanged';
      return (hasChanges || isSelected) ? node : null;
    }
    
    // For folders, recursively filter children
    const filteredChildren = node.children
      ?.map(child => filterChangedFiles(child))
      .filter(Boolean) as FileTreeNode[];
    
    // Only include folder if it has changed children or contains the selected file
    if (filteredChildren && filteredChildren.length > 0) {
      return {
        ...node,
        children: filteredChildren
      };
    }
    
    return null;
  };

  const displayTree = showChangedOnly && tree ? filterChangedFiles(tree) : tree;

  const FileStatusIcon = ({ status }: { status?: string }) => {
    const icons = {
      added: <span className="text-green-500 font-bold">+</span>,
      modified: <span className="text-yellow-500 font-bold">M</span>,
      deleted: <span className="text-red-500 font-bold">-</span>,
    };
    return (icons as any)[status || ''] || null;
  };

  const TreeNode = ({ node, level = 0, path = '' }: { 
    node: FileTreeNode; 
    level?: number; 
    path?: string; 
  }) => {
    const [isOpen, setIsOpen] = useState(level < 2);
    const isFolder = node.type === 'folder';
    const currentPath = path ? `${path}/${node.name}` : node.name;
    const isSelected = !isFolder && selectedFile === currentPath;

    const variants = {
      hidden: { opacity: 0, x: -20, height: 0 },
      visible: { 
        opacity: 1, 
        x: 0, 
        height: 'auto', 
        transition: { duration: 0.3 } 
      }
    };

    const backgroundVariant = {
      normal: { 
        backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.2)' : 'rgba(0, 0, 0, 0)' 
      }
    };

    return (
      <motion.div 
        layout 
        initial="hidden" 
        animate="visible" 
        exit="hidden" 
        variants={variants}
      >
        <motion.div
          onClick={() => isFolder ? setIsOpen(!isOpen) : onFileSelect(currentPath)}
          className={`flex items-center gap-2 p-1.5 rounded-md cursor-pointer text-sm hover:bg-muted transition-colors ${
            isSelected ? 'bg-primary/10 text-primary' : ''
          } ${
            isSelected && !isCurrentFileChanged ? 'opacity-50' : ''
          }`}
          style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}
          variants={backgroundVariant}
          animate="normal"
        >
          {isFolder ? (
            <Folder 
              size={16} 
              className={`transition-transform duration-200 ${
                isOpen ? 'text-blue-400' : 'text-muted-foreground'
              }`} 
            />
          ) : (
            <File size={16} className="text-muted-foreground" />
          )}
          
          <span className={`flex-1 truncate ${
            isSelected ? 'font-semibold' : ''
          }`}>
            {node.name}
          </span>
          
          {node.status !== 'unchanged' && node.status && (
            <FileStatusIcon status={node.status} />
          )}
        </motion.div>

        <AnimatePresence>
          {isFolder && isOpen && node.children && (
            <motion.div
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {node.children.map(child => (
                <TreeNode
                  key={currentPath + '/' + child.name}
                  node={child}
                  level={level + 1}
                  path={currentPath === 'root' ? '' : currentPath}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <div className="h-full overflow-y-auto p-2">
      <div className="flex items-center justify-between p-2 mb-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          File System
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowChangedOnly(!showChangedOnly)}
          className={`h-7 px-2 text-xs ${showChangedOnly ? 'bg-primary/10 text-primary' : ''}`}
          title={showChangedOnly ? "Show all files" : "Show only changed files"}
        >
          {showChangedOnly ? (
            <>
              <X size={12} className="mr-1" />
              All Files
            </>
          ) : (
            <>
              <Filter size={12} className="mr-1" />
              Changed Only
            </>
          )}
        </Button>
      </div>
      <AnimatePresence mode="wait">
        {displayTree ? (
          <TreeNode key={`${showChangedOnly ? 'filtered' : 'all'}-root-node`} node={displayTree} />
        ) : showChangedOnly ? (
          <motion.p 
            key="no-changes"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-xs text-muted-foreground p-2 text-center"
          >
            No changed files found.
          </motion.p>
        ) : (
          <motion.p 
            key="no-data"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-xs text-muted-foreground p-2"
          >
            No file data available.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}