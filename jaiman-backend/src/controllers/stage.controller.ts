import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import Stage from '../models/Stage';
import Question from '../models/Question.model';

// @desc    Get stage by tier and number
// @route   GET /api/stages/:tier/:number
// @access  Public (for onboarding/anonymous)
export const getStage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tier, number } = req.params;
    const stage = await Stage.findOne({ tier, stageNumber: Number(number) } as any);
    
    if (stage) {
      res.json(stage);
    } else {
      res.status(404).json({ message: 'Stage not found' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get specific session from a stage
// @route   GET /api/stages/:tier/:stageNumber/:sessionNumber
// @access  Protected
export const getSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tier, stageNumber, sessionNumber } = req.params;
    const stage = await Stage.findOne({ tier, stageNumber: Number(stageNumber) } as any);
    
    if (!stage) {
      res.status(404).json({ message: 'Stage not found' });
      return;
    }

    if (sessionNumber === 'boss') {
      res.json({ stageId: stage._id, title: 'Boss Test', exercises: stage.bossTest });
      return;
    }

    const session = stage.sessions.find(s => s.sessionNumber === Number(sessionNumber));
    if (session) {
      const sessionData = (session as any).toObject();
      
      // Fetch actual questions from the Question collection
      const realQuestions = await Question.find({ stopId: stage._id, sessionNumber: Number(sessionNumber) }).sort({ orderInSession: 1 });
      
      if (realQuestions && realQuestions.length > 0) {
        sessionData.exercises = realQuestions.map(q => ({
          id: q.questionId,
          type: q.questionType, // frontend handles 'vocab', 'grammar', 'matching', etc.
          prompt: q.questionText,
          options: q.options,
          correctAnswer: q.correctAnswer,
          audioUrl: q.audioUrl,
          imageUrl: q.imageUrl,
          points: q.xpValue
        }));
      }
      
      res.json({ stageId: stage._id, ...sessionData });
    } else {
      res.status(404).json({ message: 'Session not found' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all stages for a tier (section)
// @route   GET /api/stages/section/:tier
// @access  Protected
export const getStagesBySection = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tier } = req.params;
    const stages = await Stage.find({ tier } as any).sort({ stageNumber: 1 });
    res.json(stages);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Seed initial A1 Stage 1
// @route   POST /api/stages/seed
// @access  Admin
export const seedInitialStage = async (req: Request, res: Response): Promise<void> => {
  try {
    await Stage.deleteMany({});
    
    const kolnSessions = [
      {
        sessionNumber: 1, title: 'Vocab Intro', skillType: 'vocab',
        exercises: [{ type: 'vocab', prompt: 'Translate: Hello', correctAnswer: 'Hallo', points: 15 }]
      },
      {
        sessionNumber: 2, title: 'Vocab Practice', skillType: 'vocab',
        exercises: [{ type: 'vocab', prompt: 'Translate: Bye', correctAnswer: 'Tschüss', points: 15 }]
      },
      {
        sessionNumber: 3, title: 'Grammar Intro', skillType: 'grammar',
        exercises: [{ type: 'grammar', prompt: 'Build sentence: I am called Anna', options: ['heiße', 'ich', 'Anna'], correctAnswer: 'ich heiße Anna', points: 15 }]
      },
      {
        sessionNumber: 4, title: 'Grammar Practice', skillType: 'grammar',
        exercises: [{ type: 'grammar', prompt: 'Build sentence: I am from Berlin', options: ['bin', 'ich', 'aus', 'Berlin'], correctAnswer: 'ich bin aus Berlin', points: 15 }]
      },
      {
        sessionNumber: 5, title: 'Listening', skillType: 'listening',
        exercises: [{ type: 'listening', prompt: 'Match audio greeting', audioUrl: '/audio/hallo.mp3', correctAnswer: 'Hallo', points: 15 }]
      },
      {
        sessionNumber: 6, title: 'Speaking', skillType: 'speaking',
        exercises: [{ type: 'speaking', prompt: 'Say: Hallo, ich heiße ___', points: 15 }]
      },
      {
        sessionNumber: 7, title: 'Reading', skillType: 'reading',
        exercises: [{ type: 'vocab', prompt: 'Read: Hallo means...', correctAnswer: 'Hello', points: 15 }]
      },
      {
        sessionNumber: 8, title: 'Writing', skillType: 'writing',
        exercises: [{ type: 'writing', prompt: 'Fill in the blank: ___ bin aus Berlin', correctAnswer: 'ich', points: 15 }]
      }
    ];

    const cities = [
      { name: "Cologne", de: "Köln", emoji: "⛪", xp: 75 },
      { name: "Frankfurt", de: "Frankfurt", emoji: "🏦", xp: 50 },
      { name: "Stuttgart", de: "Stuttgart", emoji: "🚗", xp: 50 },
      { name: "Munich", de: "München", emoji: "🍺", xp: 50 },
      { name: "Düsseldorf", de: "Düsseldorf", emoji: "🎨", xp: 75 },
      { name: "Hannover", de: "Hannover", emoji: "🌳", xp: 100 },
      { name: "Hamburg", de: "Hamburg", emoji: "🚢", xp: 100 },
      { name: "Berlin", de: "Berlin", emoji: "🏛️", xp: 150 }
    ];

    const stagesToInsert = cities.map((city, index) => ({
      tier: 'A1',
      stageNumber: index + 1,
      theme: index === 0 ? 'Greetings & Introducing Yourself' : `Exploring ${city.name}`,
      cityName: city.name,
      cityNameDe: city.de,
      emoji: city.emoji,
      vocabSet: index === 0 ? [
        { word: 'Hallo', translation: 'Hello' },
        { word: 'Tschüss', translation: 'Bye' },
        { word: 'ich', translation: 'I' },
        { word: 'du', translation: 'you' },
        { word: 'heißen', translation: 'to be called' }
      ] : [], // Stub for other cities
      grammarNote: index === 0 ? 'In German, "I am called" is "ich heiße" and "I am" is "ich bin".' : 'Grammar note incoming...',
      sessions: kolnSessions,
      bossTest: [
        { type: 'boss_test', prompt: `Mini roleplay chat in ${city.name}`, points: index === 7 ? 150 : 0 } // Boss test holds remaining points
      ]
    }));

    const createdStages = await Stage.insertMany(stagesToInsert);
    
    // --- Seed the Questions from koln.json ---
    const kolnStage = createdStages[0]; // Cologne is the first one
    await Question.deleteMany({}); // clear all old questions
    
    const jsonPath = path.join(__dirname, '../content/section1_a1/koln.json');
    if (fs.existsSync(jsonPath)) {
      const fileContent = fs.readFileSync(jsonPath, 'utf-8');
      const questionsData = JSON.parse(fileContent);
      const questionsToInsert: any[] = [];
      
      questionsData.sessions.forEach((session: any) => {
        session.questions.forEach((q: any, index: number) => {
          questionsToInsert.push({
            questionId: q.id,
            stopId: kolnStage?._id, // Add optional chaining
            sessionNumber: session.session_number,
            skillType: session.skill_type,
            questionType: q.type,
            questionText: q.question_text,
            options: q.options,
            correctAnswer: q.correct_answer,
            audioUrl: q.audio_url || q.reference_audio,
            xpValue: q.xp_value || 5,
            orderInSession: index + 1
          });
        });
      });
      await Question.insertMany(questionsToInsert);
    }
    // ----------------------------------------

    res.status(201).json({ message: "Seeded 8 cities for A1 and updated Koln questions", count: createdStages.length });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
