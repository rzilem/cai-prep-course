'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Player, PlayerRef } from '@remotion/player'
import { LessonVideo } from '../../remotion/compositions/LessonVideo'

interface VideoPlayerProps {
  lessonTitle: string
  moduleTitle: string
  courseTitle: string
  credentialCode: string
  keyPoints: string[]
  texasLawCallout?: { statute: string; title: string; description: string } | null
  scenarioTitle?: string | null
  brandColor?: string
  videoUrl?: string
  onProgress?: (percent: number) => void
  onComplete?: () => void
}

export function VideoPlayer({
  lessonTitle,
  moduleTitle,
  courseTitle,
  credentialCode,
  keyPoints,
  texasLawCallout = null,
  scenarioTitle = null,
  brandColor = '#0ea5e9',
  videoUrl,
  onProgress,
  onComplete,
}: VideoPlayerProps) {
  const playerRef = useRef<PlayerRef>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [lastReportedPercent, setLastReportedPercent] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Calculate Remotion composition duration
  const introFrames = 150
  const keyPointFrames = keyPoints.length * 900
  const texasLawFrames = texasLawCallout ? 450 : 0
  const scenarioFrames = scenarioTitle ? 900 : 0
  const summaryFrames = 600
  const quizFrames = 150
  const outroFrames = 150
  const totalDurationInFrames =
    introFrames + keyPointFrames + texasLawFrames + scenarioFrames + summaryFrames + quizFrames + outroFrames

  const fps = 30
  const totalDurationSeconds = totalDurationInFrames / fps

  // Progress tracking for Remotion player
  useEffect(() => {
    if (videoUrl || !playerRef.current) return

    const interval = setInterval(() => {
      const player = playerRef.current
      if (!player) return

      const frame = player.getCurrentFrame()
      const percent = Math.round((frame / totalDurationInFrames) * 100)

      setCurrentTime(frame / fps)
      setDuration(totalDurationSeconds)

      // Report progress every 10%
      const bucket = Math.floor(percent / 10) * 10
      if (bucket > lastReportedPercent && onProgress) {
        setLastReportedPercent(bucket)
        onProgress(bucket)
      }

      // Completion
      if (frame >= totalDurationInFrames - 1 && onComplete) {
        onComplete()
      }
    }, 500)

    return () => clearInterval(interval)
  }, [videoUrl, totalDurationInFrames, totalDurationSeconds, lastReportedPercent, onProgress, onComplete])

  // Progress tracking for HTML5 video
  const handleVideoTimeUpdate = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    setCurrentTime(video.currentTime)
    setDuration(video.duration || 0)

    const percent = Math.round((video.currentTime / video.duration) * 100)
    const bucket = Math.floor(percent / 10) * 10
    if (bucket > lastReportedPercent && onProgress) {
      setLastReportedPercent(bucket)
      onProgress(bucket)
    }
  }, [lastReportedPercent, onProgress])

  const handleVideoEnded = useCallback(() => {
    setIsPlaying(false)
    if (onComplete) onComplete()
  }, [onComplete])

  // Controls visibility on mouse movement
  const handleMouseMove = useCallback(() => {
    setShowControls(true)
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false)
    }, 3000)
  }, [isPlaying])

  // Fullscreen handling
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }, [])

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFsChange)
    return () => document.removeEventListener('fullscreenchange', handleFsChange)
  }, [])

  // Toggle play/pause
  const togglePlay = useCallback(() => {
    if (videoUrl) {
      const video = videoRef.current
      if (!video) return
      if (video.paused) {
        video.play()
        setIsPlaying(true)
      } else {
        video.pause()
        setIsPlaying(false)
      }
    } else {
      const player = playerRef.current
      if (!player) return
      if (isPlaying) {
        player.pause()
        setIsPlaying(false)
      } else {
        player.play()
        setIsPlaying(true)
      }
    }
  }, [videoUrl, isPlaying])

  // Volume
  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value)
      setVolume(val)
      setIsMuted(val === 0)
      if (videoRef.current) {
        videoRef.current.volume = val
        videoRef.current.muted = val === 0
      }
      if (playerRef.current) {
        playerRef.current.setVolume(val)
      }
    },
    []
  )

  const toggleMute = useCallback(() => {
    const newMuted = !isMuted
    setIsMuted(newMuted)
    if (videoRef.current) {
      videoRef.current.muted = newMuted
    }
    if (newMuted) {
      setVolume(0)
      if (playerRef.current) playerRef.current.setVolume(0)
    } else {
      setVolume(1)
      if (playerRef.current) playerRef.current.setVolume(1)
    }
  }, [isMuted])

  // Playback speed
  const cyclePlaybackRate = useCallback(() => {
    const rates = [1, 1.5, 2]
    const currentIndex = rates.indexOf(playbackRate)
    const nextRate = rates[(currentIndex + 1) % rates.length]
    setPlaybackRate(nextRate)
    if (videoRef.current) {
      videoRef.current.playbackRate = nextRate
    }
  }, [playbackRate])

  // Progress bar seek
  const handleSeek = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value)
      if (videoUrl && videoRef.current) {
        videoRef.current.currentTime = val
        setCurrentTime(val)
      } else if (playerRef.current) {
        const frame = Math.round(val * fps)
        playerRef.current.seekTo(frame)
        setCurrentTime(val)
      }
    },
    [videoUrl]
  )

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-black rounded-xl overflow-hidden group"
      style={{ aspectRatio: '16 / 9' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* Video content */}
      {videoUrl ? (
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full object-contain"
          onTimeUpdate={handleVideoTimeUpdate}
          onEnded={handleVideoEnded}
          onLoadedMetadata={() => {
            if (videoRef.current) setDuration(videoRef.current.duration)
          }}
          playsInline
        />
      ) : (
        <Player
          ref={playerRef}
          component={LessonVideo}
          inputProps={{
            lessonTitle,
            moduleTitle,
            courseTitle,
            credentialCode,
            keyPoints,
            texasLawCallout: texasLawCallout ?? null,
            scenarioTitle: scenarioTitle ?? null,
            brandColor,
          }}
          durationInFrames={totalDurationInFrames}
          fps={fps}
          compositionWidth={1920}
          compositionHeight={1080}
          style={{ width: '100%', height: '100%' }}
          controls={false}
          playbackRate={playbackRate}
        />
      )}

      {/* Click to play/pause overlay */}
      <div
        className="absolute inset-0 cursor-pointer z-10"
        onClick={togglePlay}
      />

      {/* Custom controls overlay */}
      <div
        className="absolute bottom-0 left-0 right-0 z-20 transition-opacity duration-300"
        style={{
          opacity: showControls ? 1 : 0,
          pointerEvents: showControls ? 'auto' : 'none',
          background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
          padding: '40px 16px 12px',
        }}
      >
        {/* Progress bar */}
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xs text-zinc-400 font-mono tabular-nums w-10 text-right">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={duration || totalDurationSeconds}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="flex-1 h-1 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, ${brandColor} ${
                (currentTime / (duration || totalDurationSeconds)) * 100
              }%, #334155 ${(currentTime / (duration || totalDurationSeconds)) * 100}%)`,
            }}
          />
          <span className="text-xs text-zinc-400 font-mono tabular-nums w-10">
            {formatTime(duration || totalDurationSeconds)}
          </span>
        </div>

        {/* Buttons row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Play/Pause */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                togglePlay()
              }}
              className="text-white hover:text-zinc-300 transition-colors p-1"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="6,3 20,12 6,21" />
                </svg>
              )}
            </button>

            {/* Volume */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleMute()
              }}
              className="text-white hover:text-zinc-300 transition-colors p-1"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                </svg>
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={handleVolumeChange}
              onClick={(e) => e.stopPropagation()}
              className="w-16 h-1 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, white ${volume * 100}%, #475569 ${volume * 100}%)`,
              }}
            />
          </div>

          <div className="flex items-center gap-3">
            {/* Playback speed */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                cyclePlaybackRate()
              }}
              className="text-white hover:text-zinc-300 transition-colors text-xs font-semibold px-2 py-1 rounded border border-zinc-600 hover:border-zinc-500"
            >
              {playbackRate}x
            </button>

            {/* Fullscreen */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleFullscreen()
              }}
              className="text-white hover:text-zinc-300 transition-colors p-1"
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="4 14 10 14 10 20" />
                  <polyline points="20 10 14 10 14 4" />
                  <line x1="14" y1="10" x2="21" y2="3" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 3 21 3 21 9" />
                  <polyline points="9 21 3 21 3 15" />
                  <line x1="21" y1="3" x2="14" y2="10" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Big play button overlay when paused */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
              <polygon points="8,4 20,12 8,20" />
            </svg>
          </div>
        </div>
      )}
    </div>
  )
}
