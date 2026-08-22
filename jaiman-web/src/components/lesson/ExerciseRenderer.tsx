'use client';

import type { Exercise } from '@/lib/lesson/normalize';
import AudioButton from './exercises/AudioButton';
import ChoiceGrid from './exercises/ChoiceGrid';
import Dictation from './exercises/Dictation';
import ErrorSpot from './exercises/ErrorSpot';
import FillBlank from './exercises/FillBlank';
import FreeWrite from './exercises/FreeWrite';
import GenderPick from './exercises/GenderPick';
import MatchPairs from './exercises/MatchPairs';
import SpeakCard from './exercises/SpeakCard';
import WordBank from './exercises/WordBank';

/** Routes a normalized exercise to its renderer. One place, ten kinds. */
export default function ExerciseRenderer({
  ex,
  disabled,
  onAnswer,
}: {
  ex: Exercise;
  disabled: boolean;
  onAnswer: (correct: boolean, given: string) => void;
}) {
  const props = { ex, disabled, onAnswer };

  switch (ex.kind) {
    case 'match':
      return <MatchPairs {...props} />;
    case 'wordbank':
      return <WordBank {...props} />;
    case 'fill_blank':
      return <FillBlank {...props} />;
    case 'gender':
      return <GenderPick {...props} />;
    case 'dictation':
      return <Dictation {...props} />;
    case 'error_spot':
      return <ErrorSpot {...props} />;
    case 'speak':
      return <SpeakCard {...props} />;
    case 'free_write':
      return <FreeWrite {...props} />;
    case 'listen_choice':
      return (
        <div className="w-full space-y-8">
          <AudioButton url={ex.audioUrl} text={ex.target || ex.answer} />
          <ChoiceGrid {...props} />
        </div>
      );
    case 'choice':
    default:
      return <ChoiceGrid {...props} />;
  }
}
