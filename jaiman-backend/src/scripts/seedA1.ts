import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';

dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
import Stage from '../models/Stage';
import Question from '../models/Question.model';
import { A1_STAGES } from '../content/curriculum/a1';
import { generateForStage } from './generateQuestions';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/jaiman';

/**
 * Seeds the full A1 course: 8 stages, ~1,200 generated questions.
 * Run with:  npx tsx src/scripts/seedA1.ts
 * Safe to re-run — it replaces the A1 stages and their questions wholesale.
 */
async function seed() {
  console.log('Connecting to', MONGO_URI.replace(/\/\/[^@]*@/, '//***@'));
  await mongoose.connect(MONGO_URI);

  console.log('Removing old A1 stages and questions…');
  const oldStages = await Stage.find({ tier: 'A1' }).select('_id');
  await Question.deleteMany({ stopId: { $in: oldStages.map((s) => s._id) } });
  await Stage.deleteMany({ tier: 'A1' });

  let questionTotal = 0;

  for (let i = 0; i < A1_STAGES.length; i++) {
    const data = A1_STAGES[i];
    if (!data) continue;
    const gen = generateForStage(data, i + 1);

    const stage = await Stage.create({
      tier: 'A1',
      stageNumber: i + 1,
      theme: data.theme,
      cityName: data.cityName,
      cityNameDe: data.cityNameDe,
      emoji: data.emoji,
      vocabSet: data.vocab.map((v) => ({
        word: v.g ? `${v.g} ${v.de}` : v.de,
        translation: v.en,
        gender: v.g ?? 'none',
      })),
      grammarNote: data.grammarNote,
      sessions: gen.sessions.map((s) => ({ ...s, exercises: [] })),
      bossTest: gen.bossTest.map((b) => ({
        type: b.type,
        prompt: b.prompt,
        options: b.options,
        correctAnswer: b.correctAnswer,
        points: b.points,
      })),
      totalXp: gen.totalXp,
    } as never);

    await Question.insertMany(
      gen.questions.map((q) => ({ ...q, stopId: stage._id }))
    );

    questionTotal += gen.questions.length + gen.bossTest.length;
    console.log(
      `  ${data.cityNameDe.padEnd(12)} ${gen.questions.length} questions + ${gen.bossTest.length} boss  (${gen.totalXp} XP)`
    );
  }

  console.log(`\nSeeded ${A1_STAGES.length} stages, ${questionTotal} questions total.`);
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
