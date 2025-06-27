import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import type { GitAnalysisResponse } from "@shared/schema";

interface TimelineProps {
  commits: GitAnalysisResponse['commits'];
  currentIndex: number;
  onTimelineChange: (index: number) => void;
}

export function Timeline({ commits, currentIndex, onTimelineChange }: TimelineProps) {
  if (!commits?.length) {
    return (
      <Card>
        <CardContent className="p-4 text-center text-sm text-muted-foreground">
          Please select a valid commit range.
        </CardContent>
      </Card>
    );
  }

  const currentCommit = commits[currentIndex] ?? commits[0];

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <Slider
          value={[currentIndex]}
          onValueChange={(value) => onTimelineChange(value[0])}
          max={commits.length - 1}
          min={0}
          step={1}
          className="w-full"
        />
        
        <div className="flex justify-between text-xs text-muted-foreground">
          <span className="truncate max-w-[150px]">
            {commits[0]?.message.slice(0, 40)}...
          </span>
          <span className="truncate max-w-[150px]">
            {commits[commits.length - 1]?.message.slice(0, 40)}...
          </span>
        </div>
        
        <div className="text-center space-y-1 p-3 bg-muted rounded-md">
          <p className="font-semibold text-sm">
            {currentCommit?.message}
          </p>
          <p className="text-xs text-muted-foreground">
            {currentCommit?.author} - {currentCommit ? new Date(currentCommit.date).toLocaleString() : ''}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}