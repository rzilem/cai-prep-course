import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion'

interface LessonOutroProps {
  lessonTitle: string
  xpEarned: number
  nextLessonTitle: string
}

export const LessonOutro: React.FC<LessonOutroProps> = ({
  lessonTitle,
  xpEarned,
  nextLessonTitle,
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // "Lesson Complete" animation
  const completeScale = spring({
    frame: frame - 5,
    fps,
    config: { damping: 10, stiffness: 120, mass: 0.6 },
  })
  const completeOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: 'clamp',
  })

  // Checkmark draw animation
  const checkProgress = interpolate(frame, [15, 45], [0, 1], {
    extrapolateRight: 'clamp',
  })

  // XP float up
  const xpOpacity = interpolate(frame, [35, 50], [0, 1], {
    extrapolateRight: 'clamp',
  })
  const xpTranslateY = interpolate(frame, [35, 80], [40, 0], {
    extrapolateRight: 'clamp',
  })
  const xpScale = spring({
    frame: frame - 35,
    fps,
    config: { damping: 8, stiffness: 100 },
  })

  // Next lesson preview
  const nextOpacity = interpolate(frame, [60, 80], [0, 1], {
    extrapolateRight: 'clamp',
  })
  const nextTranslateY = interpolate(frame, [60, 80], [20, 0], {
    extrapolateRight: 'clamp',
  })

  // Logo fade in
  const logoOpacity = interpolate(frame, [80, 100], [0, 1], {
    extrapolateRight: 'clamp',
  })

  // Celebration particles
  const celebrationOpacity = interpolate(frame, [10, 30, 120, 150], [0, 1, 1, 0], {
    extrapolateRight: 'clamp',
  })

  // Checkmark SVG path
  const checkLength = 40
  const checkDashoffset = checkLength * (1 - checkProgress)

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: 'linear-gradient(160deg, #0f172a 0%, #022c22 50%, #0f172a 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Radial glow */}
      <div
        style={{
          position: 'absolute',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, #4ade8020 0%, transparent 70%)',
          opacity: interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' }),
        }}
      />

      {/* Celebration particles */}
      {Array.from({ length: 16 }, (_, i) => {
        const angle = (i / 16) * Math.PI * 2
        const radius = interpolate(frame, [10, 60], [0, 200 + (i % 4) * 60], {
          extrapolateRight: 'clamp',
        })
        const x = Math.cos(angle) * radius
        const y = Math.sin(angle) * radius
        const colors = ['#4ade80', '#22d3ee', '#a78bfa', '#f59e0b']

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: '50%',
              top: '40%',
              width: 8 + (i % 3) * 4,
              height: 8 + (i % 3) * 4,
              borderRadius: i % 2 === 0 ? '50%' : 2,
              background: colors[i % colors.length],
              opacity: celebrationOpacity * (0.4 + (i % 3) * 0.2),
              transform: `translate(${x}px, ${y}px) rotate(${frame * 3 + i * 45}deg)`,
            }}
          />
        )
      })}

      {/* Checkmark circle */}
      <div
        style={{
          opacity: completeOpacity,
          transform: `scale(${completeScale})`,
          marginBottom: 32,
        }}
      >
        <svg width="120" height="120" viewBox="0 0 120 120">
          {/* Circle background */}
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="#4ade8020"
            stroke="#4ade80"
            strokeWidth="4"
          />
          {/* Animated checkmark */}
          <path
            d="M 36 60 L 52 76 L 84 44"
            fill="none"
            stroke="#4ade80"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={checkLength}
            strokeDashoffset={checkDashoffset}
          />
        </svg>
      </div>

      {/* "Lesson Complete" */}
      <div
        style={{
          opacity: completeOpacity,
          fontSize: 56,
          fontWeight: 800,
          color: '#f8fafc',
          textAlign: 'center',
          letterSpacing: -1,
        }}
      >
        Lesson Complete
      </div>

      {/* XP earned */}
      <div
        style={{
          opacity: xpOpacity,
          transform: `translateY(${xpTranslateY}px) scale(${xpScale})`,
          marginTop: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: '#f59e0b22',
          border: '2px solid #f59e0b55',
          borderRadius: 16,
          padding: '10px 28px',
        }}
      >
        <svg
          viewBox="0 0 24 24"
          width="28"
          height="28"
          fill="#f59e0b"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
        <span style={{ fontSize: 32, fontWeight: 800, color: '#f59e0b' }}>
          +{xpEarned} XP
        </span>
      </div>

      {/* Next lesson preview */}
      <div
        style={{
          opacity: nextOpacity,
          transform: `translateY(${nextTranslateY}px)`,
          marginTop: 40,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <span style={{ fontSize: 22, color: '#64748b', fontWeight: 500 }}>
          Next:
        </span>
        <span style={{ fontSize: 22, color: '#e2e8f0', fontWeight: 600 }}>
          {nextLessonTitle}
        </span>
        <svg
          viewBox="0 0 24 24"
          width="24"
          height="24"
          fill="none"
          stroke="#64748b"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12h14" />
          <path d="m12 5 7 7-7 7" />
        </svg>
      </div>

      {/* PSPM branding at bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: 50,
          opacity: logoOpacity,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
        }}
      >
        {/* Simple PSPM logo placeholder */}
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #0ea5e9, #7c3aed)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            fontWeight: 800,
            color: '#fff',
            letterSpacing: 1,
          }}
        >
          PS
        </div>
        <div
          style={{
            fontSize: 16,
            color: '#475569',
            fontWeight: 500,
            letterSpacing: 2,
          }}
        >
          PSPM CAI Prep Course
        </div>
      </div>
    </div>
  )
}
