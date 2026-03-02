import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion'

interface LessonIntroProps {
  lessonTitle: string
  moduleTitle: string
  courseTitle: string
  credentialCode: string
  brandColor: string
}

export const LessonIntro: React.FC<LessonIntroProps> = ({
  lessonTitle,
  moduleTitle,
  courseTitle,
  credentialCode,
  brandColor,
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // Credential badge fade in (starts at frame 0)
  const badgeOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: 'clamp',
  })
  const badgeTranslateY = interpolate(frame, [0, 20], [-20, 0], {
    extrapolateRight: 'clamp',
  })

  // Module title fade in (starts at frame 15)
  const moduleOpacity = interpolate(frame, [15, 35], [0, 1], {
    extrapolateRight: 'clamp',
  })
  const moduleTranslateY = interpolate(frame, [15, 35], [20, 0], {
    extrapolateRight: 'clamp',
  })

  // Lesson title spring scale (starts at frame 30)
  const titleScale = spring({
    frame: frame - 30,
    fps,
    config: {
      damping: 12,
      stiffness: 100,
      mass: 0.8,
    },
  })

  const titleOpacity = interpolate(frame, [30, 50], [0, 1], {
    extrapolateRight: 'clamp',
  })

  // Course title at bottom (starts at frame 60)
  const courseOpacity = interpolate(frame, [60, 80], [0, 1], {
    extrapolateRight: 'clamp',
  })

  // Grid pattern opacity
  const gridOpacity = interpolate(frame, [0, 40], [0, 0.08], {
    extrapolateRight: 'clamp',
  })

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: `linear-gradient(135deg, ${brandColor} 0%, #0f172a 60%, #020617 100%)`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Grid pattern overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: gridOpacity,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Radial glow behind title */}
      <div
        style={{
          position: 'absolute',
          width: 800,
          height: 800,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${brandColor}30 0%, transparent 70%)`,
          opacity: interpolate(frame, [20, 60], [0, 1], { extrapolateRight: 'clamp' }),
        }}
      />

      {/* Credential badge - top left */}
      <div
        style={{
          position: 'absolute',
          top: 60,
          left: 60,
          opacity: badgeOpacity,
          transform: `translateY(${badgeTranslateY}px)`,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 12,
            background: `linear-gradient(135deg, ${brandColor}, ${brandColor}cc)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            fontWeight: 800,
            color: '#fff',
            letterSpacing: 1,
            boxShadow: `0 4px 20px ${brandColor}66`,
          }}
        >
          {credentialCode.slice(0, 4)}
        </div>
        <div
          style={{
            fontSize: 18,
            color: '#94a3b8',
            fontWeight: 500,
          }}
        >
          Certification Prep
        </div>
      </div>

      {/* Module title */}
      <div
        style={{
          opacity: moduleOpacity,
          transform: `translateY(${moduleTranslateY}px)`,
          fontSize: 28,
          color: brandColor,
          fontWeight: 600,
          letterSpacing: 3,
          textTransform: 'uppercase',
          marginBottom: 24,
        }}
      >
        {moduleTitle}
      </div>

      {/* Lesson title (main) */}
      <div
        style={{
          opacity: titleOpacity,
          transform: `scale(${titleScale})`,
          fontSize: 72,
          fontWeight: 800,
          color: '#f8fafc',
          textAlign: 'center',
          maxWidth: 1200,
          lineHeight: 1.2,
          textShadow: '0 4px 30px rgba(0,0,0,0.5)',
        }}
      >
        {lessonTitle}
      </div>

      {/* Decorative line */}
      <div
        style={{
          marginTop: 32,
          width: interpolate(frame, [40, 70], [0, 200], { extrapolateRight: 'clamp' }),
          height: 3,
          background: `linear-gradient(90deg, transparent, ${brandColor}, transparent)`,
          borderRadius: 2,
        }}
      />

      {/* Course name at bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: 60,
          opacity: courseOpacity,
          fontSize: 20,
          color: '#64748b',
          fontWeight: 500,
          letterSpacing: 2,
        }}
      >
        {courseTitle}
      </div>
    </div>
  )
}
