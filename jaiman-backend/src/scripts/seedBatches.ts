/**
 * seedBatches.ts
 * Run: npx tsx src/scripts/seedBatches.ts
 *
 * Seeds 4 default German batches (A1 Free, A1 Paid, A2 Free, B1 Paid)
 * each with 3 modules, lectures, notes, and DPP questions.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Batch from '../models/Batch';
import ModuleModel from '../models/Module';
import User from '../models/User';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/jaiman';

// ─── Seed Data ────────────────────────────────────────────────────────────────

const BATCHES_DATA = [
  // ──────────────────────────────────────────────────────────
  // 1. A1 Absolute Beginners — PAID (Starting 2 Weeks Free Trial)
  // ──────────────────────────────────────────────────────────
  {
    title: 'A1 German — Absolute Beginners 🇩🇪',
    description: 'Perfect for complete beginners! Learn greetings, numbers, colors, family, and everyday phrases. Week 1 & 2 are 100% FREE to preview!',
    level: 'A1',
    price: 499,
    thumbnail: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=800&q=80',
    isPublished: true,
    startDate: new Date('2026-09-01'),
    endDate: new Date('2026-11-30'),
    enrollmentDeadline: new Date('2026-09-15'),
    maxStudents: 200,
    tags: ['beginners', 'greetings', 'grammar', 'free-trial-week-1-2'],
    modules: [
      {
        title: 'Week 1: Greetings & Introductions (Free Trial)',
        order: 0,
        lectures: [
          { title: 'Hallo! — Your First German Words', videoUrl: 'https://www.youtube.com/watch?v=3H0SK3ZjGOo', duration: 12, isFree: true, order: 0 },
          { title: 'Saying Your Name: Ich heiße...', videoUrl: 'https://www.youtube.com/watch?v=3H0SK3ZjGOo', duration: 15, isFree: true, order: 1 },
          { title: 'Where Are You From? — Ich bin aus...', videoUrl: 'https://www.youtube.com/watch?v=3H0SK3ZjGOo', duration: 18, isFree: true, order: 2 },
          { title: 'Formal vs Informal: Sie vs du', videoUrl: 'https://www.youtube.com/watch?v=3H0SK3ZjGOo', duration: 14, isFree: true, order: 3 },
        ],
        notes: [
          { title: 'Week 1 Vocabulary List — Greetings', content: `# Week 1 Vocabulary\n\n## Greetings\n- Hallo → Hello\n- Guten Morgen → Good morning\n- Guten Tag → Good day\n- Guten Abend → Good evening\n- Tschüss → Bye\n- Auf Wiedersehen → Goodbye (formal)\n\n## Introducing Yourself\n- Ich heiße... → My name is...\n- Ich bin... → I am...\n- Ich komme aus... → I come from...\n- Wie heißen Sie? → What is your name? (formal)\n- Wie heißt du? → What is your name? (informal)\n\n## Countries\n- Deutschland → Germany\n- Indien → India\n- England → England\n- Amerika → America` },
          { title: 'Grammar Note: German Sentence Structure', content: `# German Sentence Structure\n\nIn a simple German sentence:\n**Subject + Verb + Object**\n\nExamples:\n- Ich heiße Anna. (I am called Anna.)\n- Er kommt aus Berlin. (He comes from Berlin.)\n\n⚠️ The verb ALWAYS comes in second position in a normal sentence!` },
        ],
        dpp: [
          { question: 'How do you say "Good morning" in German?', options: ['Guten Abend', 'Guten Morgen', 'Gute Nacht', 'Hallo'], correctAnswer: 'Guten Morgen', explanation: '"Morgen" means morning. "Guten Morgen" is used until around noon.' },
          { question: 'Which sentence means "My name is Jai"?', options: ['Ich bin Jai.', 'Ich heiße Jai.', 'Ich komme Jai.', 'Ich habe Jai.'], correctAnswer: 'Ich heiße Jai.', explanation: '"heiße" comes from the verb "heißen" which means "to be called".' },
          { question: 'What is the formal way to say "you" in German?', options: ['du', 'er', 'Sie', 'wir'], correctAnswer: 'Sie', explanation: '"Sie" (capital S) is the formal "you". "du" is used with friends and family.' },
          { question: 'How do you say "I come from India" in German?', options: ['Ich heiße aus Indien.', 'Ich bin Indien.', 'Ich komme aus Indien.', 'Ich komme Indien.'], correctAnswer: 'Ich komme aus Indien.', explanation: '"aus" means "from". The correct structure is "Ich komme aus + country".' },
        ],
      },
      {
        title: 'Week 2: Numbers, Colors & Days (Free Trial)',
        order: 1,
        lectures: [
          { title: 'Numbers 1–20 in German', videoUrl: 'https://www.youtube.com/watch?v=3H0SK3ZjGOo', duration: 16, isFree: true, order: 0 },
          { title: 'Colors: Farben auf Deutsch', videoUrl: 'https://www.youtube.com/watch?v=3H0SK3ZjGOo', duration: 13, isFree: true, order: 1 },
          { title: 'Days of the Week: Wochentage', videoUrl: 'https://www.youtube.com/watch?v=3H0SK3ZjGOo', duration: 11, isFree: true, order: 2 },
        ],
        notes: [
          { title: 'Numbers 1–100 Reference Sheet', content: `# German Numbers\n\n## 1–10\n1 = ein(s), 2 = zwei, 3 = drei, 4 = vier, 5 = fünf\n6 = sechs, 7 = sieben, 8 = acht, 9 = neun, 10 = zehn\n\n## 11–20\n11 = elf, 12 = zwölf, 13 = dreizehn, 14 = vierzehn, 15 = fünfzehn\n16 = sechzehn, 17 = siebzehn, 18 = achtzehn, 19 = neunzehn, 20 = zwanzig\n\n## Colors (Farben)\n- rot → red\n- blau → blue\n- grün → green\n- gelb → yellow\n- schwarz → black\n- weiß → white\n- grau → grey\n- orange → orange` },
        ],
        dpp: [
          { question: 'What is "5" in German?', options: ['vier', 'sechs', 'fünf', 'sieben'], correctAnswer: 'fünf', explanation: 'fünf = 5. Note the umlaut ü!' },
          { question: 'Which is the German word for "blue"?', options: ['rot', 'blau', 'grün', 'gelb'], correctAnswer: 'blau', explanation: 'blau = blue. rot = red, grün = green, gelb = yellow.' },
          { question: 'How do you say "Wednesday" in German?', options: ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag'], correctAnswer: 'Mittwoch', explanation: 'Mittwoch literally means "midweek". Mon=Montag, Tue=Dienstag, Wed=Mittwoch.' },
          { question: 'What comes after "neunzehn" (19)?', options: ['zwanzig', 'zwölf', 'dreißig', 'zehn'], correctAnswer: 'zwanzig', explanation: 'zwanzig = 20. After neunzehn (19) comes zwanzig (20).' },
        ],
      },
      {
        title: 'Week 3: Family & Daily Routine (Locked — Enroll to Access)',
        order: 2,
        lectures: [
          { title: 'Family Members: Die Familie', videoUrl: 'https://www.youtube.com/watch?v=3H0SK3ZjGOo', duration: 17, isFree: false, order: 0 },
          { title: 'Daily Routine: Mein Alltag', videoUrl: 'https://www.youtube.com/watch?v=3H0SK3ZjGOo', duration: 20, isFree: false, order: 1 },
          { title: 'Telling Time: Wie spät ist es?', videoUrl: 'https://www.youtube.com/watch?v=3H0SK3ZjGOo', duration: 15, isFree: false, order: 2 },
        ],
        notes: [
          { title: 'Family Vocabulary & Time Expressions', content: `# Die Familie (Family)\n\n- der Vater → father\n- die Mutter → mother\n- der Bruder → brother\n- die Schwester → sister\n- der Sohn → son\n- die Tochter → daughter\n- die Großeltern → grandparents\n- der Großvater → grandfather\n- die Großmutter → grandmother\n\n# Time (Uhrzeit)\n- Es ist ein Uhr. → It is 1 o'clock.\n- Es ist halb zwei. → It is half past one (1:30).\n- Es ist Viertel nach drei. → It is quarter past three (3:15).\n- Es ist Viertel vor vier. → It is quarter to four (3:45).` },
        ],
        dpp: [
          { question: 'What is "mother" in German?', options: ['die Schwester', 'die Tochter', 'die Mutter', 'die Großmutter'], correctAnswer: 'die Mutter', explanation: 'die Mutter = mother. All family words with "die" are feminine.' },
          { question: '"Es ist halb drei" means:', options: ['3:00', '3:30', '2:30', '3:15'], correctAnswer: '2:30', explanation: '"halb drei" literally means "half of three" → half of 3 o\'clock = 2:30. Tricky!' },
          { question: 'What is the German word for "grandfather"?', options: ['der Vater', 'der Onkel', 'der Sohn', 'der Großvater'], correctAnswer: 'der Großvater', explanation: 'Großvater = great + father = grandfather. "Groß" means big/great.' },
        ],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────
  // 2. A1 Intensive Batch — PAID
  // ──────────────────────────────────────────────────────────
  {
    title: 'A1 Intensive Crash Course 🚀',
    description: 'Complete A1 German in just 4 weeks! Intensive batch with live doubt sessions, extra practice, and personalised feedback. Week 1 & 2 free trial included.',
    level: 'A1',
    price: 699,
    thumbnail: 'https://images.unsplash.com/photo-1527866959252-deab85ef7d1b?w=800&q=80',
    isPublished: true,
    startDate: new Date('2026-09-05'),
    endDate: new Date('2026-10-05'),
    enrollmentDeadline: new Date('2026-09-04'),
    maxStudents: 30,
    tags: ['intensive', 'fast-track', 'live-sessions', 'A1', 'free-trial-week-1-2'],
    modules: [
      {
        title: 'Module 1: Grammar Foundations (Free Trial)',
        order: 0,
        lectures: [
          { title: 'German Articles: der, die, das', videoUrl: 'https://www.youtube.com/watch?v=3H0SK3ZjGOo', duration: 22, isFree: true, order: 0 },
          { title: 'Nominative Case — Subject of a Sentence', videoUrl: 'https://www.youtube.com/watch?v=3H0SK3ZjGOo', duration: 25, isFree: true, order: 1 },
          { title: 'Accusative Case — Direct Object', videoUrl: 'https://www.youtube.com/watch?v=3H0SK3ZjGOo', duration: 28, isFree: true, order: 2 },
          { title: 'Verb Conjugation: sein, haben, werden', videoUrl: 'https://www.youtube.com/watch?v=3H0SK3ZjGOo', duration: 30, isFree: true, order: 3 },
        ],
        notes: [
          { title: 'German Articles Master Sheet', content: `# German Articles — der, die, das\n\n## The 3 Genders\nGerman has 3 genders: Masculine (der), Feminine (die), Neuter (das)\n\n## Nominative Case (Subject)\n| Gender | Article |\n|---|---|\n| Masculine | der |\n| Feminine | die |\n| Neuter | das |\n| Plural | die |\n\n## Accusative Case (Direct Object)\n| Gender | Article |\n|---|---|\n| Masculine | **den** |\n| Feminine | die |\n| Neuter | das |\n| Plural | die |\n\n⚠️ Only masculine changes in accusative!\n\n## Examples\n- Der Mann kauft den Tisch. (The man buys the table.)\n- Die Frau sieht das Kind. (The woman sees the child.)` },
          { title: 'sein & haben Conjugation Table', content: `# Verb Conjugation\n\n## sein (to be)\n| Pronoun | Form |\n|---|---|\n| ich | bin |\n| du | bist |\n| er/sie/es | ist |\n| wir | sind |\n| ihr | seid |\n| sie/Sie | sind |\n\n## haben (to have)\n| Pronoun | Form |\n|---|---|\n| ich | habe |\n| du | hast |\n| er/sie/es | hat |\n| wir | haben |\n| ihr | habt |\n| sie/Sie | haben |` },
        ],
        dpp: [
          { question: 'What is the article for "Tisch" (table) — masculine?', options: ['die', 'das', 'der', 'den'], correctAnswer: 'der', explanation: 'Tisch is masculine, so it takes "der" in nominative case.' },
          { question: 'In accusative case, masculine "der" becomes:', options: ['die', 'das', 'dem', 'den'], correctAnswer: 'den', explanation: 'Only masculine articles change in accusative: der → den.' },
          { question: '"Wir ___ Studenten." (We are students.)', options: ['bin', 'bist', 'ist', 'sind'], correctAnswer: 'sind', explanation: '"wir" (we) uses "sind". ich=bin, du=bist, er=ist, wir=sind.' },
          { question: '"Er ___ einen Hund." (He has a dog.)', options: ['habe', 'hast', 'hat', 'haben'], correctAnswer: 'hat', explanation: '"er" (he) uses "hat". Merke: ich habe, du hast, er/sie/es hat.' },
          { question: 'Which noun is feminine?', options: ['der Bruder', 'das Kind', 'die Schwester', 'der Mann'], correctAnswer: 'die Schwester', explanation: 'die Schwester (sister) is feminine. der Bruder = masculine, das Kind = neuter, der Mann = masculine.' },
        ],
      },
      {
        title: 'Module 2: Practical Conversations (Locked)',
        order: 1,
        lectures: [
          { title: 'Shopping in Germany: Im Laden', videoUrl: 'https://www.youtube.com/watch?v=3H0SK3ZjGOo', duration: 20, isFree: false, order: 0 },
          { title: 'At a Restaurant: Im Restaurant', videoUrl: 'https://www.youtube.com/watch?v=3H0SK3ZjGOo', duration: 18, isFree: false, order: 1 },
          { title: 'Asking for Directions: Der Weg', videoUrl: 'https://www.youtube.com/watch?v=3H0SK3ZjGOo', duration: 22, isFree: false, order: 2 },
        ],
        notes: [
          { title: 'Shopping & Restaurant Phrases', content: `# Shopping (Einkaufen)\n- Was kostet das? → How much does this cost?\n- Das ist zu teuer. → That is too expensive.\n- Ich nehme das. → I'll take this.\n- Wo ist die Kasse? → Where is the cashier?\n- Haben Sie...? → Do you have...?\n\n# Restaurant (Restaurant)\n- Ich möchte bestellen. → I would like to order.\n- Die Speisekarte, bitte. → The menu, please.\n- Ich bin Vegetarier. → I am vegetarian.\n- Das Essen war lecker! → The food was delicious!\n- Die Rechnung, bitte. → The bill, please.` },
        ],
        dpp: [
          { question: '"Was kostet das?" means:', options: ['What is this?', 'How much does this cost?', 'Where is the cash?', 'Do you have this?'], correctAnswer: 'How much does this cost?', explanation: '"kosten" = to cost. "Was kostet das?" = What does that cost?' },
          { question: 'How do you ask for the bill in German?', options: ['Die Karte, bitte.', 'Das Essen, bitte.', 'Die Rechnung, bitte.', 'Das Geld, bitte.'], correctAnswer: 'Die Rechnung, bitte.', explanation: '"Rechnung" = bill/invoice. "Bitte" = please.' },
          { question: '"Ich nehme das" means:', options: ["I don't want this.", "I'll take this.", 'This is mine.', 'I need this.'], correctAnswer: "I'll take this.", explanation: '"nehmen" = to take. "Ich nehme" = I take/I\'ll take.' },
        ],
      },
      {
        title: 'Module 3: A1 Exam Preparation (Locked)',
        order: 2,
        lectures: [
          { title: 'Goethe A1 Exam Pattern Overview', videoUrl: 'https://www.youtube.com/watch?v=3H0SK3ZjGOo', duration: 25, isFree: false, order: 0 },
          { title: 'Listening Section Strategy', videoUrl: 'https://www.youtube.com/watch?v=3H0SK3ZjGOo', duration: 20, isFree: false, order: 1 },
          { title: 'Writing Section: Formular & Brief', videoUrl: 'https://www.youtube.com/watch?v=3H0SK3ZjGOo', duration: 22, isFree: false, order: 2 },
          { title: 'Speaking Section: Bildbeschreibung', videoUrl: 'https://www.youtube.com/watch?v=3H0SK3ZjGOo', duration: 18, isFree: false, order: 3 },
        ],
        notes: [
          { title: 'Goethe A1 Exam — Complete Guide', content: `# Goethe Zertifikat A1 Exam Guide\n\n## Exam Sections\n1. **Lesen** (Reading) — 25 min, 5 tasks\n2. **Hören** (Listening) — 20 min, 4 tasks\n3. **Schreiben** (Writing) — 20 min, 2 tasks\n4. **Sprechen** (Speaking) — 15 min, 3 tasks\n\n## Pass Marks\n- Total: 100 points\n- Pass: 60 points (60%)\n- Each section: 25 points\n\n## Writing Tips\n- Fill forms correctly (Name, Adresse, Datum)\n- Write short messages (25–30 words)\n- Use standard phrases\n\n## Speaking Tips\n- Introduce yourself clearly\n- Use simple sentences\n- Don't panic — examiners are friendly!` },
        ],
        dpp: [
          { question: 'How many sections are in the Goethe A1 exam?', options: ['2', '3', '4', '5'], correctAnswer: '4', explanation: 'Lesen, Hören, Schreiben, Sprechen — 4 sections, 25 points each = 100 total.' },
          { question: 'What is the passing percentage for Goethe A1?', options: ['50%', '55%', '60%', '70%'], correctAnswer: '60%', explanation: 'You need 60 out of 100 points to pass the Goethe A1 exam.' },
          { question: 'How long is the Hören (Listening) section?', options: ['15 min', '20 min', '25 min', '30 min'], correctAnswer: '20 min', explanation: 'Hören section is 20 minutes with 4 tasks.' },
        ],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────
  // 3. A2 Batch — PAID (₹799)
  // ──────────────────────────────────────────────────────────
  {
    title: 'A2 German — Elementary Level 📚',
    description: 'Take your German to the next level! A2 covers past tense, modal verbs, shopping, travel, and health vocabulary. For students who have completed A1.',
    level: 'A2',
    price: 799,
    thumbnail: 'https://images.unsplash.com/photo-1509213398764-87ed14b1cfa6?w=800&q=80',
    isPublished: true,
    startDate: new Date('2026-09-10'),
    endDate: new Date('2026-12-10'),
    enrollmentDeadline: new Date('2026-09-25'),
    maxStudents: 150,
    tags: ['A2', 'elementary', 'past-tense', 'modal-verbs'],
    modules: [
      {
        title: 'Module 1: Past Tense (Perfekt)',
        order: 0,
        lectures: [
          { title: 'Introduction to Perfekt Tense', videoUrl: 'https://www.youtube.com/watch?v=3H0SK3ZjGOo', duration: 25, isFree: true, order: 0 },
          { title: 'Regular Verbs in Perfekt: ge...t', videoUrl: 'https://www.youtube.com/watch?v=3H0SK3ZjGOo', duration: 22, isFree: false, order: 1 },
          { title: 'Irregular Verbs in Perfekt: ge...en', videoUrl: 'https://www.youtube.com/watch?v=3H0SK3ZjGOo', duration: 28, isFree: false, order: 2 },
          { title: 'haben vs sein as Auxiliary Verbs', videoUrl: 'https://www.youtube.com/watch?v=3H0SK3ZjGOo', duration: 20, isFree: false, order: 3 },
        ],
        notes: [
          { title: 'Perfekt Tense Formation Rules', content: `# Perfekt Tense in German\n\n## Formula\n**haben/sein + Partizip II (Past Participle)**\n\n## Regular Verbs (schwache Verben)\nFormula: ge + stem + t\n- machen → gemacht\n- kaufen → gekauft\n- spielen → gespielt\n- lernen → gelernt\n\n## Irregular Verbs (starke Verben)\nFormula: ge + stem (changed!) + en\n- gehen → gegangen\n- kommen → gekommen\n- essen → gegessen\n- trinken → getrunken\n\n## When to use "sein" instead of "haben"\nUse SEIN with:\n1. Verbs of movement (gehen, fahren, fliegen)\n2. Verbs of change of state (werden, wachsen)\n3. sein, bleiben, passieren\n\nExamples:\n- Ich habe gegessen. (I have eaten.)\n- Ich bin gegangen. (I have gone.)` },
        ],
        dpp: [
          { question: 'What is the Partizip II of "machen"?', options: ['machen', 'gemacht', 'gegemacht', 'machte'], correctAnswer: 'gemacht', explanation: 'Regular verbs: ge + stem + t. machen → ge + mach + t = gemacht.' },
          { question: '"Ich ___ gestern ins Kino gegangen." (I went to the cinema yesterday.)', options: ['habe', 'hat', 'bin', 'ist'], correctAnswer: 'bin', explanation: '"gehen" (movement verb) uses "sein" as auxiliary. Ich bin gegangen.' },
          { question: 'Which verb uses "haben" in Perfekt?', options: ['gehen', 'fahren', 'fliegen', 'essen'], correctAnswer: 'essen', explanation: '"essen" (to eat) is not a movement verb, so it uses "haben". Ich habe gegessen.' },
          { question: 'What is the Partizip II of "trinken"?', options: ['getrinkt', 'trinkte', 'getrunken', 'trunken'], correctAnswer: 'getrunken', explanation: 'trinken is irregular: ge + trunk + en = getrunken. (trinken → trank → getrunken)' },
        ],
      },
      {
        title: 'Module 2: Modal Verbs',
        order: 1,
        lectures: [
          { title: 'Können, Müssen, Wollen — The Big 3', videoUrl: 'https://www.youtube.com/watch?v=3H0SK3ZjGOo', duration: 24, isFree: true, order: 0 },
          { title: 'Dürfen, Sollen, Mögen — The Next 3', videoUrl: 'https://www.youtube.com/watch?v=3H0SK3ZjGOo', duration: 22, isFree: false, order: 1 },
          { title: 'Modal Verbs in Sentences', videoUrl: 'https://www.youtube.com/watch?v=3H0SK3ZjGOo', duration: 20, isFree: false, order: 2 },
        ],
        notes: [
          { title: 'Modal Verbs Quick Reference', content: `# Modal Verbs (Modalverben)\n\n| Verb | Meaning | ich form | er/sie form |\n|---|---|---|---|\n| können | can/to be able to | kann | kann |\n| müssen | must/have to | muss | muss |\n| wollen | want to | will | will |\n| dürfen | may/allowed to | darf | darf |\n| sollen | should/supposed to | soll | soll |\n| mögen | like | mag | mag |\n\n## Sentence Structure\nModal verb takes position 2, infinitive goes to the END!\n\n**Ich kann Deutsch sprechen.** (I can speak German.)\n**Du musst jetzt gehen.** (You must go now.)\n**Er will Pizza essen.** (He wants to eat pizza.)` },
        ],
        dpp: [
          { question: '"Ich ___ Deutsch sprechen." (I can speak German.)', options: ['will', 'muss', 'kann', 'darf'], correctAnswer: 'kann', explanation: '"können" = can/to be able to. ich kann = I can.' },
          { question: 'Where does the infinitive go in a modal verb sentence?', options: ['At the beginning', 'After the subject', 'At the end', 'After the modal verb'], correctAnswer: 'At the end', explanation: 'In German: Subject + Modal Verb + ... + Infinitive. The infinitive always goes to the END!' },
          { question: '"Du ___ nicht rauchen." (You may not smoke.)', options: ['kannst', 'musst', 'darfst', 'sollst'], correctAnswer: 'darfst', explanation: '"dürfen" = may/allowed to. "Du darfst nicht" = You are not allowed to.' },
        ],
      },
      {
        title: 'Module 3: Travel & Health',
        order: 2,
        lectures: [
          { title: 'Booking a Hotel: Ein Zimmer reservieren', videoUrl: 'https://www.youtube.com/watch?v=3H0SK3ZjGOo', duration: 18, isFree: false, order: 0 },
          { title: 'At the Doctor: Beim Arzt', videoUrl: 'https://www.youtube.com/watch?v=3H0SK3ZjGOo', duration: 20, isFree: false, order: 1 },
          { title: 'German Transport: Bahn, Bus, U-Bahn', videoUrl: 'https://www.youtube.com/watch?v=3H0SK3ZjGOo', duration: 16, isFree: false, order: 2 },
        ],
        notes: [
          { title: 'Travel & Health Vocabulary', content: `# Travel (Reise)\n- das Ticket → ticket\n- der Bahnhof → train station\n- der Flughafen → airport\n- das Hotel → hotel\n- Ich möchte ein Zimmer buchen. → I would like to book a room.\n- Hin und zurück → round trip\n- Einmal nach München, bitte. → One ticket to Munich, please.\n\n# Health (Gesundheit)\n- der Arzt / die Ärztin → doctor\n- das Krankenhaus → hospital\n- die Apotheke → pharmacy\n- Mir geht es nicht gut. → I don't feel well.\n- Ich habe Kopfschmerzen. → I have a headache.\n- Ich habe Fieber. → I have a fever.\n- Wo tut es weh? → Where does it hurt?` },
        ],
        dpp: [
          { question: 'What is "Bahnhof" in English?', options: ['Airport', 'Bus stop', 'Train station', 'Hotel'], correctAnswer: 'Train station', explanation: '"Bahn" = train/railway. "Bahnhof" = train station (literally "train yard").' },
          { question: '"Mir geht es nicht gut" means:', options: ["I don't like it here.", 'I am not doing well.', 'I am not going.', "It's not good for me."], correctAnswer: 'I am not doing well.', explanation: '"Wie geht es Ihnen?" = How are you? "Mir geht es gut" = I am doing well. "nicht" = not.' },
          { question: 'Which phrase means "I have a headache"?', options: ['Ich habe Fieber.', 'Ich habe Hunger.', 'Ich habe Kopfschmerzen.', 'Ich habe Bauchschmerzen.'], correctAnswer: 'Ich habe Kopfschmerzen.', explanation: '"Kopf" = head, "Schmerzen" = pain. Kopfschmerzen = headache.' },
        ],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────
  // 4. B1 Batch — PAID
  // ──────────────────────────────────────────────────────────
  {
    title: 'B1 German — Intermediate Mastery 🏆',
    description: 'Reach B1 and unlock 90% of everyday German conversations! This premium batch covers Konjunktiv II, passive voice, complex grammar, and prepares you for the Goethe B1 certificate.',
    level: 'B1',
    price: 999,
    thumbnail: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800&q=80',
    isPublished: true,
    startDate: new Date('2026-09-15'),
    endDate: new Date('2026-12-31'),
    enrollmentDeadline: new Date('2026-09-14'),
    maxStudents: 50,
    tags: ['B1', 'intermediate', 'Konjunktiv', 'passive', 'Goethe'],
    modules: [
      {
        title: 'Module 1: Konjunktiv II (Subjunctive)',
        order: 0,
        lectures: [
          { title: 'What is Konjunktiv II and Why It Matters', videoUrl: 'https://www.youtube.com/watch?v=3H0SK3ZjGOo', duration: 20, isFree: true, order: 0 },
          { title: 'Forming Konjunktiv II: würde + Infinitiv', videoUrl: 'https://www.youtube.com/watch?v=3H0SK3ZjGOo', duration: 28, isFree: false, order: 1 },
          { title: 'Polite Requests with Konjunktiv II', videoUrl: 'https://www.youtube.com/watch?v=3H0SK3ZjGOo', duration: 22, isFree: false, order: 2 },
          { title: 'Unreal Conditionals: Wenn ich... wäre', videoUrl: 'https://www.youtube.com/watch?v=3H0SK3ZjGOo', duration: 30, isFree: false, order: 3 },
        ],
        notes: [
          { title: 'Konjunktiv II — Complete Reference', content: `# Konjunktiv II\n\n## Uses\n1. Polite requests → Könnten Sie mir helfen?\n2. Unreal conditions → Wenn ich reich wäre...\n3. Wishes → Ich wäre gern ein Vogel.\n4. Indirect speech → Er sagte, er käme morgen.\n\n## Formula\n**würde + Infinitiv** (most common)\n- Ich würde gern reisen. (I would like to travel.)\n- Er würde das kaufen. (He would buy that.)\n\n## Important Irregular Forms (must memorize!)\n| Verb | Konjunktiv II |\n|---|---|\n| sein | wäre |\n| haben | hätte |\n| werden | würde |\n| können | könnte |\n| müssen | müsste |\n| dürfen | dürfte |\n| sollen | sollte |\n| wollen | wollte |\n\n## Conditional Sentences\nWenn + Konjunktiv II, ... würde...\n- Wenn ich Geld hätte, würde ich reisen. (If I had money, I would travel.)\n- Wenn es nicht regnete, würden wir spazieren gehen. (If it weren't raining, we would go for a walk.)` },
        ],
        dpp: [
          { question: 'Which is the Konjunktiv II form of "sein"?', options: ['sei', 'seien', 'wäre', 'gewesen'], correctAnswer: 'wäre', explanation: '"sein" → Konjunktiv II = "wäre". This is one of the most important irregular forms!' },
          { question: '"Könnten Sie mir helfen?" translates to:', options: ['Can you help me?', 'Could you help me? (polite)', 'You should help me.', 'Help me please!'], correctAnswer: 'Could you help me? (polite)', explanation: '"könnten" is Konjunktiv II of "können". It makes requests more polite than "können".' },
          { question: '"Wenn ich Zeit ___, würde ich Deutsch lernen."', options: ['hätte', 'habe', 'hatte', 'haben'], correctAnswer: 'hätte', explanation: '"hätte" is Konjunktiv II of "haben". Conditional sentences use Konjunktiv II.' },
          { question: 'What is the Konjunktiv II of "können"?', options: ['kann', 'konnte', 'könnte', 'gekonnt'], correctAnswer: 'könnte', explanation: '"können" → Konjunktiv II = "könnte". Notice the umlaut added to the Präteritum form.' },
        ],
      },
      {
        title: 'Module 2: Passive Voice (Passiv)',
        order: 1,
        lectures: [
          { title: 'Introduction to German Passive Voice', videoUrl: 'https://www.youtube.com/watch?v=3H0SK3ZjGOo', duration: 22, isFree: false, order: 0 },
          { title: 'Vorgangspassiv: werden + Partizip II', videoUrl: 'https://www.youtube.com/watch?v=3H0SK3ZjGOo', duration: 26, isFree: false, order: 1 },
          { title: 'Zustandspassiv: sein + Partizip II', videoUrl: 'https://www.youtube.com/watch?v=3H0SK3ZjGOo', duration: 20, isFree: false, order: 2 },
        ],
        notes: [
          { title: 'Passive Voice Formation', content: `# Passiv (Passive Voice)\n\n## Vorgangspassiv (Process Passive)\nFormula: **werden + Partizip II**\n\nPresent: Das Haus wird gebaut. (The house is being built.)\nPast: Das Haus wurde gebaut. (The house was built.)\nPerfekt: Das Haus ist gebaut worden. (The house has been built.)\n\n## Zustandspassiv (State Passive)\nFormula: **sein + Partizip II**\n\nDas Haus ist gebaut. (The house is built — result/state)\n\n## Active → Passive\nActive: Die Studenten lesen das Buch.\nPassive: Das Buch wird von den Studenten gelesen.\n\n⚠️ The agent (doer) is introduced with "von" + Dativ.` },
        ],
        dpp: [
          { question: 'How do you form the present passive in German?', options: ['sein + Infinitiv', 'werden + Partizip II', 'haben + Partizip II', 'sein + Partizip II'], correctAnswer: 'werden + Partizip II', explanation: 'Vorgangspassiv (process passive) = werden + Partizip II.' },
          { question: '"Das Buch ___ gelesen." (The book is being read.)', options: ['ist', 'hat', 'wird', 'wurde'], correctAnswer: 'wird', explanation: 'Present tense passive uses "wird" (3rd person singular of werden).' },
          { question: '"Das Fenster ist geöffnet." This is:', options: ['Vorgangspassiv', 'Zustandspassiv', 'Konjunktiv II', 'Active voice'], correctAnswer: 'Zustandspassiv', explanation: 'sein + Partizip II = Zustandspassiv (state passive). It describes a state, not a process.' },
        ],
      },
      {
        title: 'Module 3: B1 Exam Preparation',
        order: 2,
        lectures: [
          { title: 'Goethe B1 Exam Structure', videoUrl: 'https://www.youtube.com/watch?v=3H0SK3ZjGOo', duration: 25, isFree: false, order: 0 },
          { title: 'Writing a Formal Letter/Email at B1', videoUrl: 'https://www.youtube.com/watch?v=3H0SK3ZjGOo', duration: 30, isFree: false, order: 1 },
          { title: 'B1 Speaking: Discussing a Topic', videoUrl: 'https://www.youtube.com/watch?v=3H0SK3ZjGOo', duration: 25, isFree: false, order: 2 },
          { title: 'B1 Mock Test — Full Walkthrough', videoUrl: 'https://www.youtube.com/watch?v=3H0SK3ZjGOo', duration: 60, isFree: false, order: 3 },
        ],
        notes: [
          { title: 'B1 Exam Strategy Guide', content: `# Goethe Zertifikat B1 Exam Guide\n\n## Sections\n1. **Lesen** (Reading) — 65 min, 5 tasks, 45 points\n2. **Hören** (Listening) — 40 min, 4 tasks, 45 points\n3. **Schreiben** (Writing) — 60 min, 2 tasks, 30 points\n4. **Sprechen** (Speaking) — 15 min, 3 tasks, 30 points\n\n## Total: 150 points, Pass = 60% (90 points)\n\n## Writing Tips for B1\n- Task 1: Write about a personal experience (80 words)\n- Task 2: Write a formal letter/email (100 words)\n- Use connectors: jedoch, trotzdem, außerdem, deshalb\n- Check gender and case!\n\n## Useful B1 Connectors\n- deshalb/deswegen → therefore\n- trotzdem → nevertheless\n- jedoch → however\n- außerdem → furthermore\n- obwohl → although\n- damit → so that` },
        ],
        dpp: [
          { question: 'What is the passing score for Goethe B1?', options: ['60 points', '75 points', '90 points', '100 points'], correctAnswer: '90 points', explanation: 'Goethe B1 has 150 total points. 60% = 90 points needed to pass.' },
          { question: 'Which connector means "however" in German?', options: ['deshalb', 'außerdem', 'damit', 'jedoch'], correctAnswer: 'jedoch', explanation: '"jedoch" = however/nevertheless. deshalb = therefore, außerdem = furthermore.' },
          { question: 'How long is the B1 Schreiben (Writing) section?', options: ['40 min', '50 min', '60 min', '65 min'], correctAnswer: '60 min', explanation: 'Schreiben section is 60 minutes for 2 tasks at B1 level.' },
          { question: '"obwohl" introduces a:', options: ['reason', 'result', 'concession/contrast', 'purpose'], correctAnswer: 'concession/contrast', explanation: '"obwohl" = although/even though. It introduces a subordinate clause showing contrast.' },
        ],
      },
    ],
  },
];

// ─── Main Seed Function ───────────────────────────────────────────────────────

const seedBatches = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected!\n');

    // Find an admin/teacher user to be the teacher
    let teacher = await User.findOne({ role: { $in: ['admin', 'teacher'] } });
    if (!teacher) {
      // fallback: use the first user
      teacher = await User.findOne({});
    }
    if (!teacher) {
      console.error('❌ No users found in DB. Please register at least one user first!');
      process.exit(1);
    }
    console.log(`👨‍🏫 Using teacher: ${teacher.name} (${teacher.role})\n`);

    // Delete existing seeded batches (optional — comment out to keep)
    const existingCount = await Batch.countDocuments({});
    if (existingCount > 0) {
      console.log(`🗑️  Deleting ${existingCount} existing batches...`);
      const existing = await Batch.find({});
      const ids = existing.map((b) => b._id);
      await ModuleModel.deleteMany({ batch: { $in: ids } });
      await Batch.deleteMany({});
      console.log('✅ Cleared.\n');
    }

    // Seed each batch
    for (const batchData of BATCHES_DATA) {
      const { modules: modulesData, ...batchFields } = batchData;

      // Create batch
      const batch = await Batch.create({
        ...(batchData as any),
        teacher: teacher._id,
        enrolledStudents: [],
        modules: [],
        announcements: [
          {
            title: '🎉 Welcome to the Batch!',
            body: `Welcome everyone! We are excited to have you here. Please go through all the modules systematically. Feel free to use the AI Tutor for any doubts. Viel Erfolg! 🇩🇪`,
            createdAt: new Date(),
          },
        ],
      });

      // Create modules
      const moduleIds = [];
      for (const modData of modulesData) {
        const { lectures, notes, dpp, ...modFields } = modData;
        const mod = await ModuleModel.create({
          batch: (batch as any)._id,
          ...modFields,
          lectures,
          notes,
          dpp,
        });
        moduleIds.push(mod._id);
      }

      // Update batch with module refs
      await Batch.findByIdAndUpdate((batch as any)._id, { modules: moduleIds });

      const icon = batchFields.price === 0 ? '🆓' : '💎';
      console.log(`${icon} Created: "${(batch as any).title}" [${(batch as any).level}] — ${modulesData.length} modules, ${modulesData.reduce((a, m) => a + m.lectures.length, 0)} lectures`);
    }

    console.log('\n✨ Seeding complete! 4 batches created:\n');
    const all = await Batch.find({}).select('title level price isPublished');
    all.forEach((b) => {
      console.log(`  • ${b.title} [${b.level}] — ${b.price === 0 ? 'FREE' : '₹' + b.price} — ${b.isPublished ? 'Published ✅' : 'Draft'}`);
    });

  } catch (error) {
    console.error('❌ Seed failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB.');
    process.exit(0);
  }
};

seedBatches();
