import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion'

interface TexasLawCalloutProps {
  statute: string
  title: string
  description: string
}

// Simple Texas outline path (stylized silhouette)
const TEXAS_PATH =
  'M 80 10 L 120 10 L 130 30 L 150 25 L 170 35 L 185 30 L 200 45 L 195 65 L 210 80 L 220 100 L 215 120 L 225 140 L 220 160 L 200 170 L 190 190 L 175 200 L 165 220 L 150 230 L 130 225 L 120 240 L 100 250 L 85 240 L 70 245 L 55 235 L 40 220 L 30 200 L 35 180 L 25 160 L 30 140 L 20 120 L 30 100 L 25 80 L 40 60 L 50 40 L 65 25 Z'

export const TexasLawCallout: React.FC<TexasLawCalloutProps> = ({
  statute,
  title,
  description,
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const burntOrange = '#bf5700'

  // Texas outline fade in
  const texasOpacity = interpolate(frame, [0, 40], [0, 0.15], {
    extrapolateRight: 'clamp',
  })
  const texasScale = spring({
    frame,
    fps,
    config: { damping: 20, stiffness: 60, mass: 1.2 },
  })

  // Statute badge slide in
  const statuteSlide = spring({
    frame: frame - 20,
    fps,
    config: { damping: 14, stiffness: 100 },
  })
  const statuteOpacity = interpolate(frame, [20, 40], [0, 1], {
    extrapolateRight: 'clamp',
  })

  // Title fade in
  const titleOpacity = interpolate(frame, [40, 60], [0, 1], {
    extrapolateRight: 'clamp',
  })
  const titleTranslateY = interpolate(frame, [40, 60], [20, 0], {
    extrapolateRight: 'clamp',
  })

  // Description word-by-word
  const descWords = description.split(' ')
  const descStartFrame = 80
  const framesPerWord = 4

  // Corner stars
  const starOpacity = interpolate(frame, [60, 90], [0, 0.6], {
    extrapolateRight: 'clamp',
  })
  const starRotate = interpolate(frame, [0, 450], [0, 360])

  // Parchment texture overlay
  const parchmentOpacity = interpolate(frame, [0, 30], [0, 0.06], {
    extrapolateRight: 'clamp',
  })

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: 'linear-gradient(160deg, #1a0f00 0%, #0f172a 40%, #1a0f00 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Parchment texture overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: parchmentOpacity,
          background: `
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(191, 87, 0, 0.05) 2px,
              rgba(191, 87, 0, 0.05) 4px
            )
          `,
        }}
      />

      {/* Texas state outline (background) */}
      <svg
        viewBox="0 0 250 260"
        style={{
          position: 'absolute',
          right: 80,
          top: '50%',
          transform: `translateY(-50%) scale(${texasScale * 2.5})`,
          opacity: texasOpacity,
          width: 500,
          height: 520,
        }}
      >
        <path
          d={TEXAS_PATH}
          fill="none"
          stroke={burntOrange}
          strokeWidth="2"
        />
        <path
          d={TEXAS_PATH}
          fill={burntOrange}
          opacity="0.1"
        />
      </svg>

      {/* Corner stars */}
      {[
        { top: 40, left: 40 },
        { top: 40, right: 40 },
        { bottom: 40, left: 40 },
        { bottom: 40, right: 40 },
      ].map((pos, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          style={{
            position: 'absolute',
            ...pos,
            width: 32,
            height: 32,
            opacity: starOpacity,
            transform: `rotate(${starRotate + i * 90}deg)`,
          } as React.CSSProperties}
        >
          <path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z"
            fill={burntOrange}
          />
        </svg>
      ))}

      {/* Main content */}
      <div
        style={{
          maxWidth: 1000,
          display: 'flex',
          flexDirection: 'column',
          gap: 32,
          zIndex: 1,
          paddingLeft: 120,
        }}
      >
        {/* Statute badge */}
        <div
          style={{
            opacity: statuteOpacity,
            transform: `translateX(${interpolate(statuteSlide, [0, 1], [-60, 0])}px)`,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            background: `${burntOrange}20`,
            border: `2px solid ${burntOrange}60`,
            borderRadius: 12,
            padding: '12px 24px',
            alignSelf: 'flex-start',
          }}
        >
          {/* Gavel icon */}
          <svg
            viewBox="0 0 24 24"
            width="28"
            height="28"
            fill="none"
            stroke={burntOrange}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14.5 2.5L5.5 11.5" />
            <path d="M11.5 5.5L16.5 10.5" />
            <path d="M2 22L12 12" />
            <rect x="16" y="2" width="6" height="6" rx="1" transform="rotate(45 19 5)" />
          </svg>
          <span
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: burntOrange,
              fontStyle: 'italic',
            }}
          >
            {statute}
          </span>
        </div>

        {/* Title */}
        <div
          style={{
            opacity: titleOpacity,
            transform: `translateY(${titleTranslateY}px)`,
            fontSize: 56,
            fontWeight: 800,
            color: '#f8fafc',
            lineHeight: 1.2,
          }}
        >
          {title}
        </div>

        {/* Burnt orange divider */}
        <div
          style={{
            width: interpolate(frame, [50, 80], [0, 160], { extrapolateRight: 'clamp' }),
            height: 4,
            background: `linear-gradient(90deg, ${burntOrange}, transparent)`,
            borderRadius: 2,
          }}
        />

        {/* Description with word-by-word reveal */}
        <div
          style={{
            fontSize: 32,
            color: '#cbd5e1',
            lineHeight: 1.6,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          {descWords.map((word, i) => {
            const wordFrame = descStartFrame + i * framesPerWord
            const wordOpacity = interpolate(frame, [wordFrame, wordFrame + 6], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            })

            return (
              <span
                key={i}
                style={{
                  opacity: wordOpacity,
                  display: 'inline-block',
                }}
              >
                {word}
              </span>
            )
          })}
        </div>
      </div>

      {/* "TEXAS LAW" label */}
      <div
        style={{
          position: 'absolute',
          top: 60,
          left: '50%',
          transform: 'translateX(-50%)',
          opacity: interpolate(frame, [10, 30], [0, 1], { extrapolateRight: 'clamp' }),
          fontSize: 18,
          fontWeight: 700,
          color: burntOrange,
          letterSpacing: 6,
          textTransform: 'uppercase',
        }}
      >
        Texas Law Spotlight
      </div>
    </div>
  )
}
