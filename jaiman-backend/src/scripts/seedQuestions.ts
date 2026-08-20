import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import Stage from "../models/Stage";
import Question from "../models/Question.model";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/jaiman";

const seedQuestions = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected successfully.");

    // Find the Köln stage
    const kolnStage = await Stage.findOne({ cityName: "Cologne" });
    if (!kolnStage) {
      console.error("Cologne stage not found! Please run the initial stage seed first.");
      process.exit(1);
    }

    console.log(`Found Cologne stage with ID: ${kolnStage._id}`);

    // Clear old questions for this stage
    await Question.deleteMany({ stopId: kolnStage._id });
    console.log("Cleared old questions for Cologne stage.");

    // Read the JSON file
    const jsonPath = path.join(__dirname, "../content/section1_a1/koln.json");
    const fileContent = fs.readFileSync(jsonPath, "utf-8");
    const questionsData = JSON.parse(fileContent);

    // Map questions and inject the stopId
    const questionsToInsert: any[] = [];
    
    questionsData.sessions.forEach((session: any) => {
      session.questions.forEach((q: any, index: number) => {
        questionsToInsert.push({
          questionId: q.id,
          stopId: kolnStage._id,
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

    // Insert into DB
    const inserted = await Question.insertMany(questionsToInsert);
    console.log(`Successfully seeded ${inserted.length} questions for Cologne.`);

  } catch (error) {
    console.error("Error seeding questions:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
    process.exit(0);
  }
};

seedQuestions();
