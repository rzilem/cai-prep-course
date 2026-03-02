import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion'

interface ScenarioSceneProps {
  title: string
  description: string
  choices: string[]
}

export const ScenarioScene: React.FC<ScenarioSceneProps> = ({
  title,
  description,
  choices,
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // "SCENARIO" badge
  const badgeOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: 'clamp',
  })

  // Title animation
  const titleSpring = spring({
    frame: frame - 15,
    fps,
    config: { damping: 14, stiffness: 80 },
  })
  const titleOpacity = interpolate(frame, [15, 35], [0, 1], {
    extrapolateRight: 'clamp',
  })

  // Description scroll in
  const descOpacity = interpolate(frame, [40, 65], [0, 1], {
    extrapolateRight: 'clamp',
  })
  const descTranslateY = interpolate(frame, [40, 65], [30, 0], {
    extrapolateRight: 'clamp',
  })

  // Gradient divider animation
  const dividerHeight = interpolate(frame, [30, 60], [0, 1], {
    extrapolateRight: 'clamp',
  })

  // "What would you do?" text
  const whatOpacity = interpolate(frame, [300, 330], [0, 1], {
    extrapolateRight: 'clamp',
  })
  const questionPulse = interpolate(
    frame % 60,
    [0, 30, 60],
    [1, 1.05, 1]
  )

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: 'linear-gradient(160deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
        display: 'flex',
        flexDirection: 'row',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Left side: situation text */}
      <div
        style={{
          width: '55%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px 60px 80px 100px',
          gap: 32,
        }}
      >
        {/* SCENARIO badge */}
        <div
          style={{
            opacity: badgeOpacity,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            background: '#7c3aed22',
            border: '2px solid #7c3aed55',
            borderRadius: 8,
            padding: '8px 20px',
            alignSelf: 'flex-start',
          }}
        >
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="#a78bfa"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <path d="M12 17h.01" />
          </svg>
          <span
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: '#a78bfa',
              letterSpacing: 3,
              textTransform: 'uppercase',
            }}
          >
            Scenario
          </span>
        </div>

        {/* Title */}
        <div
          style={{
            opacity: titleOpacity,
            transform: `translateX(${interpolate(titleSpring, [0, 1], [-40, 0])}px)`,
            fontSize: 48,
            fontWeight: 800,
            color: '#f8fafc',
            lineHeight: 1.25,
          }}
        >
          {title}
        </div>

        {/* Description */}
        <div
          style={{
            opacity: descOpacity,
            transform: `translateY(${descTranslateY}px)`,
            fontSize: 26,
            color: '#94a3b8',
            lineHeight: 1.6,
          }}
        >
          {description}
        </div>
      </div>

      {/* Gradient divider */}
      <div
        style={{
          width: 3,
          height: `${dividerHeight * 100}%`,
          background: 'linear-gradient(180deg, transparent, #7c3aed, transparent)',
          alignSelf: 'center',
        }}
      />

      {/* Right side: silhouette + choices */}
      <div
        style={{
          width: '45%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px 100px 80px 60px',
          position: 'relative',
        }}
      >
        {/* Character silhouette placeholder */}
        <div
          style={{
            position: 'absolute',
            top: 60,
            right: 60,
            width: 180,
            height: 240,
            borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
            background: 'linear-gradient(180deg, #334155, #1e293b)',
            opacity: interpolate(frame, [20, 50], [0, 0.3], { extrapolateRight: 'clamp' }),
          }}
        />

        {/* Choice options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, zIndex: 1 }}>
          {choices.map((choice, i) => {
            const choiceDelay = 120 + i * 60
            const choiceSpring = spring({
              frame: frame - choiceDelay,
              fps,
              config: { damping: 14, stiffness: 100 },
            })
            const choiceOpacity = interpolate(
              frame,
              [choiceDelay, choiceDelay + 20],
              [0, 1],
              { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
            )

            return (
              <div
                key={i}
                style={{
                  opacity: choiceOpacity,
                  transform: `translateX(${interpolate(choiceSpring, [0, 1], [40, 0])}px)`,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 16,
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: 12,
                  padding: '16px 24px',
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: '#7c3aed22',
                    border: '1px solid #7c3aed44',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                    fontWeight: 700,
                    color: '#a78bfa',
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
                </div>
                <div
                  style={{
                    fontSize: 22,
                    color: '#e2e8f0',
                    fontWeight: 500,
                    lineHeight: 1.4,
                  }}
                >
                  {choice}
                </div>
              </div>
            )
          })}
        </div>

        {/* "What would you do?" */}
        <div
          style={{
            marginTop: 48,
            opacity: whatOpacity,
            transform: `scale(${questionPulse})`,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: 36,
              fontWeight: 800,
              color: '#a78bfa',
              letterSpacing: 1,
            }}
          >
            What would you do?
          </div>
          <svg
            viewBox="0 0 24 24"
            width="48"
            height="48"
            fill="none"
            stroke="#7c3aed"
            strokeWidth="2"
            style={{
              marginTop: 16,
              opacity: interpolate(frame % 40, [0, 20, 40], [0.4, 1, 0.4]),
            }}
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <path d="M12 17h.01" />
          </svg>
        </div>
      </div>
    </div>
  )
}
