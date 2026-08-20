import mongoose from 'mongoose';
import Stage from '../models/Stage';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/jaiman";

const seedStages = async () => {
  try {
    console.log("Connecting to MongoDB...", MONGO_URI);
    await mongoose.connect(MONGO_URI);
    
    console.log("Deleting old stages...");
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
      ] : [],
      grammarNote: index === 0 ? 'In German, "I am called" is "ich heiße" and "I am" is "ich bin".' : 'Grammar note incoming...',
      sessions: kolnSessions,
      bossTest: [
        { type: 'boss_test', prompt: `Mini roleplay chat in ${city.name}`, points: index === 7 ? 150 : 0 }
      ]
    }));

    const createdStages = await Stage.insertMany(stagesToInsert);
    console.log(`Seeded ${createdStages.length} cities for A1`);
  } catch (error) {
    console.error(error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

seedStages();
