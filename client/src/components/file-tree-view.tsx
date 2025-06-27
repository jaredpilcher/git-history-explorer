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
}

export function FileTreeView({ tree, onFileSelect, selectedFile }: FileTreeViewProps) {
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

    const flashVariant = {
      flash: { 
        backgroundColor: "rgba(234, 179, 8, 0.3)", 
        transition: { duration: 0.1, repeat: 3, repeatType: "reverse" as const } 
      },
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
          }`}
          style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}
          variants={flashVariant}
          animate={node.status === 'modified' ? "flash" : "normal"}
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
      <h3 className="text-sm font-semibold p-2 mb-2 text-muted-foreground uppercase tracking-wider">
        File System
      </h3>
      <AnimatePresence>
        {tree ? (
          <TreeNode key="root-node" node={tree} />
        ) : (
          <p className="text-xs text-muted-foreground p-2">
            No file data available.
          </p>
        )}
      </AnimatePresence>
    </div>
  );
}