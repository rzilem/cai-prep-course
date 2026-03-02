import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion'

interface QuizTransitionProps {
  questionCount: number
}

export const QuizTransition: React.FC<QuizTransitionProps> = ({ questionCount }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // "Test Your Knowledge!" scale-up
  const titleScale = spring({
    frame: frame - 10,
    fps,
    config: { damping: 8, stiffness: 150, mass: 0.5 },
  })
  const titleOpacity = interpolate(frame, [5, 20], [0, 1], {
    extrapolateRight: 'clamp',
  })

  // Timer circle animation
  const timerProgress = interpolate(frame, [20, 100], [0, 1], {
    extrapolateRight: 'clamp',
  })
  const timerRotation = interpolate(frame, [20, 100], [0, 360], {
    extrapolateRight: 'clamp',
  })

  // Question count badge
  const badgeOpacity = interpolate(frame, [40, 55], [0, 1], {
    extrapolateRight: 'clamp',
  })
  const badgeScale = spring({
    frame: frame - 40,
    fps,
    config: { damping: 10, stiffness: 120 },
  })

  // "Get ready..." fade out
  const readyOpacity = interpolate(frame, [60, 75, 120, 140], [0, 1, 1, 0], {
    extrapolateRight: 'clamp',
  })

  // Background energy pulse
  const bgPulse = interpolate(frame % 30, [0, 15, 30], [0.8, 1, 0.8])

  // Particle system (simple dots)
  const particles = Array.from({ length: 20 }, (_, i) => {
    const angle = (i / 20) * Math.PI * 2
    const speed = 2 + (i % 3)
    const radius = interpolate(frame, [0, 150], [0, 400 + i * 20], {
      extrapolateRight: 'clamp',
    })
    const x = Math.cos(angle + frame * 0.02) * radius * speed * 0.3
    const y = Math.sin(angle + frame * 0.02) * radius * speed * 0.3
    const particleOpacity = interpolate(frame, [10, 30, 120, 150], [0, 0.6, 0.6, 0], {
      extrapolateRight: 'clamp',
    })
    const size = 4 + (i % 4) * 2

    return { x, y, opacity: particleOpacity, size }
  })

  // Timer circle SVG
  const circumference = 2 * Math.PI * 60
  const strokeDashoffset = circumference * (1 - timerProgress)

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: `radial-gradient(circle at center, #1e1b4b, #0f172a)`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Background energy pulse */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at center, #7c3aed${Math.round(bgPulse * 15).toString(16).padStart(2, '0')} 0%, transparent 50%)`,
        }}
      />

      {/* Particles */}
      {particles.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: i % 2 === 0 ? '#7c3aed' : '#0ea5e9',
            opacity: p.opacity,
            transform: `translate(${p.x}px, ${p.y}px)`,
          }}
        />
      ))}

      {/* Timer circle */}
      <div
        style={{
          position: 'relative',
          marginBottom: 40,
          opacity: interpolate(frame, [15, 25], [0, 1], { extrapolateRight: 'clamp' }),
        }}
      >
        <svg
          width="160"
          height="160"
          style={{ transform: `rotate(${timerRotation * 0.5}deg)` }}
        >
          {/* Background circle */}
          <circle
            cx="80"
            cy="80"
            r="60"
            fill="none"
            stroke="#334155"
            strokeWidth="6"
          />
          {/* Progress circle */}
          <circle
            cx="80"
            cy="80"
            r="60"
            fill="none"
            stroke="#7c3aed"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 80 80)"
            style={{ filter: 'drop-shadow(0 0 8px #7c3aed)' }}
          />
        </svg>
        {/* Timer icon center */}
        <svg
          viewBox="0 0 24 24"
          width="40"
          height="40"
          fill="none"
          stroke="#a78bfa"
          strokeWidth="2"
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      </div>

      {/* "Test Your Knowledge!" */}
      <div
        style={{
          opacity: titleOpacity,
          transform: `scale(${titleScale})`,
          fontSize: 64,
          fontWeight: 900,
          color: '#f8fafc',
          textAlign: 'center',
          letterSpacing: -1,
          textShadow: '0 4px 30px rgba(124, 58, 237, 0.5)',
        }}
      >
        Test Your Knowledge!
      </div>

      {/* Question count badge */}
      <div
        style={{
          opacity: badgeOpacity,
          transform: `scale(${badgeScale})`,
          marginTop: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: '#7c3aed22',
          border: '2px solid #7c3aed55',
          borderRadius: 24,
          padding: '10px 28px',
        }}
      >
        <span style={{ fontSize: 28, fontWeight: 800, color: '#a78bfa' }}>
          {questionCount}
        </span>
        <span style={{ fontSize: 22, color: '#94a3b8', fontWeight: 500 }}>
          questions ahead
        </span>
      </div>

      {/* "Get ready..." */}
      <div
        style={{
          opacity: readyOpacity,
          marginTop: 40,
          fontSize: 32,
          color: '#64748b',
          fontWeight: 500,
          fontStyle: 'italic',
        }}
      >
        Get ready...
      </div>
    </div>
  )
}
