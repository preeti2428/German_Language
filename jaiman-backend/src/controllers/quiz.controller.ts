import { Request, Response } from 'express';
import Stage from '../models/Stage';
import User from '../models/User';

/**
 * Quiz endpoints:
 *  GET  /api/quiz/level-test              → 30 adaptive placement questions
 *  POST /api/quiz/level-test/submit       → grade + update user.level
 *  GET  /api/quiz/listening?tier=A1       → listening exercises for the lab
 */

// ── Level Test ──────────────────────────────────────────────────────────────

/**
 * Built-in placement questions — 30 total, 8 per tier (A1/A2/B1/B2) with a
 * few B2 thrown in. No DB needed; questions are authored here so there's
 * always content even before stages are seeded.
 */
const LEVEL_QUESTIONS = [
  // ─── A1 (Q1-8) ───────────────────────────────────────────────────────────
  {
    id: 1, tier: 'A1', skillType: 'vocab',
    question: 'Was bedeutet "Hallo"?',
    questionEn: 'What does "Hallo" mean in English?',
    options: ['Goodbye', 'Hello', 'Thank you', 'Please'],
    correct: 'Hello', points: 1,
    explanation: '"Hallo" is the standard German greeting for "Hello".',
  },
  {
    id: 2, tier: 'A1', skillType: 'vocab',
    question: 'Wie sagt man "apple" auf Deutsch?',
    questionEn: 'How do you say "apple" in German?',
    options: ['Birne', 'Apfel', 'Orange', 'Banane'],
    correct: 'Apfel', points: 1,
    explanation: '"Der Apfel" means apple. (Birne = pear, Banane = banana).',
  },
  {
    id: 3, tier: 'A1', skillType: 'grammar',
    question: 'Welches Wort fehlt? "___ bin Student."',
    questionEn: 'Which pronoun is missing? "___ am a student."',
    options: ['Er', 'Sie', 'Ich', 'Wir'],
    correct: 'Ich', points: 1,
    explanation: 'The verb "bin" (sein) is conjugated for the 1st person singular: "Ich bin".',
  },
  {
    id: 4, tier: 'A1', skillType: 'vocab',
    question: 'Was ist "drei" auf Englisch?',
    questionEn: 'What number is "drei" in English?',
    options: ['Two', 'Four', 'Three', 'Five'],
    correct: 'Three', points: 1,
    explanation: 'eins = 1, zwei = 2, drei = 3, vier = 4, fünf = 5.',
  },
  {
    id: 5, tier: 'A1', skillType: 'grammar',
    question: 'Welcher Artikel gehört zu "Buch"?',
    questionEn: 'Which definite article belongs to "Buch" (book)?',
    options: ['der', 'die', 'das', 'ein'],
    correct: 'das', points: 1,
    explanation: '"Das Buch" is a neuter noun in German (das).',
  },
  {
    id: 6, tier: 'A1', skillType: 'vocab',
    question: 'Was bedeutet "Danke"?',
    questionEn: 'What does "Danke" mean in English?',
    options: ['Please', 'Sorry', 'Thank you', 'Hello'],
    correct: 'Thank you', points: 1,
    explanation: '"Danke" means "Thank you" ("Bitte" means please/you are welcome).',
  },
  {
    id: 7, tier: 'A1', skillType: 'grammar',
    question: 'Wähle das richtige Verb: "Sie ___ aus Berlin."',
    questionEn: 'Choose the correct verb: "She ___ from Berlin."',
    options: ['bin', 'ist', 'kommt', 'heißt'],
    correct: 'kommt', points: 1,
    explanation: '"Sie kommt aus Berlin" (She comes from Berlin) uses the preposition "aus".',
  },
  {
    id: 8, tier: 'A1', skillType: 'vocab',
    question: 'Was bedeutet "Montag"?',
    questionEn: 'What day of the week is "Montag"?',
    options: ['Sunday', 'Monday', 'Tuesday', 'Friday'],
    correct: 'Monday', points: 1,
    explanation: 'Montag = Monday, Dienstag = Tuesday, Mittwoch = Wednesday, Sonntag = Sunday.',
  },
  // ─── A2 (Q9-16) ──────────────────────────────────────────────────────────
  {
    id: 9, tier: 'A2', skillType: 'grammar',
    question: 'Welche Form ist richtig? "Ich ___ gestern ins Kino gegangen."',
    questionEn: 'Which auxiliary verb is correct? "I ___ to the cinema yesterday."',
    options: ['habe', 'bin', 'war', 'hatte'],
    correct: 'bin', points: 2,
    explanation: 'Verbs of movement (gehen) form Perfekt with "sein": "Ich bin gegangen".',
  },
  {
    id: 10, tier: 'A2', skillType: 'vocab',
    question: 'Was bedeutet "Krankenhaus"?',
    questionEn: 'What does "Krankenhaus" mean in English?',
    options: ['School', 'Hospital', 'Station', 'Market'],
    correct: 'Hospital', points: 2,
    explanation: '"Das Krankenhaus" means hospital (Krank = sick, Haus = house).',
  },
  {
    id: 11, tier: 'A2', skillType: 'grammar',
    question: 'Wähle den richtigen Akkusativ: "Ich sehe ___ Mann."',
    questionEn: 'Choose the correct accusative article: "I see ___ man."',
    options: ['der', 'den', 'dem', 'des'],
    correct: 'den', points: 2,
    explanation: 'In the accusative case, the masculine article "der" changes to "den".',
  },
  {
    id: 12, tier: 'A2', skillType: 'grammar',
    question: 'Welches Wort passt? "Das Buch ist ___ interessant ___ das andere."',
    questionEn: 'Which comparison structure fits? "The book is ___ interesting ___ the other."',
    options: ['so ... wie', 'mehr ... als', 'besser ... wie', 'genauso ... wie'],
    correct: 'so ... wie', points: 2,
    explanation: 'Equal comparisons use "so + Adjektiv + wie" (as ... as).',
  },
  {
    id: 13, tier: 'A2', skillType: 'vocab',
    question: 'Was bedeutet "übermorgen"?',
    questionEn: 'What time expression is "übermorgen"?',
    options: ['Yesterday', 'Tomorrow', 'The day after tomorrow', 'Next week'],
    correct: 'The day after tomorrow', points: 2,
    explanation: 'gestern = yesterday, morgen = tomorrow, übermorgen = the day after tomorrow.',
  },
  {
    id: 14, tier: 'A2', skillType: 'grammar',
    question: 'Welche Präposition passt? "Ich fahre ___ Berlin."',
    questionEn: 'Which preposition is used for traveling to cities/countries without articles? "I travel ___ Berlin."',
    options: ['zu', 'nach', 'an', 'auf'],
    correct: 'nach', points: 2,
    explanation: 'For geographical destinations (cities, countries without article), use "nach".',
  },
  {
    id: 15, tier: 'A2', skillType: 'vocab',
    question: 'Was ist ein Synonym für "groß"?',
    questionEn: 'What is a synonym for "groß" (big / large)?',
    options: ['klein', 'riesig', 'schnell', 'warm'],
    correct: 'riesig', points: 2,
    explanation: '"Riesig" means huge/giant, which is a synonym for large ("groß").',
  },
  {
    id: 16, tier: 'A2', skillType: 'grammar',
    question: 'Bilde Perfekt: "Er ___ das Buch gelesen."',
    questionEn: 'Complete the past tense: "He ___ read the book."',
    options: ['hat', 'ist', 'wird', 'war'],
    correct: 'hat', points: 2,
    explanation: '"Lesen" is a transitive verb and takes the auxiliary verb "haben": "Er hat gelesen".',
  },
  // ─── B1 (Q17-24) ─────────────────────────────────────────────────────────
  {
    id: 17, tier: 'B1', skillType: 'grammar',
    question: 'Wähle die richtige Konjunktion: "___ er krank war, ging er zur Arbeit."',
    questionEn: 'Choose the concessive connector: "___ he was sick, he went to work."',
    options: ['Weil', 'Obwohl', 'Damit', 'Wenn'],
    correct: 'Obwohl', points: 3,
    explanation: '"Obwohl" (although) introduces a concessive clause with the verb at the end.',
  },
  {
    id: 18, tier: 'B1', skillType: 'grammar',
    question: 'Was ist der Genitiv von "der Mann"?',
    questionEn: 'What is the genitive (possessive) form of "der Mann"?',
    options: ['den Mann', 'dem Mann', 'des Mannes', 'der Mann'],
    correct: 'des Mannes', points: 3,
    explanation: 'Masculine nouns in the genitive take "des" and add "-es" or "-s" (des Mannes).',
  },
  {
    id: 19, tier: 'B1', skillType: 'vocab',
    question: 'Was bedeutet "die Ausbildung"?',
    questionEn: 'What does "die Ausbildung" mean in English?',
    options: ['Exhibition', 'Vocational training', 'Exception', 'Expression'],
    correct: 'Vocational training', points: 3,
    explanation: '"Die Ausbildung" refers to vocational education/apprenticeship training in Germany.',
  },
  {
    id: 20, tier: 'B1', skillType: 'grammar',
    question: 'Wandle in Passiv um: "Man baut das Haus."',
    questionEn: 'Convert to passive voice: "They are building the house."',
    options: [
      'Das Haus wird gebaut.',
      'Das Haus ist gebaut.',
      'Das Haus wurde gebaut.',
      'Das Haus baut man.',
    ],
    correct: 'Das Haus wird gebaut.', points: 3,
    explanation: 'Vorgangspassiv in Präsens: "werden + Partizip II" → "Das Haus wird gebaut".',
  },
  {
    id: 21, tier: 'B1', skillType: 'grammar',
    question: 'Welche Form ist korrekt? "Ich würde gerne kommen, ___ ich Zeit hätte."',
    questionEn: 'Which conditional connector fits? "I would love to come ___ I had time."',
    options: ['wenn', 'ob', 'dass', 'weil'],
    correct: 'wenn', points: 3,
    explanation: '"Wenn" is used for conditional clauses with Konjunktiv II (hätte).',
  },
  {
    id: 22, tier: 'B1', skillType: 'vocab',
    question: 'Was bedeutet "gleichzeitig"?',
    questionEn: 'What does the adverb "gleichzeitig" mean?',
    options: ['Equally', 'Simultaneously', 'Slowly', 'Differently'],
    correct: 'Simultaneously', points: 3,
    explanation: '"Gleichzeitig" means at the same time / simultaneously.',
  },
  {
    id: 23, tier: 'B1', skillType: 'grammar',
    question: 'Wähle das richtige Relativpronomen: "Das ist das Auto, ___ ich kaufen möchte."',
    questionEn: 'Choose the relative pronoun: "That is the car ___ I want to buy."',
    options: ['der', 'die', 'das', 'den'],
    correct: 'das', points: 3,
    explanation: '"Das Auto" is neuter; in the accusative relative clause it remains "das".',
  },
  {
    id: 24, tier: 'B1', skillType: 'vocab',
    question: 'Was ist ein Antonym von "zunehmen"?',
    questionEn: 'What is the opposite (antonym) of "zunehmen" (to increase / gain weight)?',
    options: ['steigen', 'abnehmen', 'wachsen', 'verbessern'],
    correct: 'abnehmen', points: 3,
    explanation: '"Zunehmen" = to increase / gain weight; "Abnehmen" = to decrease / lose weight.',
  },
  // ─── B2 (Q25-30) ─────────────────────────────────────────────────────────
  {
    id: 25, tier: 'B2', skillType: 'grammar',
    question: 'Welche Konstruktion ist ein erweitertes Partizipialattribut?',
    questionEn: 'Which construction is an extended participle modifier?',
    options: [
      'Das Buch, das geschrieben wurde, ist interessant.',
      'Das geschriebene Buch ist interessant.',
      'Das vor einem Jahr in Frankfurt geschriebene Buch ist interessant.',
      'Er hat das Buch interessant geschrieben.',
    ],
    correct: 'Das vor einem Jahr in Frankfurt geschriebene Buch ist interessant.', points: 4,
    explanation: 'An extended participle clause places adverbial phrases between article and participle.',
  },
  {
    id: 26, tier: 'B2', skillType: 'vocab',
    question: 'Was bedeutet "die Nachhaltigkeit"?',
    questionEn: 'What does the modern German term "die Nachhaltigkeit" mean?',
    options: ['Sustainability', 'Accountability', 'Reliability', 'Productivity'],
    correct: 'Sustainability', points: 4,
    explanation: '"Die Nachhaltigkeit" is the German term for ecological and economic sustainability.',
  },
  {
    id: 27, tier: 'B2', skillType: 'grammar',
    question: 'Ersetze durch Modalpartikel: "Wahrscheinlich ist er schon zu Hause."',
    questionEn: 'Express probability using a German modal particle: "He is probably already at home."',
    options: [
      'Er ist doch schon zu Hause.',
      'Er ist wohl schon zu Hause.',
      'Er ist ja schon zu Hause.',
      'Er ist mal schon zu Hause.',
    ],
    correct: 'Er ist wohl schon zu Hause.', points: 4,
    explanation: 'The modal particle "wohl" expresses probability and educated assumption.',
  },
  {
    id: 28, tier: 'B2', skillType: 'grammar',
    question: 'Welches Satzgefüge drückt eine Konzession aus?',
    questionEn: 'Which complex sentence expresses a concession (contrast against expectation)?',
    options: [
      'Er lernte, sodass er die Prüfung bestand.',
      'Er lernte, damit er bestehen würde.',
      'Er bestand die Prüfung, obwohl er kaum gelernt hatte.',
      'Er lernte, weil er bestehen wollte.',
    ],
    correct: 'Er bestand die Prüfung, obwohl er kaum gelernt hatte.', points: 4,
    explanation: '"Obwohl" expresses a concession (contrary to what was expected).',
  },
  {
    id: 29, tier: 'B2', skillType: 'vocab',
    question: 'Was bedeutet "beeinflussen"?',
    questionEn: 'What is the English meaning of the German verb "beeinflussen"?',
    options: ['To impress', 'To influence', 'To control', 'To increase'],
    correct: 'To influence', points: 4,
    explanation: '"Beeinflussen" means to influence or have an impact on someone/something.',
  },
  {
    id: 30, tier: 'B2', skillType: 'grammar',
    question: 'Welche Variante ist stilistisch am besten für eine formelle E-Mail?',
    questionEn: 'Which variant is stylistically most appropriate for a formal German email?',
    options: [
      'Ich schreibe Ihnen wegen dem Job.',
      'Ich wende mich bezüglich der ausgeschriebenen Stelle an Sie.',
      'Ich meld mich wegen dem Job.',
      'Ich schreibe wegen die Stelle.',
    ],
    correct: 'Ich wende mich bezüglich der ausgeschriebenen Stelle an Sie.', points: 4,
    explanation: '"Ich wende mich bezüglich + Genitiv an Sie" is high-register formal German.',
  },
];

/** Map score to CEFR level */
function scoreToLevel(score: number, max: number): string {
  const pct = (score / max) * 100;
  if (pct >= 85) return 'B2';
  if (pct >= 70) return 'B1';
  if (pct >= 50) return 'A2';
  return 'A1';
}

export const getLevelTest = async (req: Request, res: Response): Promise<void> => {
  try {
    const mode = (req.query.mode as string) || (req.query.count === '10' ? 'check' : 'placement');

    let selectedQuestions = LEVEL_QUESTIONS;

    if (mode === 'check' || req.query.count === '10') {
      // Pick 10 balanced questions (3 A1, 3 A2, 2 B1, 2 B2)
      const a1 = LEVEL_QUESTIONS.filter((q) => q.tier === 'A1').slice(0, 3);
      const a2 = LEVEL_QUESTIONS.filter((q) => q.tier === 'A2').slice(0, 3);
      const b1 = LEVEL_QUESTIONS.filter((q) => q.tier === 'B1').slice(0, 2);
      const b2 = LEVEL_QUESTIONS.filter((q) => q.tier === 'B2').slice(0, 2);
      selectedQuestions = [...a1, ...a2, ...b1, ...b2];
    }

    const questions = selectedQuestions.map((q) => ({
      id: q.id,
      tier: q.tier,
      skillType: q.skillType,
      question: q.question,
      questionEn: q.questionEn,
      options: q.options,
      correct: q.correct,
      explanation: q.explanation,
      points: q.points,
    }));

    res.json({
      mode: mode === 'check' ? 'check' : 'placement',
      questions,
      total: questions.length
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load level test.' });
  }
};

export const submitLevelTest = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?._id;
    const { answers, questionIds, mode } = req.body as {
      answers: Record<number, string>;
      questionIds?: number[];
      mode?: 'placement' | 'check';
    };

    if (!answers || typeof answers !== 'object') {
      res.status(400).json({ message: 'answers object required.' });
      return;
    }

    // Filter questions evaluated
    const activeQuestions = questionIds && questionIds.length > 0
      ? LEVEL_QUESTIONS.filter((q) => questionIds.includes(q.id))
      : Object.keys(answers).length <= 12
      ? LEVEL_QUESTIONS.filter((q) => answers[q.id] !== undefined)
      : LEVEL_QUESTIONS;

    let earned = 0;
    let maxScore = 0;
    const breakdown: { id: number; correct: boolean; tier: string }[] = [];

    for (const q of activeQuestions) {
      maxScore += q.points;
      const userAnswer = answers[q.id];
      const isCorrect = userAnswer?.trim() === q.correct;
      if (isCorrect) earned += q.points;
      breakdown.push({ id: q.id, correct: isCorrect, tier: q.tier });
    }

    if (maxScore === 0) maxScore = 1;
    const detectedLevel = scoreToLevel(earned, maxScore);
    const xpBonus = mode === 'check' ? 25 : 50;
    const todayStr = new Date().toISOString().split('T')[0];

    // Persist to user profile if authenticated
    if (userId) {
      const user = await User.findById(userId);
      if (user) {
        user.level = detectedLevel as any;
        user.hasCompletedPlacementTest = true;
        user.lastLevelCheckDate = todayStr;
        user.xp = (user.xp || 0) + xpBonus;
        user.totalQuestionsSolved = (user.totalQuestionsSolved || 0) + breakdown.length;
        await user.save();
      }
    }

    res.json({
      score: earned,
      maxScore,
      percentage: Math.round((earned / maxScore) * 100),
      detectedLevel,
      breakdown,
      xpEarned: xpBonus,
      mode: mode || (activeQuestions.length > 15 ? 'placement' : 'check')
    });
  } catch (err) {
    console.error('submitLevelTest error:', err);
    res.status(500).json({ message: 'Failed to grade level test.' });
  }
};

// ── Listening Lab ────────────────────────────────────────────────────────────

export const getListeningExercises = async (req: Request, res: Response): Promise<void> => {
  try {
    const tier = (req.query.tier as string) || 'A1';
    const validTiers = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    if (!validTiers.includes(tier)) {
      res.status(400).json({ message: `tier must be one of: ${validTiers.join(', ')}` });
      return;
    }

    // Pull listening sessions from existing Stage data
    const stages = await Stage.find({ tier: tier as any }).select('stageNumber theme cityName sessions vocabSet');
    const exercises: any[] = [];

    for (const stage of stages) {
      for (const session of stage.sessions) {
        if (session.skillType !== 'listening') continue;
        for (const ex of session.exercises) {
          const exObj = (ex as any).toObject?.() ?? ex;
          exercises.push({
            stageId: stage._id,
            stageNumber: stage.stageNumber,
            theme: stage.theme,
            cityName: stage.cityName,
            sessionTitle: session.title,
            ...exObj,
            promptEn:
              exObj.promptEn ||
              `Listen carefully to the German audio and select the correct option below.`,
            explanation:
              exObj.explanation ||
              `The correct answer is "${exObj.correctAnswer}".`,
          });
        }
      }
    }

    // If stages don't have enough listening content yet, supplement with
    // built-in vocab TTS exercises with bilingual prompts and explanations
    if (exercises.length < 5) {
      const allWords = stages.flatMap((s) => s.vocabSet || []);
      for (const stage of stages) {
        for (const word of stage.vocabSet || []) {
          const otherTranslations = allWords
            .filter((w) => w.word !== word.word)
            .map((w) => w.translation)
            .filter(Boolean);
          
          const uniqueOthers = Array.from(new Set(otherTranslations)).sort(() => Math.random() - 0.5);
          const distractors = uniqueOthers.slice(0, 3);
          const defaultFallbacks = ['morning', 'friend', 'water', 'city', 'book', 'goodbye', 'thank you', 'please'];
          for (const fb of defaultFallbacks) {
            if (distractors.length >= 3) break;
            if (fb !== word.translation && !distractors.includes(fb)) {
              distractors.push(fb);
            }
          }

          const options = [word.translation, ...distractors.slice(0, 3)].sort(() => Math.random() - 0.5);

          exercises.push({
            stageId: stage._id,
            theme: stage.theme,
            cityName: stage.cityName,
            type: 'listening_vocab',
            prompt: `Hör zu und wähle die richtige Übersetzung: "${word.word}"`,
            promptEn: `Listen to the German audio and choose the correct English translation of "${word.word}"`,
            audioText: word.word,
            options,
            correctAnswer: word.translation,
            explanation: `"${word.word}" translates to "${word.translation}" in English.`,
            points: 5,
          });
        }
      }
    }

    res.json({ tier, exercises: exercises.slice(0, 20), total: exercises.length });
  } catch (err) {
    console.error('getListeningExercises error:', err);
    res.status(500).json({ message: 'Failed to load listening exercises.' });
  }
};

// ── Speaking Lab ─────────────────────────────────────────────────────────────

import fs from 'fs';
import path from 'path';

export const getSpeakingExercises = async (req: Request, res: Response): Promise<void> => {
  try {
    const tier = (req.query.tier as string) || 'A1';
    const validTiers = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    if (!validTiers.includes(tier)) {
      res.status(400).json({ message: `tier must be one of: ${validTiers.join(', ')}` });
      return;
    }

    // Load exercises from JSON
    const dataPath = path.join(__dirname, '../data/speaking_exercises.json');
    let allExercises = [];
    if (fs.existsSync(dataPath)) {
      const fileData = fs.readFileSync(dataPath, 'utf8');
      const parsedData = JSON.parse(fileData);
      allExercises = parsedData.exercises || [];
    }

    // Filter by level
    const levelExercises = allExercises.filter((ex: any) => ex.level === tier);

    // Pull speaking sessions from existing Stage data
    const stages = await Stage.find({ tier: tier as any }).select('stageNumber theme cityName sessions vocabSet');
    const exercises: any[] = [];

    // Add JSON exercises first (shuffle and pick 10)
    const shuffledJsonExercises = levelExercises.sort(() => 0.5 - Math.random());
    const selectedJsonExercises = shuffledJsonExercises.slice(0, 10);
    
    for (const ex of selectedJsonExercises) {
      exercises.push({
        _id: ex.id,
        type: ex.type,
        icon: ex.icon,
        instruction: ex.instruction,
        prompt: ex.prompt_de,
        promptEn: ex.prompt_en,
        audioText: ex.prompt_de,
        correctAnswer: ex.prompt_de,
        explanation: ex.instruction,
        maxPoints: ex.max_points,
        scoring: ex.scoring,
        points: ex.max_points || 10
      });
    }

    // Then add from stages if needed
    for (const stage of stages) {
      for (const session of stage.sessions) {
        if (session.skillType !== 'speaking') continue;
        for (const ex of session.exercises) {
          const exObj = (ex as any).toObject?.() ?? ex;
          exercises.push({
            stageId: stage._id,
            stageNumber: stage.stageNumber,
            theme: stage.theme,
            cityName: stage.cityName,
            sessionTitle: session.title,
            ...exObj,
            promptEn:
              exObj.promptEn ||
              `Listen carefully and repeat the German sentence.`,
            explanation:
              exObj.explanation ||
              `Try to match the native pronunciation closely.`,
          });
        }
      }
    }

    // If still not enough, add vocab
    if (exercises.length === 0) {
      for (const stage of stages) {
        for (const word of stage.vocabSet || []) {
          if (word.word.length > 5 || word.word.includes(' ')) {
            exercises.push({
              stageId: stage._id,
              theme: stage.theme,
              cityName: stage.cityName,
              type: 'speaking',
              prompt: word.word,
              promptEn: `Translate and speak: "${word.translation}"`,
              audioText: word.word,
              correctAnswer: word.word,
              explanation: `"${word.word}" translates to "${word.translation}" in English.`,
              points: 10,
            });
          }
        }
      }
    }
    // Shuffle the final mixed array before slicing
    exercises.sort(() => 0.5 - Math.random());
    res.json({ tier, exercises: exercises.slice(0, 20), total: exercises.length });
  } catch (err) {
    console.error('getSpeakingExercises error:', err);
    res.status(500).json({ message: 'Failed to load speaking exercises.' });
  }
};
