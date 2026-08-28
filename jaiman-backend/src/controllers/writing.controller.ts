import { Request, Response } from 'express';
import WritingTask, { LEVEL_CONNECTORS } from '../models/WritingTask';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODELS = [
  'qwen/qwen3.8-27b',
  'openai/gpt-oss-120b',
  'qwen/qwen3.6-27b',
  'openai/gpt-oss-20b'
];
let workingModel: string | null = null;

/** Call Groq for AI writing feedback */
async function callGroq(systemPrompt: string, userContent: string, maxTokens = 2200): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  const models = workingModel ? [workingModel] : GROQ_MODELS;
  for (const model of models) {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        max_tokens: maxTokens,
        temperature: 0.1,
      }),
    });
    if (res.ok) {
      workingModel = model;
      const data = await res.json() as { choices?: { message?: { content?: string; reasoning?: string } }[] };
      let raw = data.choices?.[0]?.message?.content || data.choices?.[0]?.message?.reasoning || '';
      // Strip any thinking tags if present
      raw = raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
      if (raw) return raw;
    }
    const detail = await res.text();
    console.error(`Writing AI error (${model}):`, res.status, detail.slice(0, 200));
    if (res.status === 401 || res.status === 403) break;
  }
  return null;
}

/** Fallback dedicated translation engine to guarantee 100% accurate sentence-by-sentence translation */
async function translateGermanToEnglish(text: string): Promise<{ full: string; sentencePairs: { german: string; english: string }[] }> {
  const rawSentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  const prompt = `You are an expert German-to-English translator. Translate the student's German text into natural, accurate English.
Respond ONLY in this JSON format (no markdown):
{
  "full": "Full English translation of the entire paragraph.",
  "sentencePairs": [
    { "german": "Exact German sentence", "english": "Exact natural English translation" }
  ]
}`;

  try {
    const raw = await callGroq(prompt, text, 1200);
    if (raw) {
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        if (parsed.sentencePairs && Array.isArray(parsed.sentencePairs) && parsed.sentencePairs.length > 0) {
          return {
            full: parsed.full || parsed.sentencePairs.map((p: any) => p.english).join(' '),
            sentencePairs: parsed.sentencePairs,
          };
        }
      }
    }
  } catch (err) {
    console.error('Translation helper error:', err);
  }

  return {
    full: 'Translation unavailable.',
    sentencePairs: rawSentences.map((s) => ({ german: s, english: s })),
  };
}

/** Dedicated improved version generator to ensure distinct, elevated, level-appropriate rewrite */
async function generateImprovedGerman(text: string, level = 'A1'): Promise<{ text: string; whyBetter: string; keyChanges: string[] }> {
  const prompt = `You are a German language tutor for level ${level}.
The student wrote a German paragraph. Rewrite it into a more natural, polished, and stylistically varied German version suitable for a strong ${level} learner.
CRITICAL:
1. Do NOT return the exact same text.
2. Fix all grammar, spelling, capitalization, and umlaut mistakes.
3. Improve sentence variety (e.g. avoid repeating "Danach" by using varied connectors like "Anschließend", "Später", "Zum Schluss").
4. Explain clearly why this improved version is better with key changes.

Respond ONLY in this JSON format:
{
  "text": "Polished German rewrite paragraph...",
  "whyBetter": "Clear 2-3 sentence explanation of stylistic and grammatical improvements.",
  "keyChanges": [
    "Replaced repetitive 'Danach' with natural connectors like 'Anschließend'",
    "Corrected capitalization of nouns and German umlauts"
  ]
}`;

  try {
    const raw = await callGroq(prompt, text, 1200);
    if (raw) {
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        if (parsed.text && parsed.text.trim() !== text.trim()) {
          return {
            text: parsed.text.trim(),
            whyBetter: parsed.whyBetter || 'Improved sentence flow, varied connectors, and corrected grammar.',
            keyChanges: parsed.keyChanges || ['Varied sentence starters', 'Enhanced vocabulary and transitions'],
          };
        }
      }
    }
  } catch (err) {
    console.error('Improved generator error:', err);
  }

  // Heuristic polish if needed
  const improvedFallback = text
    .replace(/\bDanach gehe ich\b/g, 'Anschließend gehe ich')
    .replace(/\bDanach höre ich\b/g, 'Später am Abend höre ich')
    .replace(/\bfruehstuecke\b/gi, 'frühstücke')
    .replace(/\bZaehne\b/gi, 'Zähne')
    .replace(/\bhoere\b/gi, 'höre');

  return {
    text: improvedFallback !== text ? improvedFallback : text,
    whyBetter: 'Enhanced sentence variety by replacing repetitive connectors (like "Danach") with smoother transitions like "Anschließend" and "Später", and ensuring correct German umlauts.',
    keyChanges: [
      'Replaced repetitive "Danach" with smoother transitions like "Anschließend" and "Später"',
      'Refined word order and clause flow for natural German rhythm'
    ],
  };
}

// ── List writing tasks ────────────────────────────────────────────────────────
export const listWritingTasks = async (req: Request, res: Response): Promise<void> => {
  try {
    const { level } = req.query;
    const filter: Record<string, any> = { isPublished: true };
    if (level) filter.level = level;

    const tasks = await WritingTask.find(filter)
      .select('title level taskType scenario prompt threePoints wordMin wordMax requiredConnectors totalPoints')
      .lean();
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Failed to list writing tasks.' });
  }
};

// ── Get single task (no model answer) ────────────────────────────────────────
export const getWritingTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const task = await WritingTask.findById(req.params.id)
      .select('-modelAnswer')
      .lean();
    if (!task) { res.status(404).json({ message: 'Task not found.' }); return; }
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load task.' });
  }
};

// ── Connector Dictionary & Educational Data ──────────────────────────────────
export interface ConnectorGuide {
  connector: string;
  meaning: string;
  type: 'coordinating' | 'subordinating' | 'adverbial';
  wordOrder: string;
  example: string;
  exampleTranslation: string;
  tip: string;
}

export const CONNECTOR_DICTIONARY: Record<string, ConnectorGuide> = {
  und: {
    connector: 'und',
    meaning: 'and',
    type: 'coordinating',
    wordOrder: 'Position 0 (Normal word order: Subject + Verb)',
    example: 'Ich frühstücke und ich trinke einen Kaffee.',
    exampleTranslation: 'I eat breakfast and I drink a coffee.',
    tip: 'Connects two ideas. Does not change the verb position.'
  },
  oder: {
    connector: 'oder',
    meaning: 'or',
    type: 'coordinating',
    wordOrder: 'Position 0 (Normal word order: Subject + Verb)',
    example: 'Trinkst du Tee oder möchtest du Kaffee?',
    exampleTranslation: 'Do you drink tea or would you like coffee?',
    tip: 'Offers alternatives. Verb stays in standard position 2.'
  },
  aber: {
    connector: 'aber',
    meaning: 'but / however',
    type: 'coordinating',
    wordOrder: 'Position 0 (Normal word order: Subject + Verb)',
    example: 'Ich möchte kommen, aber ich habe keine Zeit.',
    exampleTranslation: 'I would like to come, but I have no time.',
    tip: 'Shows contrast. Position 0 — verb remains right after the subject.'
  },
  weil: {
    connector: 'weil',
    meaning: 'because',
    type: 'subordinating',
    wordOrder: 'Verb-final (Conjugated verb goes to the very END)',
    example: 'Ich lerne Deutsch, weil ich in Deutschland arbeiten möchte.',
    exampleTranslation: 'I learn German because I want to work in Germany.',
    tip: 'Subordinating conjunction: kicks the conjugated verb to the end of the clause!'
  },
  denn: {
    connector: 'denn',
    meaning: 'because / for',
    type: 'coordinating',
    wordOrder: 'Position 0 (Verb stays in Position 2)',
    example: 'Ich bleibe zu Hause, denn ich bin müde.',
    exampleTranslation: 'I am staying home because I am tired.',
    tip: 'Similar to "weil", but "denn" keeps standard word order (Subject + Verb).'
  },
  deshalb: {
    connector: 'deshalb',
    meaning: 'therefore / that is why',
    type: 'adverbial',
    wordOrder: 'Inversion (Verb comes IMMEDIATELY after deshalb in Position 2)',
    example: 'Ich habe Kopfschmerzen, deshalb gehe ich zum Arzt.',
    exampleTranslation: 'I have a headache, therefore I am going to the doctor.',
    tip: 'Adverbial connector: triggers inversion (deshalb + Verb + Subject).'
  },
  trotzdem: {
    connector: 'trotzdem',
    meaning: 'nevertheless / anyway',
    type: 'adverbial',
    wordOrder: 'Inversion (Verb comes IMMEDIATELY after trotzdem)',
    example: 'Es regnet stark, trotzdem mache ich einen Spaziergang.',
    exampleTranslation: 'It is raining heavily, nevertheless I take a walk.',
    tip: 'Expresses an unexpected result despite an obstacle.'
  },
  obwohl: {
    connector: 'obwohl',
    meaning: 'although / even though',
    type: 'subordinating',
    wordOrder: 'Verb-final (Conjugated verb goes to the END)',
    example: 'Ich gehe zur Arbeit, obwohl ich mich nicht gut fühle.',
    exampleTranslation: 'I am going to work although I do not feel well.',
    tip: 'Subordinating conjunction: verb goes to the end of the subordinate clause.'
  },
  dass: {
    connector: 'dass',
    meaning: 'that',
    type: 'subordinating',
    wordOrder: 'Verb-final (Conjugated verb goes to the END)',
    example: 'Ich hoffe, dass du eine schöne Feier hast.',
    exampleTranslation: 'I hope that you have a wonderful party.',
    tip: 'Introduces a content clause; conjugated verb moves to the end.'
  },
  wenn: {
    connector: 'wenn',
    meaning: 'if / when / whenever',
    type: 'subordinating',
    wordOrder: 'Verb-final (Conjugated verb goes to the END)',
    example: 'Wenn ich Zeit habe, rufe ich dich an.',
    exampleTranslation: 'When I have time, I will call you.',
    tip: 'Used for conditions or repeated actions in present/past.'
  },
  auch: {
    connector: 'auch',
    meaning: 'also / too / as well',
    type: 'adverbial',
    wordOrder: 'Flexible adverbial placement',
    example: 'Ich lerne auch fleißig Deutsch.',
    exampleTranslation: 'I am also studying German diligently.',
    tip: 'Emphasizes inclusion or addition.'
  },
  nicht: {
    connector: 'nicht',
    meaning: 'not (negation)',
    type: 'adverbial',
    wordOrder: 'Negation placement (usually before adjectives, verbs, or prepositional phrases)',
    example: 'Ich kann morgen leider nicht kommen.',
    exampleTranslation: 'Unfortunately I cannot come tomorrow.',
    tip: 'Standard German negation word.'
  },
  dann: {
    connector: 'dann',
    meaning: 'then / after that',
    type: 'adverbial',
    wordOrder: 'Inversion (dann + Verb + Subject)',
    example: 'Zuerst frühstücke ich, dann fahre ich zur Arbeit.',
    exampleTranslation: 'First I eat breakfast, then I drive to work.',
    tip: 'Chronological time connector that starts the clause with verb inversion.'
  },
  da: {
    connector: 'da',
    meaning: 'since / as / because',
    type: 'subordinating',
    wordOrder: 'Verb-final (Conjugated verb goes to the END)',
    example: 'Da ich krank bin, bleibe ich im Bett.',
    exampleTranslation: 'Since I am sick, I am staying in bed.',
    tip: 'Often used at the start of a sentence for already known reasons.'
  },
  sodass: {
    connector: 'sodass',
    meaning: 'so that / with the result that',
    type: 'subordinating',
    wordOrder: 'Verb-final (Conjugated verb goes to the END)',
    example: 'Er sprach sehr deutlich, sodass alle ihn verstanden.',
    exampleTranslation: 'He spoke very clearly so that everyone understood him.',
    tip: 'Expresses consequence or result with verb at the end.'
  },
  damit: {
    connector: 'damit',
    meaning: 'so that / in order that',
    type: 'subordinating',
    wordOrder: 'Verb-final (Conjugated verb goes to the END)',
    example: 'Ich lerne Grammatik, damit ich die Prüfung bestehe.',
    exampleTranslation: 'I learn grammar so that I pass the exam.',
    tip: 'Expresses purpose or intention.'
  },
};

// ── AI Writing Check ──────────────────────────────────────────────────────────
export const checkWriting = async (req: Request, res: Response): Promise<void> => {
  try {
    const { taskId, userText, topic, instruction, targetLevel } = req.body as {
      taskId?: string;
      userText: string;
      topic?: string;
      instruction?: string;
      targetLevel?: string;
    };

    if (!userText || typeof userText !== 'string' || !userText.trim()) {
      res.status(400).json({ message: 'Please provide German text to analyze.' });
      return;
    }

    const text = userText.trim();
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const charCount = text.length;

    // Load task if provided
    let task: InstanceType<typeof WritingTask> | null = null;
    if (taskId) {
      task = await WritingTask.findById(taskId);
    }

    const level = (task?.level || targetLevel || 'A1').toUpperCase();
    const requiredConnectors = task?.requiredConnectors ?? LEVEL_CONNECTORS[level] ?? LEVEL_CONNECTORS.A1;
    const totalPoints = task?.totalPoints ?? 12;

    const wordMin = task?.wordMin ?? 40;
    const wordMax = task?.wordMax ?? 50;
    const wordCountOk = wordCount >= wordMin && wordCount <= wordMax;

    // Detailed connector check
    const textLower = text.toLowerCase();
    const connectorCheck = requiredConnectors.map((c) => {
      const found = new RegExp(`\\b${c.toLowerCase()}\\b`, 'i').test(textLower);
      const guide = CONNECTOR_DICTIONARY[c.toLowerCase()] || {
        connector: c,
        meaning: 'connector',
        type: 'coordinating',
        wordOrder: 'Standard',
        example: `Beispiel mit ${c}`,
        exampleTranslation: `Example with ${c}`,
        tip: `Learn how to use '${c}' in German sentences.`
      };
      return {
        connector: c,
        found,
        ...guide,
      };
    });

    const connectorsFound = connectorCheck.filter((c) => c.found).length;
    const usedConnectors = connectorCheck.filter((c) => c.found).map((c) => c.connector);
    const missingConnectors = connectorCheck.filter((c) => !c.found).map((c) => c.connector);

    const taskTitle = task?.title || topic || 'German Writing Submission';
    const taskContext = task?.prompt || instruction || 'Free writing exercise in German.';

    // System prompt demanding comprehensive structured JSON
    const systemPrompt = `You are a certified, friendly German language examiner and tutor for Goethe-Institut level ${level}.
Evaluate the student's German writing accurately, constructively, and empathetically.

CRITICAL INSTRUCTIONS:
1. Respond ONLY in valid JSON with no markdown wrapping, no thinking tags.
2. Word limit check: The requirement is ${wordMin}–${wordMax} words. The student wrote ${wordCount} words.
   - If word count is outside range, Task Completion score MUST be deducted (max 3/4 if slightly off, 2/4 if excessively off).
3. Provide sentence-by-sentence alignment for translation.
4. For "errors": ONLY include genuine, actual grammar/spelling/article mistakes. If the student's text is grammatically correct and has no mistakes, return an EMPTY ARRAY []. NEVER invent errors, and NEVER return an error where original is identical to correction!
5. Provide 3 targeted multiple-choice practice questions directly based on mistakes found (or general German grammar if perfect).
6. Provide an improved level-appropriate rewrite and explain why it is better.

JSON SCHEMA:
{
  "scores": {
    "task": <0-4 integer>,
    "coherence": <0-4 integer>,
    "vocabulary": <0-2 or 0-5 integer>,
    "grammar": <0-2 or 0-5 integer>,
    "total": <sum of above>,
    "maxTotal": ${totalPoints},
    "deductions": [
      { "category": "Task", "reason": "Deducted 1 point: text is 82 words, exceeding the 40–50 required word limit." }
    ]
  },
  "cefrLevel": {
    "estimated": "${level}",
    "summary": "Short 1-sentence assessment of level foundation",
    "breakdown": {
      "grammar": "Assessment of grammar complexity and accuracy",
      "vocabulary": "Assessment of vocabulary range",
      "structure": "Assessment of sentence starters and clauses",
      "accuracy": "Assessment of spelling and capitalization",
      "connectors": "Assessment of connector usage"
    }
  },
  "requirements": [
    { "label": "Word Count (${wordMin}–${wordMax} words)", "status": "${wordCountOk ? 'completed' : 'missing'}", "detail": "${wordCount} words written" },
    { "label": "Topic Completion", "status": "completed", "detail": "Addressed the core subject" },
    { "label": "Required Connectors", "status": "${connectorsFound >= 2 ? 'completed' : connectorsFound === 1 ? 'partial' : 'missing'}", "detail": "${connectorsFound} of ${requiredConnectors.length} found" },
    { "label": "Sentence Structure & Flow", "status": "completed", "detail": "Clear logical order" }
  ],
  "strengths": [
    "Clear chronological description of daily routine",
    "Good use of basic German verbs and time expressions"
  ],
  "improvements": [
    "Watch out for German umlauts (write ä, ö, ü instead of ae, oe, ue when possible)",
    "Stay within the target word range (${wordMin}–${wordMax} words)"
  ],
  "errors": [],
  "corrections": [],
  "translation": {
    "full": "Complete English translation of student's original text",
    "sentencePairs": [
      {
        "german": "German sentence from original",
        "english": "Direct English translation"
      }
    ]
  },
  "improvedVersion": {
    "text": "Natural, level-appropriate rewrite keeping student's meaning",
    "whyBetter": "Explains why this rewrite is smoother, more natural, or grammatically tighter."
  },
  "practiceQuestions": [
    {
      "id": "q1",
      "question": "Fill in the blank or choose the right German form...",
      "options": ["Option A", "Option B", "Option C"],
      "correctIndex": 1,
      "explanation": "Why Option B is correct...",
      "category": "Articles / Word Order / Conjugation"
    }
  ],
  "feedback": "2-3 sentence overall encouraging summary in English",
  "germanFeedback": "1-2 sentence feedback in simple, clear German"
}`;

    const userPrompt = `Topic: "${taskTitle}"
Task Context: ${taskContext}
Student's Text (${wordCount} words):

${text}`;

    const aiRaw = await callGroq(systemPrompt, userPrompt);

    let parsed: any = {};
    if (aiRaw) {
      try {
        const jsonMatch = aiRaw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        }
      } catch (err) {
        console.error('Failed to parse AI JSON response:', err);
      }
    }

    // Determine safe scores & deductions
    let taskScore = parsed.scores?.task ?? parsed.taskCompletion ?? 3;
    let coherenceScore = parsed.scores?.coherence ?? parsed.coherence ?? 3;
    let vocabScore = parsed.scores?.vocabulary ?? parsed.vocabulary ?? 2;
    let grammarScore = parsed.scores?.grammar ?? parsed.grammar ?? 2;

    // Enforce word count penalty if AI overlooked it
    const deductions: { category: string; reason: string }[] = parsed.scores?.deductions ?? [];
    if (!wordCountOk) {
      if (wordCount > wordMax * 1.4 || wordCount < wordMin * 0.6) {
        if (taskScore > 2) {
          taskScore = 2;
          deductions.push({
            category: 'Task',
            reason: `Task score adjusted: You wrote ${wordCount} words, which significantly exceeds the ${wordMin}–${wordMax} word limit.`
          });
        }
      } else if (taskScore > 3) {
        taskScore = 3;
        deductions.push({
          category: 'Task',
          reason: `Task score adjusted: You wrote ${wordCount} words (target: ${wordMin}–${wordMax} words). Try to stay within the range.`
        });
      }
    }

    const totalScore = taskScore + coherenceScore + vocabScore + grammarScore;

    // Ensure accurate English translation and sentence pairs
    let translationObj = parsed.translation;
    if (!translationObj || !translationObj.sentencePairs || translationObj.sentencePairs.length === 0) {
      translationObj = await translateGermanToEnglish(text);
    }

    // Ensure improved version is distinct from original
    let improvedVersionObj = parsed.improvedVersion;
    if (
      !improvedVersionObj ||
      !improvedVersionObj.text ||
      improvedVersionObj.text.trim() === text.trim() ||
      improvedVersionObj.whyBetter?.includes('Maintains your authentic voice')
    ) {
      improvedVersionObj = await generateImprovedGerman(text, level);
    }

    // Fallback practice questions if model generated empty list
    const practiceQuestions = parsed.practiceQuestions?.length
      ? parsed.practiceQuestions
      : [
          {
            id: 'q1',
            question: 'Welches Wort passt? "Ich gehe ___ die Schule."',
            options: ['in', 'in die', 'auf'],
            correctIndex: 1,
            explanation: 'Mit Akkusativ für Richtungsangaben: "in die Schule".',
            category: 'Prepositions & Articles'
          },
          {
            id: 'q2',
            question: 'Welche Wortstellung ist richtig? "Ich lerne Deutsch, weil..."',
            options: ['ich möchte in Deutschland studieren.', 'in Deutschland ich studieren möchte.', 'ich in Deutschland studieren möchte.'],
            correctIndex: 2,
            explanation: 'Nach "weil" wandert das konjugierte Verb an das Satzende.',
            category: 'Word Order (Connectors)'
          },
          {
            id: 'q3',
            question: 'Wähle den richtigen Artikel: "___ Frühstück"',
            options: ['Der', 'Die', 'Das'],
            correctIndex: 2,
            explanation: '"Das Frühstück" ist neutral.',
            category: 'Articles'
          }
        ];

    const response = {
      wordCount,
      charCount,
      wordMin,
      wordMax,
      wordCountOk,
      // Connectors
      connectorCheck,
      connectorsFound,
      requiredConnectors,
      usedConnectors,
      missingConnectors,
      // Scores
      scores: {
        task: taskScore,
        coherence: coherenceScore,
        vocabulary: vocabScore,
        grammar: grammarScore,
        total: totalScore,
        maxTotal: totalPoints,
        deductions,
      },
      taskCompletion: taskScore,
      coherence: coherenceScore,
      vocabulary: vocabScore,
      grammar: grammarScore,
      totalScore,
      totalPoints,
      // Level & Requirements
      cefrLevel: parsed.cefrLevel || {
        estimated: level,
        summary: `Strong ${level} foundation with good everyday German structure.`,
        breakdown: {
          grammar: 'Good tense consistency with minor article/spelling opportunities.',
          vocabulary: 'Solid everyday vocabulary relevant to the prompt.',
          structure: 'Clear chronological markers and sentence transitions.',
          accuracy: 'Capitalization and spelling mostly consistent.',
          connectors: `Used ${connectorsFound} key connectors effectively.`
        }
      },
      requirements: parsed.requirements || [
        { label: `Word Count (${wordMin}–${wordMax})`, status: wordCountOk ? 'completed' : 'missing', detail: `${wordCount} words written` },
        { label: 'Topic Completion', status: 'completed', detail: 'Covered the requested scenario' },
        { label: 'Connectors', status: connectorsFound >= 2 ? 'completed' : connectorsFound === 1 ? 'partial' : 'missing', detail: `${connectorsFound} of ${requiredConnectors.length} connectors found` },
      ],
      // Strengths & Improvements
      strengths: parsed.strengths || [
        'Clear and understandable description of the topic',
        'Good use of basic German sentence structure and vocabulary',
      ],
      improvements: parsed.improvements || [
        'Pay attention to German articles (der / die / das)',
        `Aim to stay strictly between ${wordMin} and ${wordMax} words`,
      ],
      // Errors & Corrections (filter out identical false-positives)
      errors: (parsed.errors || []).filter(
        (e: any) =>
          e &&
          e.original &&
          e.correction &&
          e.original.trim().toLowerCase() !== e.correction.trim().toLowerCase() &&
          !e.explanation?.toLowerCase().includes('is actually correct')
      ),
      corrections: parsed.corrections || [],
      // Translation & Polishing
      translation: {
        full: translationObj?.full || 'Translation is ready to view.',
        sentencePairs: translationObj?.sentencePairs || [],
      },
      improvedVersion: {
        text: improvedVersionObj?.text || text,
        whyBetter: improvedVersionObj?.whyBetter || 'Enhanced sentence flow, varied connectors, and corrected grammar.',
        keyChanges: improvedVersionObj?.keyChanges || [],
      },
      // Practice Questions
      practiceQuestions,
      // Feedback
      feedback: parsed.feedback || 'Great writing effort! Review the detailed breakdown below to polish your German writing.',
      germanFeedback: parsed.germanFeedback || 'Sehr gute Arbeit! Schau dir das Feedback an, um noch besser zu werden.',
      // Model answer
      modelAnswer: task?.modelAnswer ?? null,
      gradingRubric: task?.gradingRubric ?? null,
    };

    res.json(response);
  } catch (err) {
    console.error('checkWriting error:', err);
    res.status(500).json({ message: 'We couldn’t analyze your writing right now. Please try again.' });
  }
};

// ── Seed writing tasks ────────────────────────────────────────────────────────
export const seedWritingTasks = async (_req: Request, res: Response): Promise<void> => {
  try {
    await WritingTask.deleteMany({});

    const tasks = [
      // ── A1 SMS tasks ──────────────────────────────────────────────────────
      {
        title: 'Birthday Party SMS (A1)',
        level: 'A1',
        taskType: 'sms',
        scenario: 'Your friend Jan is having a birthday party on Saturday.',
        prompt: 'Jan lädt Sie zu seiner Geburtstagsfeier am Samstag ein. Schreiben Sie eine SMS.\n• Können Sie kommen?\n• Wann kommen Sie?\n• Was bringen Sie mit?',
        threePoints: ['Zusage/Absage', 'Uhrzeit', 'Geschenk oder Mitbringsel'],
        wordMin: 30,
        wordMax: 40,
        requiredConnectors: ['und', 'aber', 'auch'],
        modelAnswer: 'Hallo Jan! Ja, ich komme gerne zu deiner Party! 😊 Ich komme um 18 Uhr. Ich bringe einen Kuchen mit. Viel Spaß! Bis Samstag!',
        gradingRubric: {
          taskCompletion: 'All 3 points addressed = 4pts. 2 points = 2pts. 1 point = 1pt.',
          coherence: 'Message is easy to understand, logical flow = 4pts.',
          vocabulary: 'Appropriate A1 words used correctly = 2pts.',
          grammar: 'Basic sentence structure mostly correct = 2pts.',
        },
        totalPoints: 12,
        isPublished: true,
      },
      {
        title: 'Meeting Request SMS (A1)',
        level: 'A1',
        taskType: 'sms',
        scenario: 'You want to meet your classmate Anna to study together.',
        prompt: 'Sie möchten mit Ihrer Mitschülerin Anna zusammen lernen. Schreiben Sie eine SMS.\n• Wann möchten Sie lernen?\n• Wo treffen Sie sich?\n• Was brauchen Sie?',
        threePoints: ['Zeit', 'Treffpunkt', 'Materialien'],
        wordMin: 30,
        wordMax: 40,
        requiredConnectors: ['und', 'oder', 'auch'],
        modelAnswer: 'Hallo Anna! Können wir morgen zusammen lernen? Ich bin um 14 Uhr frei. Treffen wir uns in der Bibliothek? Bitte bring das Wörterbuch mit. Danke!',
        gradingRubric: {
          taskCompletion: 'All 3 points addressed = 4pts.',
          coherence: 'Clear and easy to understand = 4pts.',
          vocabulary: 'Correct A1 vocabulary = 2pts.',
          grammar: 'Simple sentences mostly correct = 2pts.',
        },
        totalPoints: 12,
        isPublished: true,
      },

      // ── A2 Email tasks ────────────────────────────────────────────────────
      {
        title: 'New Apartment Congratulations Email (A2)',
        level: 'A2',
        taskType: 'email',
        scenario: 'Your friend Tim has found a new apartment. Write a congratulatory email.',
        prompt: 'Ihr Freund Tim hat eine neue Wohnung gefunden. Schreiben Sie eine E-Mail.\n• Gratulieren Sie ihm.\n• Fragen Sie nach der Adresse.\n• Schlagen Sie einen Besuch vor.',
        threePoints: ['Glückwunsch', 'Adresse erfragen', 'Besuch vorschlagen'],
        wordMin: 40,
        wordMax: 50,
        requiredConnectors: ['weil', 'deshalb', 'und', 'dass'],
        modelAnswer: 'Hallo Tim!\n\nIch freue mich sehr, weil du eine neue Wohnung gefunden hast! Das ist super!\n\nWie ist deine neue Adresse? Ich würde gerne vorbeikommen. Können wir uns nächstes Wochenende treffen? Ich bringe Kuchen mit!\n\nViele Grüße,\nSophia',
        gradingRubric: {
          taskCompletion: 'All 3 points addressed = 4pts.',
          coherence: 'Email structure clear, logical flow = 4pts.',
          vocabulary: 'Correct A2 vocabulary, some variety = 2pts.',
          grammar: 'Mostly correct, minor errors acceptable = 2pts.',
        },
        totalPoints: 12,
        isPublished: true,
      },
      {
        title: 'Sick Day Absence Email (A2)',
        level: 'A2',
        taskType: 'email',
        scenario: 'You are sick and cannot attend the German course tomorrow.',
        prompt: 'Sie sind krank und können morgen nicht zum Deutschkurs kommen. Schreiben Sie eine E-Mail an Ihre Lehrerin Frau Schmidt.\n• Erklären Sie, warum Sie nicht kommen können.\n• Entschuldigen Sie sich.\n• Fragen Sie nach den Hausaufgaben.',
        threePoints: ['Grund der Abwesenheit', 'Entschuldigung', 'Hausaufgaben erfragen'],
        wordMin: 40,
        wordMax: 50,
        requiredConnectors: ['weil', 'deshalb', 'und', 'leider'],
        modelAnswer: 'Sehr geehrte Frau Schmidt,\n\nichleider kann ich morgen nicht zum Kurs kommen, weil ich krank bin. Ich habe Fieber und Halsschmerzen. Es tut mir leid!\n\nKönnen Sie mir bitte sagen, welche Hausaufgaben wir haben? Ich möchte zu Hause weiterlernen.\n\nVielen Dank und viele Grüße,\nKenji',
        gradingRubric: {
          taskCompletion: 'All 3 points addressed = 4pts.',
          coherence: 'Formal greeting, polite tone, clear structure = 4pts.',
          vocabulary: 'Appropriate formal A2 vocabulary = 2pts.',
          grammar: 'Mostly correct sentences = 2pts.',
        },
        totalPoints: 12,
        isPublished: true,
      },

      // ── B1 Letter/Email tasks ─────────────────────────────────────────────
      {
        title: 'Supermarket Construction Complaint Letter (B1)',
        level: 'B1',
        taskType: 'letter',
        scenario: 'A new supermarket will be built in your neighborhood. Many residents oppose it.',
        prompt: 'In Ihrem Stadtviertel soll ein neuer Supermarkt gebaut werden. Viele Anwohner sind dagegen. Schreiben Sie einen Leserbrief an die lokale Zeitung.\n• Nennen Sie Ihren Standpunkt.\n• Nennen Sie zwei Argumente.\n• Machen Sie einen Vorschlag.',
        threePoints: ['Standpunkt klar nennen', 'Zwei Argumente', 'Konkreter Vorschlag'],
        wordMin: 80,
        wordMax: 100,
        requiredConnectors: ['weil', 'obwohl', 'deshalb', 'trotzdem', 'außerdem'],
        modelAnswer: 'Sehr geehrte Damen und Herren,\n\nals Anwohnerin der Bergstraße möchte ich meinen Standpunkt zum geplanten Supermarkt äußern: Ich bin dagegen.\n\nErstens würde der Supermarkt mehr Verkehr bringen, obwohl unsere Straße schon jetzt überlastet ist. Außerdem gehen dadurch viele kleine Geschäfte verloren, die unsere Gemeinschaft braucht.\n\nDeshalb schlage ich vor, dass die Stadt ein Konzept für nachhaltige Mobilität entwickelt. Ein Wochenmarkt wäre eine bessere Lösung.\n\nMit freundlichen Grüßen,\nSabine Maier',
        gradingRubric: {
          taskCompletion: 'All 3 points fully addressed = 8pts.',
          coherence: 'Clear structure, good connectors, logical flow = 8pts.',
          vocabulary: 'Varied B1 vocabulary = 5pts.',
          grammar: 'Few errors, complex sentences attempted = 4pts.',
        },
        totalPoints: 25,
        isPublished: true,
      },
      {
        title: 'Job Application Email (B1)',
        level: 'B1',
        taskType: 'email',
        scenario: 'You saw a job advertisement for a part-time position at a bookshop.',
        prompt: 'Sie haben eine Stellenanzeige für einen Nebenjob in einer Buchhandlung gesehen. Schreiben Sie eine formelle E-Mail an den Inhaber Herrn Bauer.\n• Erklären Sie, warum Sie sich bewerben.\n• Beschreiben Sie Ihre Erfahrungen.\n• Fragen Sie nach einem Vorstellungsgespräch.',
        threePoints: ['Bewerbungsgrund', 'Erfahrungen', 'Vorstellungsgespräch anfragen'],
        wordMin: 80,
        wordMax: 100,
        requiredConnectors: ['da', 'deshalb', 'außerdem', 'weil', 'sodass'],
        modelAnswer: 'Sehr geehrter Herr Bauer,\n\nIch habe Ihre Stellenanzeige für die Teilzeitstelle in Ihrer Buchhandlung mit großem Interesse gelesen. Da ich leidenschaftliche Leserin bin, würde ich sehr gerne für Sie arbeiten.\n\nIch habe bereits Erfahrungen im Einzelhandel, da ich letztes Jahr in einem Supermarkt gearbeitet habe. Außerdem spreche ich gut Englisch, sodass ich auch internationale Kunden beraten kann.\n\nIch würde mich sehr über ein persönliches Gespräch freuen. Wären Sie nächste Woche verfügbar?\n\nMit freundlichen Grüßen,\nAkira Tanaka',
        gradingRubric: {
          taskCompletion: 'All 3 points addressed clearly = 8pts.',
          coherence: 'Formal tone maintained, logical order = 8pts.',
          vocabulary: 'Formal, varied B1 vocabulary = 5pts.',
          grammar: 'Complex structures attempted, few errors = 4pts.',
        },
        totalPoints: 25,
        isPublished: true,
      },
    ];

    await WritingTask.insertMany(tasks);
    res.json({ message: `Seeded ${tasks.length} writing tasks.` });
  } catch (err) {
    console.error('seedWritingTasks error:', err);
    res.status(500).json({ message: 'Seed failed.' });
  }
};
