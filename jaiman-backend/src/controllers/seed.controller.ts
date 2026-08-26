import { Request, Response } from 'express';
import Batch from '../models/Batch';
import ModuleModel from '../models/Module';
import User from '../models/User';

/**
 * POST /api/batches/seed
 * Admin-only endpoint to seed default German batches.
 * Safe to call multiple times — clears old seeded batches first.
 */const BATCHES_DATA = [
  // ── 1. A1 Absolute Beginners — PAID (Week 1 & 2 Free Trial) ─────────────────
  {
    title: 'A1 German — Absolute Beginners 🇩🇪',
    description: 'Perfect for complete beginners! Learn greetings, numbers, colors, family, and everyday phrases. Week 1 & 2 are 100% FREE to preview!',
    level: 'A1',
    price: 499,
    thumbnail: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=800&q=80',
    isPublished: true,
    tags: ['beginners', 'greetings', 'grammar', '2-week-free-trial'],
    announcements: [{ title: '🎉 Welcome to A1!', body: 'Welcome to A1 German! Week 1 & 2 are free preview. Viel Erfolg! 🇩🇪', createdAt: new Date() }],
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
          { title: 'Week 1 Vocabulary — Greetings', content: '# Week 1 Vocabulary\n\n## Greetings\n- Hallo → Hello\n- Guten Morgen → Good morning\n- Guten Tag → Good day\n- Guten Abend → Good evening\n- Tschüss → Bye\n- Auf Wiedersehen → Goodbye (formal)\n\n## Introducing Yourself\n- Ich heiße... → My name is...\n- Ich bin... → I am...\n- Ich komme aus... → I come from...\n- Wie heißen Sie? → What is your name? (formal)\n- Wie heißt du? → What is your name? (informal)' },
          { title: 'Grammar: German Sentence Structure', content: '# German Sentence Structure\n\nIn a simple German sentence:\n**Subject + Verb + Object**\n\n⚠️ The verb ALWAYS comes in second position!\n\nExamples:\n- Ich heiße Anna.\n- Er kommt aus Berlin.' },
        ],
        dpp: [
          { question: 'How do you say "Good morning" in German?', options: ['Guten Abend', 'Guten Morgen', 'Gute Nacht', 'Hallo'], correctAnswer: 'Guten Morgen', explanation: '"Morgen" means morning. Used until around noon.' },
          { question: 'Which sentence means "My name is Jai"?', options: ['Ich bin Jai.', 'Ich heiße Jai.', 'Ich komme Jai.', 'Ich habe Jai.'], correctAnswer: 'Ich heiße Jai.', explanation: '"heiße" comes from "heißen" which means "to be called".' },
          { question: 'What is the formal way to say "you" in German?', options: ['du', 'er', 'Sie', 'wir'], correctAnswer: 'Sie', explanation: '"Sie" (capital S) is the formal "you". "du" is used with friends and family.' },
          { question: 'How do you say "I come from India" in German?', options: ['Ich heiße aus Indien.', 'Ich bin Indien.', 'Ich komme aus Indien.', 'Ich komme Indien.'], correctAnswer: 'Ich komme aus Indien.', explanation: '"aus" means "from". Structure: Ich komme aus + country.' },
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
        notes: [{ title: 'Numbers 1–20 & Colors Reference', content: '# German Numbers\n## 1–10\n1=ein(s), 2=zwei, 3=drei, 4=vier, 5=fünf\n6=sechs, 7=sieben, 8=acht, 9=neun, 10=zehn\n\n## 11–20\n11=elf, 12=zwölf, 13=dreizehn...20=zwanzig\n\n# Colors (Farben)\n- rot → red\n- blau → blue\n- grün → green\n- gelb → yellow\n- schwarz → black\n- weiß → white' }],
        dpp: [
          { question: 'What is "5" in German?', options: ['vier', 'sechs', 'fünf', 'sieben'], correctAnswer: 'fünf', explanation: 'fünf = 5. Note the umlaut ü!' },
          { question: 'Which is the German word for "blue"?', options: ['rot', 'blau', 'grün', 'gelb'], correctAnswer: 'blau', explanation: 'blau = blue. rot = red, grün = green, gelb = yellow.' },
          { question: 'How do you say "Wednesday" in German?', options: ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag'], correctAnswer: 'Mittwoch', explanation: 'Mittwoch literally means "midweek".' },
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
        notes: [{ title: 'Family & Time Vocabulary', content: '# Die Familie\n- der Vater → father\n- die Mutter → mother\n- der Bruder → brother\n- die Schwester → sister\n- der Sohn → son\n- die Tochter → daughter\n\n# Time\n- Es ist ein Uhr. → 1:00\n- Es ist halb zwei. → 1:30\n- Es ist Viertel nach drei. → 3:15' }],
        dpp: [
          { question: 'What is "mother" in German?', options: ['die Schwester', 'die Tochter', 'die Mutter', 'die Großmutter'], correctAnswer: 'die Mutter', explanation: 'die Mutter = mother.' },
          { question: '"Es ist halb drei" means:', options: ['3:00', '3:30', '2:30', '3:15'], correctAnswer: '2:30', explanation: '"halb drei" = half of 3 = 2:30. Tricky German time!' },
          { question: 'What is the German word for "grandfather"?', options: ['der Vater', 'der Onkel', 'der Sohn', 'der Großvater'], correctAnswer: 'der Großvater', explanation: 'Großvater = great + father = grandfather.' },
        ],
      },
    ],
  },

  // ── 2. A1 Intensive — PAID ───────────────────────────────────────────────────
  {
    title: 'A1 Intensive Crash Course 🚀',
    description: 'Complete A1 German in just 4 weeks! Intensive batch with extra practice and personalised feedback. Week 1 & 2 free trial included.',
    level: 'A1',
    price: 699,
    thumbnail: 'https://images.unsplash.com/photo-1527866959252-deab85ef7d1b?w=800&q=80',
    isPublished: true,
    tags: ['intensive', 'fast-track', 'A1', '2-week-free-trial'],
    announcements: [{ title: '🚀 Batch Started!', body: 'Welcome to the A1 Intensive batch! We will be covering the full A1 curriculum in 4 weeks. Prepare to work hard. Viel Erfolg!', createdAt: new Date() }],
    modules: [
      {
        title: 'Module 1: Grammar Foundations (Free Trial)',
        order: 0,
        lectures: [
          { title: 'German Articles: der, die, das', videoUrl: 'https://www.youtube.com/watch?v=3H0SK3ZjGOo', duration: 22, isFree: true, order: 0 },
          { title: 'Nominative Case — Subject of a Sentence', videoUrl: 'https://www.youtube.com/watch?v=3H0SK3ZjGOo', duration: 25, isFree: true, order: 1 },
          { title: 'Accusative Case — Direct Object', videoUrl: 'https://www.youtube.com/watch?v=3H0SK3ZjGOo', duration: 28, isFree: true, order: 2 },
          { title: 'Verb Conjugation: sein & haben', videoUrl: 'https://www.youtube.com/watch?v=3H0SK3ZjGOo', duration: 30, isFree: true, order: 3 },
        ],
        notes: [
          { title: 'German Articles Master Sheet', content: '# German Articles — der, die, das\n\n## Nominative (Subject)\n| Gender | Article |\n|---|---|\n| Masculine | der |\n| Feminine | die |\n| Neuter | das |\n| Plural | die |\n\n## Accusative (Object)\n| Gender | Article |\n|---|---|\n| Masculine | **den** |\n| Feminine | die |\n| Neuter | das |\n| Plural | die |\n\n⚠️ Only masculine changes in accusative!' },
          { title: 'sein & haben Conjugation', content: '# sein (to be)\n- ich bin\n- du bist\n- er/sie/es ist\n- wir sind\n- ihr seid\n- sie/Sie sind\n\n# haben (to have)\n- ich habe\n- du hast\n- er/sie/es hat\n- wir haben\n- ihr habt\n- sie/Sie haben' },
        ],
        dpp: [
          { question: 'What is the article for "Tisch" (table) — masculine?', options: ['die', 'das', 'der', 'den'], correctAnswer: 'der', explanation: 'Tisch is masculine → "der" in nominative.' },
          { question: 'In accusative case, masculine "der" becomes:', options: ['die', 'das', 'dem', 'den'], correctAnswer: 'den', explanation: 'Only masculine changes in accusative: der → den.' },
          { question: '"Wir ___ Studenten."', options: ['bin', 'bist', 'ist', 'sind'], correctAnswer: 'sind', explanation: '"wir" uses "sind".' },
          { question: '"Er ___ einen Hund."', options: ['habe', 'hast', 'hat', 'haben'], correctAnswer: 'hat', explanation: '"er/sie/es" uses "hat".' },
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
        notes: [{ title: 'Shopping & Restaurant Phrases', content: '# Shopping\n- Was kostet das? → How much does this cost?\n- Das ist zu teuer. → That is too expensive.\n- Ich nehme das. → I\'ll take this.\n\n# Restaurant\n- Die Speisekarte, bitte. → The menu, please.\n- Ich bin Vegetarier. → I am vegetarian.\n- Die Rechnung, bitte. → The bill, please.' }],
        dpp: [
          { question: '"Was kostet das?" means:', options: ['What is this?', 'How much does this cost?', 'Where is the cash?', 'Do you have this?'], correctAnswer: 'How much does this cost?', explanation: '"kosten" = to cost.' },
          { question: 'How do you ask for the bill in German?', options: ['Die Karte, bitte.', 'Das Essen, bitte.', 'Die Rechnung, bitte.', 'Das Geld, bitte.'], correctAnswer: 'Die Rechnung, bitte.', explanation: '"Rechnung" = bill/invoice.' },
        ],
      },
      {
        title: 'Module 3: A1 Exam Prep (Locked)',
        order: 2,
        lectures: [
          { title: 'Goethe A1 Exam Pattern Overview', videoUrl: 'https://www.youtube.com/watch?v=3H0SK3ZjGOo', duration: 25, isFree: false, order: 0 },
          { title: 'Listening Section Strategy', videoUrl: 'https://www.youtube.com/watch?v=3H0SK3ZjGOo', duration: 20, isFree: false, order: 1 },
          { title: 'Speaking Section: Bildbeschreibung', videoUrl: 'https://www.youtube.com/watch?v=3H0SK3ZjGOo', duration: 18, isFree: false, order: 2 },
        ],
        notes: [{ title: 'Goethe A1 Exam Guide', content: '# Goethe Zertifikat A1\n\n## Sections\n1. Lesen (Reading) — 25 min\n2. Hören (Listening) — 20 min\n3. Schreiben (Writing) — 20 min\n4. Sprechen (Speaking) — 15 min\n\n## Pass: 60/100 points (60%)' }],
        dpp: [
          { question: 'How many sections are in the Goethe A1 exam?', options: ['2', '3', '4', '5'], correctAnswer: '4', explanation: 'Lesen, Hören, Schreiben, Sprechen — 4 sections.' },
          { question: 'What is the passing percentage for Goethe A1?', options: ['50%', '55%', '60%', '70%'], correctAnswer: '60%', explanation: '60 out of 100 points needed to pass.' },
        ],
      },
    ],
  },

  // ── 3. A2 Elementary — PAID (₹799) ───────────────────────────────────────────
  {
    title: 'A2 German — Elementary Level 📚',
    description: 'Take your German to the next level! A2 covers past tense (Perfekt), modal verbs, shopping, travel, and health vocabulary.',
    level: 'A2',
    price: 799,
    thumbnail: 'https://images.unsplash.com/photo-1509213398764-87ed14b1cfa6?w=800&q=80',
    isPublished: true,
    tags: ['A2', 'elementary', 'past-tense', 'modal-verbs'],
    announcements: [{ title: '📚 A2 Batch Launched!', body: 'Welcome to A2! Make sure you have completed A1 basics before starting. This batch will take you through the Perfekt tense, modal verbs, and practical German.', createdAt: new Date() }],
    modules: [
      {
        title: 'Module 1: Past Tense (Perfekt)',
        order: 0,
        lectures: [
          { title: 'Introduction to Perfekt Tense', videoUrl: 'https://www.youtube.com/watch?v=3H0SK3ZjGOo', duration: 25, isFree: false, order: 0 },
          { title: 'Regular Verbs: ge...t', videoUrl: 'https://www.youtube.com/watch?v=3H0SK3ZjGOo', duration: 22, isFree: false, order: 1 },
          { title: 'Irregular Verbs: ge...en', videoUrl: 'https://www.youtube.com/watch?v=3H0SK3ZjGOo', duration: 28, isFree: false, order: 2 },
          { title: 'haben vs sein as Auxiliary Verbs', videoUrl: 'https://www.youtube.com/watch?v=3H0SK3ZjGOo', duration: 20, isFree: false, order: 3 },
        ],
        notes: [{ title: 'Perfekt Tense Formation Rules', content: '# Perfekt Tense\n\n## Formula: haben/sein + Partizip II\n\n## Regular Verbs\nge + stem + t\n- machen → gemacht\n- kaufen → gekauft\n\n## Irregular Verbs\nge + changed stem + en\n- gehen → gegangen\n- essen → gegessen\n\n## Use "sein" with:\n- Movement verbs (gehen, fahren)\n- State change verbs (werden)\n\nExamples:\n- Ich habe gegessen.\n- Ich bin gegangen.' }],
        dpp: [
          { question: 'What is the Partizip II of "machen"?', options: ['machen', 'gemacht', 'gegemacht', 'machte'], correctAnswer: 'gemacht', explanation: 'Regular: ge + mach + t = gemacht.' },
          { question: '"Ich ___ gestern ins Kino gegangen."', options: ['habe', 'hat', 'bin', 'ist'], correctAnswer: 'bin', explanation: '"gehen" (movement) uses "sein". Ich bin gegangen.' },
          { question: 'What is the Partizip II of "trinken"?', options: ['getrinkt', 'trinkte', 'getrunken', 'trunken'], correctAnswer: 'getrunken', explanation: 'trinken is irregular: ge + trunk + en = getrunken.' },
          { question: 'Which verb uses "haben" in Perfekt?', options: ['gehen', 'fahren', 'fliegen', 'essen'], correctAnswer: 'essen', explanation: '"essen" is not a movement verb → uses "haben". Ich habe gegessen.' },
        ],
      },
      {
        title: 'Module 2: Modal Verbs',
        order: 1,
        lectures: [
          { title: 'Können, Müssen, Wollen — The Big 3', videoUrl: 'https://www.youtube.com/watch?v=3H0SK3ZjGOo', duration: 24, isFree: false, order: 0 },
          { title: 'Dürfen, Sollen, Mögen', videoUrl: 'https://www.youtube.com/watch?v=3H0SK3ZjGOo', duration: 22, isFree: false, order: 1 },
          { title: 'Modal Verbs in Sentences', videoUrl: 'https://www.youtube.com/watch?v=3H0SK3ZjGOo', duration: 20, isFree: false, order: 2 },
        ],
        notes: [{ title: 'Modal Verbs Quick Reference', content: '# Modal Verbs\n\n| Verb | Meaning | ich | er/sie/es |\n|---|---|---|---|\n| können | can | kann | kann |\n| müssen | must | muss | muss |\n| wollen | want | will | will |\n| dürfen | may | darf | darf |\n| sollen | should | soll | soll |\n\n## Structure\nSubject + Modal + ... + **Infinitiv (end)**\n\n- Ich kann Deutsch sprechen.\n- Du musst jetzt gehen.' }],
        dpp: [
          { question: '"Ich ___ Deutsch sprechen." (I can speak German.)', options: ['will', 'muss', 'kann', 'darf'], correctAnswer: 'kann', explanation: '"können" = can. ich kann = I can.' },
          { question: 'Where does the infinitive go in a modal sentence?', options: ['Beginning', 'After subject', 'At the end', 'After modal'], correctAnswer: 'At the end', explanation: 'Modal verb is position 2, infinitive goes to the END!' },
          { question: '"Du ___ nicht rauchen." (You may not smoke.)', options: ['kannst', 'musst', 'darfst', 'sollst'], correctAnswer: 'darfst', explanation: '"dürfen" = may/allowed to. Du darfst nicht = You are not allowed to.' },
        ],
      },
      {
        title: 'Module 3: Travel & Health',
        order: 2,
        lectures: [
          { title: 'Booking a Hotel: Ein Zimmer buchen', videoUrl: 'https://www.youtube.com/watch?v=3H0SK3ZjGOo', duration: 18, isFree: false, order: 0 },
          { title: 'At the Doctor: Beim Arzt', videoUrl: 'https://www.youtube.com/watch?v=3H0SK3ZjGOo', duration: 20, isFree: false, order: 1 },
          { title: 'German Transport: Bahn & Bus', videoUrl: 'https://www.youtube.com/watch?v=3H0SK3ZjGOo', duration: 16, isFree: false, order: 2 },
        ],
        notes: [{ title: 'Travel & Health Vocabulary', content: '# Travel\n- der Bahnhof → train station\n- der Flughafen → airport\n- Hin und zurück → round trip\n- Einmal nach München, bitte.\n\n# Health\n- Mir geht es nicht gut. → I don\'t feel well.\n- Ich habe Kopfschmerzen. → I have a headache.\n- Ich habe Fieber. → I have a fever.\n- Wo tut es weh? → Where does it hurt?' }],
        dpp: [
          { question: 'What is "Bahnhof" in English?', options: ['Airport', 'Bus stop', 'Train station', 'Hotel'], correctAnswer: 'Train station', explanation: '"Bahn" = train/railway. "Bahnhof" = train station.' },
          { question: '"Mir geht es nicht gut" means:', options: ["I don't like it.", 'I am not doing well.', 'I am not going.', "It's not good."], correctAnswer: 'I am not doing well.', explanation: '"Wie geht es?" = How are you? "nicht gut" = not well.' },
        ],
      },
    ],
  },

  // ── 4. B1 Paid (₹999) ───────────────────────────────────────────────────────
  {
    title: 'B1 German — Intermediate Mastery 🏆',
    description: 'Reach B1 and unlock 90% of everyday German! Covers Konjunktiv II, passive voice, complex grammar, and prepares you for the Goethe B1 certificate.',
    level: 'B1',
    price: 999,
    thumbnail: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800&q=80',
    isPublished: true,
    tags: ['B1', 'intermediate', 'Konjunktiv', 'passive', 'Goethe'],
    announcements: [{ title: '🏆 B1 Batch is Live!', body: 'Welcome to the B1 Premium batch! This is an intensive course. Make sure you have solid A1+A2 knowledge. Let\'s master German together!', createdAt: new Date() }],
    modules: [
      {
        title: 'Module 1: Konjunktiv II (Subjunctive)',
        order: 0,
        lectures: [
          { title: 'What is Konjunktiv II and Why It Matters', videoUrl: 'https://www.youtube.com/watch?v=3H0SK3ZjGOo', duration: 20, isFree: false, order: 0 },
          { title: 'Forming Konjunktiv II: würde + Infinitiv', videoUrl: 'https://www.youtube.com/watch?v=3H0SK3ZjGOo', duration: 28, isFree: false, order: 1 },
          { title: 'Polite Requests with Konjunktiv II', videoUrl: 'https://www.youtube.com/watch?v=3H0SK3ZjGOo', duration: 22, isFree: false, order: 2 },
          { title: 'Unreal Conditionals: Wenn ich... wäre', videoUrl: 'https://www.youtube.com/watch?v=3H0SK3ZjGOo', duration: 30, isFree: false, order: 3 },
        ],
        notes: [{ title: 'Konjunktiv II — Complete Reference', content: '# Konjunktiv II\n\n## Uses\n1. Polite requests → Könnten Sie helfen?\n2. Unreal conditions → Wenn ich reich wäre...\n3. Wishes → Ich wäre gern ein Vogel.\n\n## Formula: würde + Infinitiv\n- Ich würde gern reisen.\n\n## Key Irregular Forms\n| Verb | Konjunktiv II |\n|---|---|\n| sein | wäre |\n| haben | hätte |\n| können | könnte |\n| müssen | müsste |\n\n## Conditional\nWenn + KII, ... würde...\n- Wenn ich Geld hätte, würde ich reisen.' }],
        dpp: [
          { question: 'Which is the Konjunktiv II of "sein"?', options: ['sei', 'seien', 'wäre', 'gewesen'], correctAnswer: 'wäre', explanation: '"sein" → Konjunktiv II = "wäre".' },
          { question: '"Könnten Sie mir helfen?" translates to:', options: ['Can you help me?', 'Could you help me? (polite)', 'You should help me.', 'Help me!'], correctAnswer: 'Could you help me? (polite)', explanation: '"könnten" is Konjunktiv II of "können" — more polite.' },
          { question: '"Wenn ich Zeit ___, würde ich Deutsch lernen."', options: ['hätte', 'habe', 'hatte', 'haben'], correctAnswer: 'hätte', explanation: '"hätte" = Konjunktiv II of "haben". Use in conditional clauses.' },
          { question: 'What is the Konjunktiv II of "können"?', options: ['kann', 'konnte', 'könnte', 'gekonnt'], correctAnswer: 'könnte', explanation: '"können" → könnte. Notice the umlaut on the Präteritum stem.' },
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
        notes: [{ title: 'Passive Voice Formation', content: '# Passiv\n\n## Vorgangspassiv (Process)\nwerden + Partizip II\n\n- Present: Das Haus wird gebaut.\n- Past: Das Haus wurde gebaut.\n- Perfekt: Das Haus ist gebaut worden.\n\n## Zustandspassiv (State)\nsein + Partizip II\n\n- Das Haus ist gebaut. (state)\n\n## Active → Passive\nActive: Die Studenten lesen das Buch.\nPassive: Das Buch wird von den Studenten gelesen.\n\n⚠️ Agent uses "von" + Dativ.' }],
        dpp: [
          { question: 'How do you form the present passive?', options: ['sein + Infinitiv', 'werden + Partizip II', 'haben + Partizip II', 'sein + Partizip II'], correctAnswer: 'werden + Partizip II', explanation: 'Vorgangspassiv = werden + Partizip II.' },
          { question: '"Das Buch ___ gelesen." (The book is being read.)', options: ['ist', 'hat', 'wird', 'wurde'], correctAnswer: 'wird', explanation: 'Present passive uses "wird" (3rd person of werden).' },
          { question: '"Das Fenster ist geöffnet." This is:', options: ['Vorgangspassiv', 'Zustandspassiv', 'Konjunktiv II', 'Active voice'], correctAnswer: 'Zustandspassiv', explanation: 'sein + Partizip II = Zustandspassiv (state, not process).' },
        ],
      },
      {
        title: 'Module 3: B1 Exam Preparation',
        order: 2,
        lectures: [
          { title: 'Goethe B1 Exam Structure Overview', videoUrl: 'https://www.youtube.com/watch?v=3H0SK3ZjGOo', duration: 25, isFree: false, order: 0 },
          { title: 'Writing a Formal Letter at B1', videoUrl: 'https://www.youtube.com/watch?v=3H0SK3ZjGOo', duration: 30, isFree: false, order: 1 },
          { title: 'B1 Speaking: Discussing a Topic', videoUrl: 'https://www.youtube.com/watch?v=3H0SK3ZjGOo', duration: 25, isFree: false, order: 2 },
          { title: 'B1 Mock Test — Full Walkthrough', videoUrl: 'https://www.youtube.com/watch?v=3H0SK3ZjGOo', duration: 60, isFree: false, order: 3 },
        ],
        notes: [{ title: 'B1 Exam Strategy Guide', content: '# Goethe B1 Exam\n\n## Sections\n1. Lesen (Reading) — 65 min, 45 pts\n2. Hören (Listening) — 40 min, 45 pts\n3. Schreiben (Writing) — 60 min, 30 pts\n4. Sprechen (Speaking) — 15 min, 30 pts\n\nTotal: 150 pts | Pass: 60% = 90 pts\n\n## Useful Connectors\n- deshalb → therefore\n- trotzdem → nevertheless\n- jedoch → however\n- außerdem → furthermore\n- obwohl → although' }],
        dpp: [
          { question: 'What is the passing score for Goethe B1?', options: ['60 pts', '75 pts', '90 pts', '100 pts'], correctAnswer: '90 pts', explanation: 'Total 150 pts. 60% = 90 pts needed to pass.' },
          { question: 'Which connector means "however"?', options: ['deshalb', 'außerdem', 'damit', 'jedoch'], correctAnswer: 'jedoch', explanation: '"jedoch" = however/nevertheless.' },
          { question: 'How long is the B1 Schreiben section?', options: ['40 min', '50 min', '60 min', '65 min'], correctAnswer: '60 min', explanation: 'Schreiben = 60 minutes, 2 writing tasks.' },
          { question: '"obwohl" introduces a:', options: ['reason', 'result', 'concession/contrast', 'purpose'], correctAnswer: 'concession/contrast', explanation: '"obwohl" = although. It shows contrast/concession.' },
        ],
      },
    ],
  },
];

export const seedDefaultBatches = async (req: Request, res: Response): Promise<void> => {
  try {
    // Find teacher/admin
    let teacher = await User.findOne({ role: { $in: ['admin', 'teacher'] } });
    if (!teacher) teacher = await User.findOne({});
    if (!teacher) {
      res.status(400).json({ message: 'No users found. Register at least one user first.' });
      return;
    }

    // Clear existing batches + modules
    const existing = await Batch.find({});
    const ids = existing.map((b) => b._id);
    await ModuleModel.deleteMany({ batch: { $in: ids } });
    await Batch.deleteMany({});

    const results = [];

    for (const batchData of BATCHES_DATA) {
      const { modules: modulesData, ...batchFields } = batchData;

      const batch = await Batch.create({
        ...batchFields,
        teacher: teacher._id,
        enrolledStudents: [],
        modules: [],
      });

      const moduleIds = [];
      for (const modData of modulesData) {
        const mod = await ModuleModel.create({ batch: batch._id, ...modData });
        moduleIds.push(mod._id);
      }

      await Batch.findByIdAndUpdate(batch._id, { modules: moduleIds });
      results.push({ title: batch.title, level: batch.level, price: batch.price, modules: modulesData.length });
    }

    res.status(201).json({
      message: `✅ Seeded ${results.length} default batches successfully!`,
      batches: results,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
