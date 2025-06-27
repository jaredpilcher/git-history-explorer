import { Play, Pause, Rewind, FastForward } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PlaybackControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onRewind: () => void;
  onFastForward: () => void;
  speed: number;
  onSpeedChange: () => void;
}

export function PlaybackControls({ 
  isPlaying, 
  onPlayPause, 
  onRewind, 
  onFastForward, 
  speed, 
  onSpeedChange 
}: PlaybackControlsProps) {
  return (
    <div className="flex items-center justify-center gap-4 p-4 bg-card border-t">
      <Button
        variant="ghost"
        size="icon"
        onClick={onRewind}
        className="rounded-full"
      >
        <Rewind className="h-5 w-5" />
      </Button>
      
      <Button
        size="icon"
        onClick={onPlayPause}
        className="rounded-full h-12 w-12 bg-primary hover:bg-primary/90"
      >
        {isPlaying ? (
          <Pause className="h-6 w-6" />
        ) : (
          <Play className="h-6 w-6 ml-0.5" />
        )}
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={onFastForward}
        className="rounded-full"
      >
        <FastForward className="h-5 w-5" />
      </Button>
      
      <Button
        variant="ghost"
        onClick={onSpeedChange}
        className="min-w-16 rounded-full font-mono text-sm"
      >
        {speed}x
      </Button>
    </div>
  );
}