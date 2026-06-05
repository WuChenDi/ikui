"use client";

import * as React from "react";
import { Loader2, Pause, Play } from "lucide-react";
import { AudioVisualizer } from "@/components/audio-visualizer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AudioPlayerProps {
  /**
   * Audio blob to play and visualize. Takes precedence over `url`.
   */
  blob?: Blob;
  /**
   * Audio URL to play and visualize.
   */
  url?: string;
  /**
   * Width of the visualizer. Defaults to the container width.
   */
  width?: number;
  /**
   * Height of the visualizer. Default: `84`
   */
  height?: number;
  /**
   * Width of each individual bar. Default: `2`
   */
  barWidth?: number;
  /**
   * Gap between each bar. Default: `1`
   */
  gap?: number;
  /**
   * Color of the bars that have not yet been played.
   */
  barColor?: string;
  /**
   * Color of the bars that have been played. Default: `"rgb(34, 197, 94)"`
   */
  barPlayedColor?: string;
  /**
   * Additional CSS classes for the wrapper.
   */
  className?: string;
  /**
   * Called whenever playback starts or stops.
   */
  onPlayStateChange?: (playing: boolean) => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function AudioPlayer({
  blob,
  url,
  width,
  height = 84,
  barWidth = 2,
  gap = 1,
  barColor,
  barPlayedColor = "rgb(34, 197, 94)",
  className,
  onPlayStateChange,
}: AudioPlayerProps) {
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const onPlayStateChangeRef = React.useRef(onPlayStateChange);
  onPlayStateChangeRef.current = onPlayStateChange;
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [visualizerBlob, setVisualizerBlob] = React.useState<Blob | null>(
    blob ?? null,
  );

  React.useEffect(() => {
    if (!blob && !url) return;

    const objectUrl = blob ? URL.createObjectURL(blob) : null;
    const audioUrl = objectUrl ?? url;

    if (!audioUrl) return;

    const audio = new Audio(audioUrl);

    audio.onloadedmetadata = () => setDuration(audio.duration);
    audio.ontimeupdate = () => setCurrentTime(audio.currentTime);
    audio.onended = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      onPlayStateChangeRef.current?.(false);
    };

    audioRef.current = audio;

    return () => {
      audio.pause();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      audioRef.current = null;
      setIsPlaying(false);
      setCurrentTime(0);
    };
  }, [blob, url]);

  React.useEffect(() => {
    if (blob) {
      setVisualizerBlob(blob);
      return;
    }

    if (!url) {
      setVisualizerBlob(null);
      return;
    }

    let cancelled = false;
    setVisualizerBlob(null);

    fetch(url)
      .then((res) => res.blob())
      .then((audioBlob) => {
        if (!cancelled) setVisualizerBlob(audioBlob);
      })
      .catch(() => {
        if (!cancelled) setVisualizerBlob(null);
      });

    return () => {
      cancelled = true;
    };
  }, [blob, url]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      onPlayStateChange?.(false);
    } else {
      void audio.play();
      setIsPlaying(true);
      onPlayStateChange?.(true);
    }
  };

  return (
    <div
      className={cn("relative flex flex-col gap-3 rounded-lg w-full", className)}
    >
      <div className="flex items-center gap-3">
        <Button
          variant="secondary"
          size="icon"
          className="size-9 rounded-full shrink-0"
          onClick={togglePlay}
        >
          {isPlaying ? (
            <Pause className="size-4" />
          ) : (
            <Play className="size-4" />
          )}
        </Button>

        {visualizerBlob ? (
          <AudioVisualizer
            blob={visualizerBlob}
            width={width}
            height={height}
            barWidth={barWidth}
            gap={gap}
            backgroundColor="transparent"
            barColor={barColor}
            barPlayedColor={barPlayedColor}
            currentTime={currentTime}
          />
        ) : (
          <div className="flex items-center justify-center h-20">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      <div className="flex justify-between text-xs text-muted-foreground pl-12 px-0.5 select-none">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
}

export { AudioPlayer };
export type { AudioPlayerProps };
