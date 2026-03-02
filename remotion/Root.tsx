import { Composition } from 'remotion'
import { LessonVideo, type LessonVideoProps } from './compositions/LessonVideo'

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="LessonVideo"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        component={LessonVideo as any}
        durationInFrames={5400}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          lessonTitle: 'Sample Lesson',
          moduleTitle: 'Sample Module',
          courseTitle: 'CMCA Prep',
          credentialCode: 'CMCA',
          keyPoints: ['Point 1', 'Point 2', 'Point 3'],
          texasLawCallout: null,
          scenarioTitle: null,
          brandColor: '#0ea5e9',
        }}
      />
    </>
  )
}
