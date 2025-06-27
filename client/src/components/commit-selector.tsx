import { ChevronRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

interface GitCommit {
  oid: string;
  hash: string;
  message: string;
  author: string;
  date: string;
}

interface CommitSelectorProps {
  commits: GitCommit[];
  fromCommit: string;
  toCommit: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
}

export function CommitSelector({ commits, fromCommit, toCommit, onFromChange, onToChange }: CommitSelectorProps) {
  if (!commits || commits.length === 0) return null;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex-1 w-full">
            <Label className="text-sm font-medium text-muted-foreground">From Commit</Label>
            <Select value={fromCommit} onValueChange={onFromChange}>
              <SelectTrigger className="w-full mt-2">
                <SelectValue placeholder="Select starting commit" />
              </SelectTrigger>
              <SelectContent>
                {commits.map((commit) => (
                  <SelectItem key={commit.oid} value={commit.oid}>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs">{commit.oid.substring(0, 7)}</span>
                      <span className="truncate">{commit.message}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <ChevronRight className="text-muted-foreground mt-6 md:mt-0" />
          
          <div className="flex-1 w-full">
            <Label className="text-sm font-medium text-muted-foreground">To Commit</Label>
            <Select value={toCommit} onValueChange={onToChange}>
              <SelectTrigger className="w-full mt-2">
                <SelectValue placeholder="Select ending commit" />
              </SelectTrigger>
              <SelectContent>
                {commits.map((commit) => (
                  <SelectItem key={commit.oid} value={commit.oid}>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs">{commit.oid.substring(0, 7)}</span>
                      <span className="truncate">{commit.message}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}