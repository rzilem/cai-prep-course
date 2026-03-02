import { Series, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion'
import { LessonIntro } from '../components/LessonIntro'
import { KeyPointSlide } from '../components/KeyPointSlide'
import { TexasLawCallout } from '../components/TexasLawCallout'
import { ScenarioScene } from '../components/ScenarioScene'
import { QuizTransition } from '../components/QuizTransition'
import { LessonOutro } from '../components/LessonOutro'
import { ProgressBar } from '../components/ProgressBar'

export interface TexasLaw {
  statute: string
  title: string
  description: string
}

export interface LessonVideoProps {
  lessonTitle: string
  moduleTitle: string
  courseTitle: string
  credentialCode: string
  keyPoints: string[]
  texasLawCallout: TexasLaw | null
  scenarioTitle: string | null
  brandColor: string
}

export const LessonVideo: React.FC<LessonVideoProps> = ({
  lessonTitle,
  moduleTitle,
  courseTitle,
  credentialCode,
  keyPoints,
  texasLawCallout,
  scenarioTitle,
  brandColor,
}) => {
  // Calculate total frames for progress bar
  const introFrames = 150
  const keyPointFrames = keyPoints.length * 900
  const texasLawFrames = texasLawCallout ? 450 : 0
  const scenarioFrames = scenarioTitle ? 900 : 0
  const summaryFrames = 600
  const quizFrames = 150
  const outroFrames = 150
  const totalFrames =
    introFrames +
    keyPointFrames +
    texasLawFrames +
    scenarioFrames +
    summaryFrames +
    quizFrames +
    outroFrames

  // Build scene labels for progress bar
  const scenes: { label: string; startFrame: number; endFrame: number }[] = []
  let cursor = 0

  scenes.push({ label: 'Intro', startFrame: cursor, endFrame: cursor + introFrames })
  cursor += introFrames

  keyPoints.forEach((_, i) => {
    scenes.push({
      label: `Key Point ${i + 1}`,
      startFrame: cursor,
      endFrame: cursor + 900,
    })
    cursor += 900
  })

  if (texasLawCallout) {
    scenes.push({ label: 'Texas Law', startFrame: cursor, endFrame: cursor + 450 })
    cursor += 450
  }

  if (scenarioTitle) {
    scenes.push({ label: 'Scenario', startFrame: cursor, endFrame: cursor + 900 })
    cursor += 900
  }

  scenes.push({ label: 'Summary', startFrame: cursor, endFrame: cursor + summaryFrames })
  cursor += summaryFrames

  scenes.push({ label: 'Quiz Time', startFrame: cursor, endFrame: cursor + quizFrames })
  cursor += quizFrames

  scenes.push({ label: 'Outro', startFrame: cursor, endFrame: cursor + outroFrames })

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Series>
        {/* Intro */}
        <Series.Sequence durationInFrames={introFrames}>
          <LessonIntro
            lessonTitle={lessonTitle}
            moduleTitle={moduleTitle}
            courseTitle={courseTitle}
            credentialCode={credentialCode}
            brandColor={brandColor}
          />
        </Series.Sequence>

        {/* Key Points */}
        {keyPoints.map((point, index) => (
          <Series.Sequence key={`kp-${index}`} durationInFrames={900}>
            <KeyPointSlide
              point={point}
              index={index}
              total={keyPoints.length}
              brandColor={brandColor}
            />
          </Series.Sequence>
        ))}

        {/* Texas Law Callout (conditional) */}
        {texasLawCallout && (
          <Series.Sequence durationInFrames={450}>
            <TexasLawCallout
              statute={texasLawCallout.statute}
              title={texasLawCallout.title}
              description={texasLawCallout.description}
            />
          </Series.Sequence>
        )}

        {/* Scenario (conditional) */}
        {scenarioTitle && (
          <Series.Sequence durationInFrames={900}>
            <ScenarioScene
              title={scenarioTitle}
              description="Consider this real-world scenario and choose the best course of action."
              choices={[
                'Option A: Follow standard procedure',
                'Option B: Consult the board first',
                'Option C: Refer to governing documents',
                'Option D: Seek legal counsel',
              ]}
            />
          </Series.Sequence>
        )}

        {/* Summary */}
        <Series.Sequence durationInFrames={summaryFrames}>
          <SummaryScene
            lessonTitle={lessonTitle}
            keyPoints={keyPoints}
            brandColor={brandColor}
          />
        </Series.Sequence>

        {/* Quiz Teaser */}
        <Series.Sequence durationInFrames={quizFrames}>
          <QuizTransition questionCount={keyPoints.length + 2} />
        </Series.Sequence>

        {/* Outro */}
        <Series.Sequence durationInFrames={outroFrames}>
          <LessonOutro
            lessonTitle={lessonTitle}
            xpEarned={100}
            nextLessonTitle="Next Lesson"
          />
        </Series.Sequence>
      </Series>

      {/* Persistent progress bar overlay */}
      <ProgressBar
        scenes={scenes}
        totalFrames={totalFrames}
        moduleTitle={moduleTitle}
        lessonTitle={lessonTitle}
        brandColor={brandColor}
      />
    </div>
  )
}

// Internal summary scene component
const SummaryScene: React.FC<{
  lessonTitle: string
  keyPoints: string[]
  brandColor: string
}> = ({ lessonTitle, keyPoints, brandColor }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const titleOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: 'clamp',
  })

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: `linear-gradient(135deg, #0f172a 0%, #1e293b 50%, ${brandColor}22 100%)`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 80,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Header */}
      <div
        style={{
          opacity: titleOpacity,
          fontSize: 32,
          color: brandColor,
          fontWeight: 600,
          letterSpacing: 4,
          textTransform: 'uppercase',
          marginBottom: 20,
        }}
      >
        Lesson Summary
      </div>

      <div
        style={{
          opacity: titleOpacity,
          fontSize: 48,
          color: '#f8fafc',
          fontWeight: 700,
          marginBottom: 60,
          textAlign: 'center',
        }}
      >
        {lessonTitle}
      </div>

      {/* Key Points recap */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1200 }}>
        {keyPoints.map((point, i) => {
          const delay = 60 + i * 40
          const pointSpring = spring({
            frame: frame - delay,
            fps,
            config: { damping: 15, mass: 0.8 },
          })
          const pointOpacity = interpolate(frame, [delay, delay + 20], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          })

          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 24,
                opacity: pointOpacity,
                transform: `translateX(${interpolate(pointSpring, [0, 1], [-40, 0])}px)`,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: brandColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                  fontWeight: 700,
                  color: '#fff',
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </div>
              <div style={{ fontSize: 28, color: '#e2e8f0', fontWeight: 500 }}>{point}</div>
            </div>
          )
        })}
      </div>

      {/* Checkmark */}
      <div
        style={{
          marginTop: 60,
          opacity: interpolate(frame, [300, 340], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
          fontSize: 28,
          color: '#4ade80',
          fontWeight: 600,
        }}
      >
        Key concepts covered
      </div>
    </div>
  )
}
