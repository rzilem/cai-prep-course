import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion'

interface KeyPointSlideProps {
  point: string
  index: number
  total: number
  brandColor: string
}

export const KeyPointSlide: React.FC<KeyPointSlideProps> = ({
  point,
  index,
  total,
  brandColor,
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // Number badge animation
  const badgeScale = spring({
    frame: frame - 10,
    fps,
    config: { damping: 12, stiffness: 120, mass: 0.6 },
  })

  const badgeOpacity = interpolate(frame, [5, 20], [0, 1], {
    extrapolateRight: 'clamp',
  })

  // Word-by-word reveal
  const words = point.split(' ')
  const wordStartFrame = 30
  const framesPerWord = 6

  // Icon placeholder animation
  const iconOpacity = interpolate(frame, [0, 25], [0, 0.15], {
    extrapolateRight: 'clamp',
  })

  // Background subtle pulse
  const bgPulse = interpolate(
    frame % 120,
    [0, 60, 120],
    [0, 0.03, 0],
    { extrapolateRight: 'clamp' }
  )

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: `linear-gradient(160deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)`,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Subtle background pattern */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.04 + bgPulse,
          backgroundImage: `
            radial-gradient(circle at 20% 50%, ${brandColor}40 0%, transparent 50%),
            radial-gradient(circle at 80% 50%, ${brandColor}20 0%, transparent 50%)
          `,
        }}
      />

      {/* Left side: icon placeholder area */}
      <div
        style={{
          width: '35%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {/* Large abstract shape */}
        <div
          style={{
            width: 320,
            height: 320,
            borderRadius: '30%',
            background: `linear-gradient(135deg, ${brandColor}25, ${brandColor}08)`,
            border: `2px solid ${brandColor}30`,
            opacity: iconOpacity * 6,
            transform: `rotate(${interpolate(frame, [0, 900], [0, 15])}deg)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Inner shape */}
          <div
            style={{
              width: 160,
              height: 160,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${brandColor}30, transparent)`,
              border: `1px solid ${brandColor}20`,
            }}
          />
        </div>

        {/* Floating dots */}
        {[...Array(5)].map((_, i) => {
          const dotY = interpolate(
            (frame + i * 40) % 200,
            [0, 100, 200],
            [0, -30, 0]
          )
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: brandColor,
                opacity: 0.3,
                left: `${20 + i * 15}%`,
                top: `${30 + i * 10}%`,
                transform: `translateY(${dotY}px)`,
              }}
            />
          )
        })}
      </div>

      {/* Right side: content */}
      <div
        style={{
          width: '65%',
          paddingRight: 120,
          display: 'flex',
          flexDirection: 'column',
          gap: 40,
        }}
      >
        {/* Number badge */}
        <div
          style={{
            opacity: badgeOpacity,
            transform: `scale(${badgeScale})`,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${brandColor}, ${brandColor}cc)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              fontWeight: 800,
              color: '#fff',
              boxShadow: `0 4px 24px ${brandColor}44`,
            }}
          >
            {String(index + 1).padStart(2, '0')}
          </div>
          <div
            style={{
              fontSize: 20,
              color: '#64748b',
              fontWeight: 500,
            }}
          >
            of {String(total).padStart(2, '0')}
          </div>
        </div>

        {/* Key point text with word-by-word reveal */}
        <div
          style={{
            fontSize: 48,
            fontWeight: 700,
            color: '#f8fafc',
            lineHeight: 1.4,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          {words.map((word, i) => {
            const wordFrame = wordStartFrame + i * framesPerWord
            const wordOpacity = interpolate(frame, [wordFrame, wordFrame + 8], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            })
            const wordTranslateY = interpolate(
              frame,
              [wordFrame, wordFrame + 8],
              [12, 0],
              {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }
            )

            return (
              <span
                key={i}
                style={{
                  opacity: wordOpacity,
                  transform: `translateY(${wordTranslateY}px)`,
                  display: 'inline-block',
                }}
              >
                {word}
              </span>
            )
          })}
        </div>

        {/* Accent line */}
        <div
          style={{
            width: interpolate(frame, [20, 60], [0, 120], { extrapolateRight: 'clamp' }),
            height: 4,
            background: brandColor,
            borderRadius: 2,
          }}
        />
      </div>

      {/* Progress dots at bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: 60,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 16,
        }}
      >
        {[...Array(total)].map((_, i) => {
          const isActive = i === index
          const dotScale = isActive
            ? spring({
                frame: frame - 5,
                fps,
                config: { damping: 15, stiffness: 150 },
              })
            : 1

          return (
            <div
              key={i}
              style={{
                width: isActive ? 32 : 12,
                height: 12,
                borderRadius: 6,
                background: isActive ? brandColor : '#334155',
                transform: `scale(${dotScale})`,
                transition: 'width 0.3s',
                boxShadow: isActive ? `0 0 12px ${brandColor}66` : 'none',
              }}
            />
          )
        })}
      </div>
    </div>
  )
}
