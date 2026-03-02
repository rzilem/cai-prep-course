import { useCurrentFrame, interpolate } from 'remotion'

interface Scene {
  label: string
  startFrame: number
  endFrame: number
}

interface ProgressBarProps {
  scenes: Scene[]
  totalFrames: number
  moduleTitle: string
  lessonTitle: string
  brandColor: string
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  scenes,
  totalFrames,
  moduleTitle,
  lessonTitle,
  brandColor,
}) => {
  const frame = useCurrentFrame()

  // Overall progress
  const progress = Math.min(frame / totalFrames, 1)

  // Current scene
  const currentScene = scenes.find(
    (s) => frame >= s.startFrame && frame < s.endFrame
  )
  const currentSceneLabel = currentScene?.label ?? ''

  // Scene label fade in on scene change
  const sceneProgress = currentScene
    ? interpolate(
        frame,
        [currentScene.startFrame, currentScene.startFrame + 15],
        [0, 1],
        { extrapolateRight: 'clamp' }
      )
    : 1

  // Bar visibility (fade in after first few frames, fade out at very end)
  const barOpacity = interpolate(
    frame,
    [5, 15, totalFrames - 15, totalFrames],
    [0, 0.9, 0.9, 0],
    { extrapolateRight: 'clamp' }
  )

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 40,
        opacity: barOpacity,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        zIndex: 100,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Info bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 24px 4px',
          height: 24,
        }}
      >
        {/* Left: module / lesson info */}
        <div
          style={{
            fontSize: 12,
            color: '#94a3b8',
            fontWeight: 500,
            display: 'flex',
            gap: 8,
            alignItems: 'center',
          }}
        >
          <span style={{ color: '#64748b' }}>{moduleTitle}</span>
          <span style={{ color: '#475569' }}>/</span>
          <span>{lessonTitle}</span>
        </div>

        {/* Right: current scene label */}
        <div
          style={{
            fontSize: 12,
            color: brandColor,
            fontWeight: 600,
            opacity: sceneProgress,
            letterSpacing: 1,
            textTransform: 'uppercase',
          }}
        >
          {currentSceneLabel}
        </div>
      </div>

      {/* Progress bar track */}
      <div
        style={{
          height: 4,
          background: '#1e293b',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Progress bar fill */}
        <div
          style={{
            height: '100%',
            width: `${progress * 100}%`,
            background: `linear-gradient(90deg, ${brandColor}, ${brandColor}cc)`,
            borderRadius: '0 2px 2px 0',
            boxShadow: `0 0 8px ${brandColor}66`,
            transition: 'width 0.1s linear',
          }}
        />

        {/* Scene markers */}
        {scenes.map((scene, i) => {
          if (i === 0) return null // skip first marker (beginning)
          const markerPos = scene.startFrame / totalFrames
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${markerPos * 100}%`,
                top: 0,
                width: 1,
                height: '100%',
                background: '#334155',
              }}
            />
          )
        })}
      </div>
    </div>
  )
}
