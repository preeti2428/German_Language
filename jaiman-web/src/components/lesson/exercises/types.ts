import type { Exercise } from '@/lib/lesson/normalize';

export interface ExerciseProps {
  ex: Exercise;
  /** True once the learner has committed an answer for this exercise. */
  disabled: boolean;
  onAnswer: (correct: boolean, given: string) => void;
}

export type { Exercise };
