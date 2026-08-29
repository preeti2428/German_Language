import { Request, Response } from 'express';
import TestPaper from '../models/TestPaper';
import TestResult from '../models/TestResult';

// ── 10 A1 Test Papers Data (150 Questions) ──────────────────────────────────
const A1_PRACTICE_PAPERS = [
  {
    title: 'A1 Paper 1: Greetings & Introductions (Begrüßung)',
    level: 'A1',
    source: 'sample',
    year: 2024,
    totalTime: 20,
    totalMarks: 15,
    passingMarks: 9,
    tags: ['a1', 'beginner', 'greetings', 'introductions', 'mcq'],
    sections: [
      {
        sectionType: 'reading',
        title: 'Begrüßung & Kennenlernen — 15 Questions',
        instructions: 'Read each question carefully and select the single correct option (A, B, C, or D).',
        timeLimit: 20,
        questions: [
          { questionNumber: 1, type: 'mcq', prompt: "How do you say 'Hello' (informal) in German?", options: ['Tschüss', 'Hallo', 'Danke', 'Bitte'], correctAnswer: 'Hallo', points: 1, explanation: "'Hallo' is the informal German greeting for 'Hello'." },
          { questionNumber: 2, type: 'mcq', prompt: "What does 'Guten Morgen' mean?", options: ['Good evening', 'Good night', 'Good morning', 'Good afternoon'], correctAnswer: 'Good morning', points: 1, explanation: "'Guten Morgen' translates to 'Good morning'." },
          { questionNumber: 3, type: 'mcq', prompt: "Which phrase means 'Good evening'?", options: ['Guten Tag', 'Guten Abend', 'Gute Nacht', 'Guten Morgen'], correctAnswer: 'Guten Abend', points: 1, explanation: "'Guten Abend' is used to say 'Good evening'." },
          { questionNumber: 4, type: 'mcq', prompt: "How do you say 'My name is...' in German?", options: ['Ich bin...', 'Ich heiße...', 'Ich habe...', 'Ich komme...'], correctAnswer: 'Ich heiße...', points: 1, explanation: "'Ich heiße...' means 'My name is...'." },
          { questionNumber: 5, type: 'mcq', prompt: "What is the German word for 'goodbye' (informal)?", options: ['Hallo', 'Bitte', 'Tschüss', 'Danke'], correctAnswer: 'Tschüss', points: 1, explanation: "'Tschüss' means 'Bye / Goodbye' informally." },
          { questionNumber: 6, type: 'mcq', prompt: "'Wie geht es dir?' means...", options: ['What is your name?', 'Where are you from?', 'How are you?', 'How old are you?'], correctAnswer: 'How are you?', points: 1, explanation: "'Wie geht es dir?' is informal for 'How are you?'." },
          { questionNumber: 7, type: 'mcq', prompt: "A polite reply to 'Wie geht es dir?' is:", options: ['Mir geht es gut, danke.', 'Ich bin fünfzehn.', 'Ich komme aus Indien.', 'Tschüss!'], correctAnswer: 'Mir geht es gut, danke.', points: 1, explanation: "'Mir geht es gut, danke.' = 'I am doing well, thanks.'" },
          { questionNumber: 8, type: 'mcq', prompt: "How do you say 'Nice to meet you' in German?", options: ['Bis bald', 'Schönen Tag', 'Freut mich', 'Gute Reise'], correctAnswer: 'Freut mich', points: 1, explanation: "'Freut mich' means 'Nice to meet you / Pleased to meet you'." },
          { questionNumber: 9, type: 'mcq', prompt: "'Woher kommst du?' is asking...", options: ['What your name is', 'Where you are from', 'How old you are', 'What you do'], correctAnswer: 'Where you are from', points: 1, explanation: "'Woher kommst du?' asks where you come from." },
          { questionNumber: 10, type: 'mcq', prompt: "The correct answer to 'Woher kommst du?' is:", options: ['Ich komme aus Indien.', 'Ich heiße Anna.', 'Ich bin 20 Jahre alt.', 'Mir geht es gut.'], correctAnswer: 'Ich komme aus Indien.', points: 1, explanation: "'Ich komme aus...' = 'I come from...'." },
          { questionNumber: 11, type: 'mcq', prompt: "'Wie alt bist du?' means:", options: ['What is your name?', 'How old are you?', 'How are you?', 'Where do you live?'], correctAnswer: 'How old are you?', points: 1, explanation: "'Wie alt bist du?' asks for your age." },
          { questionNumber: 12, type: 'mcq', prompt: "Which is the formal way to say 'you' in German?", options: ['du', 'ihr', 'Sie', 'wir'], correctAnswer: 'Sie', points: 1, explanation: "'Sie' (capitalized) is the formal polite 'you'." },
          { questionNumber: 13, type: 'mcq', prompt: "'Auf Wiedersehen' is used to say...", options: ['Hello (formal)', 'Goodbye (formal)', 'Thank you', 'Excuse me'], correctAnswer: 'Goodbye (formal)', points: 1, explanation: "'Auf Wiedersehen' is formal for 'Goodbye'." },
          { questionNumber: 14, type: 'mcq', prompt: "'Entschuldigung' means:", options: ['Please', 'Thank you', 'Excuse me / Sorry', "You're welcome"], correctAnswer: 'Excuse me / Sorry', points: 1, explanation: "'Entschuldigung' means 'Excuse me' or 'Sorry'." },
          { questionNumber: 15, type: 'mcq', prompt: "How do you say 'Please' in German?", options: ['Danke', 'Bitte', 'Tschüss', 'Ja'], correctAnswer: 'Bitte', points: 1, explanation: "'Bitte' means 'Please' (and also 'You are welcome')." },
        ],
      },
    ],
  },
  {
    title: 'A1 Paper 2: Numbers 0–100 (Zahlen)',
    level: 'A1',
    source: 'sample',
    year: 2024,
    totalTime: 20,
    totalMarks: 15,
    passingMarks: 9,
    tags: ['a1', 'numbers', 'zahlen', 'mcq'],
    sections: [
      {
        sectionType: 'reading',
        title: 'Zahlen von 0 bis 100 — 15 Questions',
        instructions: 'Choose the correct answer for each number question.',
        timeLimit: 20,
        questions: [
          { questionNumber: 1, type: 'mcq', prompt: "What is 'eins' in English?", options: ['Zero', 'One', 'Two', 'Ten'], correctAnswer: 'One', points: 1, explanation: "'eins' = 1 (One)." },
          { questionNumber: 2, type: 'mcq', prompt: "What is the German word for '5'?", options: ['vier', 'fünf', 'sechs', 'sieben'], correctAnswer: 'fünf', points: 1, explanation: "'fünf' = 5." },
          { questionNumber: 3, type: 'mcq', prompt: "'zehn' means:", options: ['9', '10', '11', '20'], correctAnswer: '10', points: 1, explanation: "'zehn' = 10." },
          { questionNumber: 4, type: 'mcq', prompt: "How do you say '20' in German?", options: ['zwölf', 'zwanzig', 'zehn', 'zwei'], correctAnswer: 'zwanzig', points: 1, explanation: "'zwanzig' = 20." },
          { questionNumber: 5, type: 'mcq', prompt: "'dreizehn' is the number:", options: ['3', '13', '30', '31'], correctAnswer: '13', points: 1, explanation: "'dreizehn' = 13 (3 + 10)." },
          { questionNumber: 6, type: 'mcq', prompt: "Which number is 'hundert'?", options: ['10', '100', '1000', '10000'], correctAnswer: '100', points: 1, explanation: "'hundert' = 100." },
          { questionNumber: 7, type: 'mcq', prompt: "'siebzehn' means:", options: ['7', '17', '70', '71'], correctAnswer: '17', points: 1, explanation: "'siebzehn' = 17." },
          { questionNumber: 8, type: 'mcq', prompt: "What is '50' in German?", options: ['fünfzig', 'fünfzehn', 'fünf', 'fünfhundert'], correctAnswer: 'fünfzig', points: 1, explanation: "'fünfzig' = 50." },
          { questionNumber: 9, type: 'mcq', prompt: "'null' means:", options: ['One', 'Nothing/Zero', 'Ten', 'None of these'], correctAnswer: 'Nothing/Zero', points: 1, explanation: "'null' = 0 (Zero)." },
          { questionNumber: 10, type: 'mcq', prompt: "How do you say '21' (twenty-one) in German? (Hint: 'one-and-twenty')", options: ['zwanzigeins', 'einundzwanzig', 'zweiundzwanzig', 'elfzwanzig'], correctAnswer: 'einundzwanzig', points: 1, explanation: "21 = einundzwanzig (one-and-twenty)." },
          { questionNumber: 11, type: 'mcq', prompt: "'neun' means:", options: ['6', '9', '19', '90'], correctAnswer: '9', points: 1, explanation: "'neun' = 9." },
          { questionNumber: 12, type: 'mcq', prompt: "'zwölf' is the number:", options: ['2', '10', '12', '20'], correctAnswer: '12', points: 1, explanation: "'zwölf' = 12." },
          { questionNumber: 13, type: 'mcq', prompt: "What is '80' in German?", options: ['achtzehn', 'achtzig', 'acht', 'achthundert'], correctAnswer: 'achtzig', points: 1, explanation: "'achtzig' = 80." },
          { questionNumber: 14, type: 'mcq', prompt: "'vierzig' means:", options: ['4', '14', '40', '44'], correctAnswer: '40', points: 1, explanation: "'vierzig' = 40." },
          { questionNumber: 15, type: 'mcq', prompt: "'sechzig' means:", options: ['6', '16', '60', '66'], correctAnswer: '60', points: 1, explanation: "'sechzig' = 60." },
        ],
      },
    ],
  },
  {
    title: 'A1 Paper 3: Pronouns & Verbs "sein" / "haben"',
    level: 'A1',
    source: 'sample',
    year: 2024,
    totalTime: 20,
    totalMarks: 15,
    passingMarks: 9,
    tags: ['a1', 'grammar', 'pronouns', 'verbs', 'sein', 'haben'],
    sections: [
      {
        sectionType: 'reading',
        title: "Personalpronomen & 'sein' / 'haben'",
        instructions: 'Choose the correct pronoun or verb conjugation.',
        timeLimit: 20,
        questions: [
          { questionNumber: 1, type: 'mcq', prompt: "What does 'ich' mean?", options: ['you', 'I', 'he', 'we'], correctAnswer: 'I', points: 1, explanation: "'ich' = 'I'." },
          { questionNumber: 2, type: 'mcq', prompt: "'du' means:", options: ['I (informal)', 'you (informal, singular)', 'he', 'they'], correctAnswer: 'you (informal, singular)', points: 1, explanation: "'du' = 'you' (singular informal)." },
          { questionNumber: 3, type: 'mcq', prompt: "Which pronoun means 'she'?", options: ['er', 'sie', 'es', 'wir'], correctAnswer: 'sie', points: 1, explanation: "'sie' (lowercase) = 'she'." },
          { questionNumber: 4, type: 'mcq', prompt: "'wir' means:", options: ['you (plural)', 'they', 'we', 'I'], correctAnswer: 'we', points: 1, explanation: "'wir' = 'we'." },
          { questionNumber: 5, type: 'mcq', prompt: "Complete: 'Ich ___ müde.' (I am tired)", options: ['bin', 'bist', 'ist', 'sind'], correctAnswer: 'bin', points: 1, explanation: "ich bin (I am)." },
          { questionNumber: 6, type: 'mcq', prompt: "Complete: 'Du ___ nett.' (You are nice)", options: ['bin', 'bist', 'ist', 'seid'], correctAnswer: 'bist', points: 1, explanation: "du bist (you are)." },
          { questionNumber: 7, type: 'mcq', prompt: "Complete: 'Er ___ Lehrer.' (He is a teacher)", options: ['bin', 'bist', 'ist', 'sind'], correctAnswer: 'ist', points: 1, explanation: "er ist (he is)." },
          { questionNumber: 8, type: 'mcq', prompt: "Complete: 'Wir ___ Studenten.' (We are students)", options: ['bin', 'ist', 'seid', 'sind'], correctAnswer: 'sind', points: 1, explanation: "wir sind (we are)." },
          { questionNumber: 9, type: 'mcq', prompt: "Which is the correct 'to have' form: 'Ich ___ ein Buch.' (I have a book)", options: ['habe', 'hast', 'hat', 'haben'], correctAnswer: 'habe', points: 1, explanation: "ich habe (I have)." },
          { questionNumber: 10, type: 'mcq', prompt: "Complete: 'Du ___ einen Hund.' (You have a dog)", options: ['habe', 'hast', 'hat', 'habt'], correctAnswer: 'hast', points: 1, explanation: "du hast (you have)." },
          { questionNumber: 11, type: 'mcq', prompt: "Complete: 'Sie (she) ___ Zeit.' (She has time)", options: ['habe', 'hast', 'hat', 'haben'], correctAnswer: 'hat', points: 1, explanation: "sie hat (she has)." },
          { questionNumber: 12, type: 'mcq', prompt: "'ihr' (plural you) with 'sein' becomes:", options: ['ihr bin', 'ihr bist', 'ihr seid', 'ihr sind'], correctAnswer: 'ihr seid', points: 1, explanation: "ihr seid (you all are)." },
          { questionNumber: 13, type: 'mcq', prompt: "'sie' (they) with 'haben' becomes:", options: ['sie habe', 'sie hast', 'sie hat', 'sie haben'], correctAnswer: 'sie haben', points: 1, explanation: "sie haben (they have)." },
          { questionNumber: 14, type: 'mcq', prompt: "Which pronoun means 'it'?", options: ['er', 'sie', 'es', 'man'], correctAnswer: 'es', points: 1, explanation: "'es' = 'it'." },
          { questionNumber: 15, type: 'mcq', prompt: "Complete: 'Wir ___ Hunger.' (We are hungry)", options: ['habe', 'hast', 'haben', 'hat'], correctAnswer: 'haben', points: 1, explanation: "wir haben Hunger." },
        ],
      },
    ],
  },
  {
    title: 'A1 Paper 4: Articles & Nouns (der / die / das)',
    level: 'A1',
    source: 'sample',
    year: 2024,
    totalTime: 20,
    totalMarks: 15,
    passingMarks: 9,
    tags: ['a1', 'grammar', 'articles', 'gender', 'der-die-das'],
    sections: [
      {
        sectionType: 'reading',
        title: 'Artikel & Nomen — der / die / das',
        instructions: 'Choose the correct definite or indefinite article.',
        timeLimit: 20,
        questions: [
          { questionNumber: 1, type: 'mcq', prompt: 'In German, how many grammatical noun genders are there?', options: ['2', '3', '4', '5'], correctAnswer: '3', points: 1, explanation: 'German has 3 genders: Maskulin (der), Feminin (die), Neutrum (das).' },
          { questionNumber: 2, type: 'mcq', prompt: "The masculine definite article ('the') is:", options: ['die', 'das', 'der', 'den'], correctAnswer: 'der', points: 1, explanation: 'der = masculine the.' },
          { questionNumber: 3, type: 'mcq', prompt: "The feminine definite article ('the') is:", options: ['der', 'die', 'das', 'dem'], correctAnswer: 'die', points: 1, explanation: 'die = feminine the.' },
          { questionNumber: 4, type: 'mcq', prompt: "The neuter definite article ('the') is:", options: ['der', 'die', 'das', 'des'], correctAnswer: 'das', points: 1, explanation: 'das = neuter the.' },
          { questionNumber: 5, type: 'mcq', prompt: "Which article goes with 'Mann' (man)? '___ Mann'", options: ['der', 'die', 'das', 'den'], correctAnswer: 'der', points: 1, explanation: 'der Mann (masculine).' },
          { questionNumber: 6, type: 'mcq', prompt: "Which article goes with 'Frau' (woman)? '___ Frau'", options: ['der', 'die', 'das', 'dem'], correctAnswer: 'die', points: 1, explanation: 'die Frau (feminine).' },
          { questionNumber: 7, type: 'mcq', prompt: "Which article goes with 'Kind' (child)? '___ Kind'", options: ['der', 'die', 'das', 'den'], correctAnswer: 'das', points: 1, explanation: 'das Kind (neuter).' },
          { questionNumber: 8, type: 'mcq', prompt: "The indefinite article 'a/an' for masculine nouns is:", options: ['ein', 'eine', 'einen', 'einer'], correctAnswer: 'ein', points: 1, explanation: 'ein Mann (masculine).' },
          { questionNumber: 9, type: 'mcq', prompt: "The indefinite article 'a/an' for feminine nouns is:", options: ['ein', 'eine', 'einen', 'einem'], correctAnswer: 'eine', points: 1, explanation: 'eine Frau (feminine).' },
          { questionNumber: 10, type: 'mcq', prompt: "'Das Buch' means:", options: ['A book', 'The book', 'My book', 'Some books'], correctAnswer: 'The book', points: 1, explanation: "'Das Buch' = 'The book'." },
          { questionNumber: 11, type: 'mcq', prompt: "The plural definite article ('the', for all genders) is:", options: ['der', 'die', 'das', 'dem'], correctAnswer: 'die', points: 1, explanation: 'die is always the plural definite article.' },
          { questionNumber: 12, type: 'mcq', prompt: "Which article goes with 'Tisch' (table)? '___ Tisch'", options: ['der', 'die', 'das', 'den'], correctAnswer: 'der', points: 1, explanation: 'der Tisch (masculine).' },
          { questionNumber: 13, type: 'mcq', prompt: "Which article goes with 'Lampe' (lamp)? '___ Lampe'", options: ['der', 'die', 'das', 'dem'], correctAnswer: 'die', points: 1, explanation: 'die Lampe (feminine).' },
          { questionNumber: 14, type: 'mcq', prompt: "Which article goes with 'Auto' (car)? '___ Auto'", options: ['der', 'die', 'das', 'den'], correctAnswer: 'das', points: 1, explanation: 'das Auto (neuter).' },
          { questionNumber: 15, type: 'mcq', prompt: 'German nouns always start with:', options: ['a lowercase letter', 'a capital letter', "the letter 'd'", 'an article only'], correctAnswer: 'a capital letter', points: 1, explanation: 'All German nouns are capitalized.' },
        ],
      },
    ],
  },
  {
    title: 'A1 Paper 5: Family Members (Familie)',
    level: 'A1',
    source: 'sample',
    year: 2024,
    totalTime: 20,
    totalMarks: 15,
    passingMarks: 9,
    tags: ['a1', 'vocabulary', 'family', 'familie'],
    sections: [
      {
        sectionType: 'reading',
        title: 'Familie & Verwandte — 15 Questions',
        instructions: 'Choose the correct translation for each family member.',
        timeLimit: 20,
        questions: [
          { questionNumber: 1, type: 'mcq', prompt: "'die Mutter' means:", options: ['Father', 'Mother', 'Sister', 'Daughter'], correctAnswer: 'Mother', points: 1, explanation: "'die Mutter' = Mother." },
          { questionNumber: 2, type: 'mcq', prompt: "'der Vater' means:", options: ['Mother', 'Brother', 'Father', 'Uncle'], correctAnswer: 'Father', points: 1, explanation: "'der Vater' = Father." },
          { questionNumber: 3, type: 'mcq', prompt: "'der Bruder' means:", options: ['Sister', 'Brother', 'Cousin', 'Son'], correctAnswer: 'Brother', points: 1, explanation: "'der Bruder' = Brother." },
          { questionNumber: 4, type: 'mcq', prompt: "'die Schwester' means:", options: ['Brother', 'Sister', 'Mother', 'Aunt'], correctAnswer: 'Sister', points: 1, explanation: "'die Schwester' = Sister." },
          { questionNumber: 5, type: 'mcq', prompt: "'die Tochter' means:", options: ['Son', 'Daughter', 'Wife', 'Niece'], correctAnswer: 'Daughter', points: 1, explanation: "'die Tochter' = Daughter." },
          { questionNumber: 6, type: 'mcq', prompt: "'der Sohn' means:", options: ['Daughter', 'Son', 'Grandfather', 'Husband'], correctAnswer: 'Son', points: 1, explanation: "'der Sohn' = Son." },
          { questionNumber: 7, type: 'mcq', prompt: "'die Großmutter' means:", options: ['Grandfather', 'Grandmother', 'Great-aunt', 'Mother-in-law'], correctAnswer: 'Grandmother', points: 1, explanation: "'die Großmutter' = Grandmother (Oma)." },
          { questionNumber: 8, type: 'mcq', prompt: "'der Großvater' means:", options: ['Grandmother', 'Uncle', 'Grandfather', 'Father-in-law'], correctAnswer: 'Grandfather', points: 1, explanation: "'der Großvater' = Grandfather (Opa)." },
          { questionNumber: 9, type: 'mcq', prompt: "'die Eltern' means:", options: ['Children', 'Parents', 'Grandparents', 'Relatives'], correctAnswer: 'Parents', points: 1, explanation: "'die Eltern' = Parents." },
          { questionNumber: 10, type: 'mcq', prompt: "'der Onkel' means:", options: ['Uncle', 'Aunt', 'Nephew', 'Cousin'], correctAnswer: 'Uncle', points: 1, explanation: "'der Onkel' = Uncle." },
          { questionNumber: 11, type: 'mcq', prompt: "'die Tante' means:", options: ['Uncle', 'Aunt', 'Niece', 'Grandmother'], correctAnswer: 'Aunt', points: 1, explanation: "'die Tante' = Aunt." },
          { questionNumber: 12, type: 'mcq', prompt: "'die Familie' means:", options: ['Friend', 'Family', 'Neighbor', 'Colleague'], correctAnswer: 'Family', points: 1, explanation: "'die Familie' = Family." },
          { questionNumber: 13, type: 'mcq', prompt: "'der Mann' can mean:", options: ['Woman / wife', 'Man / husband', 'Child', 'Friend'], correctAnswer: 'Man / husband', points: 1, explanation: "'der Mann' means man or husband." },
          { questionNumber: 14, type: 'mcq', prompt: "'die Frau' can mean:", options: ['Man / husband', 'Woman / wife', 'Sister', 'Girl only'], correctAnswer: 'Woman / wife', points: 1, explanation: "'die Frau' means woman or wife." },
          { questionNumber: 15, type: 'mcq', prompt: "'das Kind' means:", options: ['Adult', 'Child', 'Baby only', 'Teenager'], correctAnswer: 'Child', points: 1, explanation: "'das Kind' = Child." },
        ],
      },
    ],
  },
  {
    title: 'A1 Paper 6: Colors & Basic Adjectives (Farben)',
    level: 'A1',
    source: 'sample',
    year: 2024,
    totalTime: 20,
    totalMarks: 15,
    passingMarks: 9,
    tags: ['a1', 'vocabulary', 'colors', 'adjectives'],
    sections: [
      {
        sectionType: 'reading',
        title: 'Farben & Adjektive — 15 Questions',
        instructions: 'Select the correct meaning for each color or descriptive adjective.',
        timeLimit: 20,
        questions: [
          { questionNumber: 1, type: 'mcq', prompt: "'rot' means:", options: ['Blue', 'Red', 'Green', 'Yellow'], correctAnswer: 'Red', points: 1, explanation: "'rot' = Red." },
          { questionNumber: 2, type: 'mcq', prompt: "'blau' means:", options: ['Black', 'White', 'Blue', 'Brown'], correctAnswer: 'Blue', points: 1, explanation: "'blau' = Blue." },
          { questionNumber: 3, type: 'mcq', prompt: "'grün' means:", options: ['Grey', 'Green', 'Gold', 'Orange'], correctAnswer: 'Green', points: 1, explanation: "'grün' = Green." },
          { questionNumber: 4, type: 'mcq', prompt: "'gelb' means:", options: ['Yellow', 'Purple', 'Pink', 'Silver'], correctAnswer: 'Yellow', points: 1, explanation: "'gelb' = Yellow." },
          { questionNumber: 5, type: 'mcq', prompt: "'schwarz' means:", options: ['White', 'Black', 'Dark blue', 'Brown'], correctAnswer: 'Black', points: 1, explanation: "'schwarz' = Black." },
          { questionNumber: 6, type: 'mcq', prompt: "'weiß' means:", options: ['Black', 'White', 'Grey', 'Beige'], correctAnswer: 'White', points: 1, explanation: "'weiß' = White." },
          { questionNumber: 7, type: 'mcq', prompt: "'braun' means:", options: ['Brown', 'Orange', 'Green', 'Tan'], correctAnswer: 'Brown', points: 1, explanation: "'braun' = Brown." },
          { questionNumber: 8, type: 'mcq', prompt: "'groß' means:", options: ['Small', 'Big/tall', 'Wide', 'Long'], correctAnswer: 'Big/tall', points: 1, explanation: "'groß' = Big or Tall." },
          { questionNumber: 9, type: 'mcq', prompt: "'klein' means:", options: ['Big', 'Small', 'Short', 'Thin'], correctAnswer: 'Small', points: 1, explanation: "'klein' = Small." },
          { questionNumber: 10, type: 'mcq', prompt: "'gut' means:", options: ['Bad', 'Good', 'Nice', 'Great'], correctAnswer: 'Good', points: 1, explanation: "'gut' = Good." },
          { questionNumber: 11, type: 'mcq', prompt: "'schlecht' means:", options: ['Good', 'Bad', 'Fine', 'New'], correctAnswer: 'Bad', points: 1, explanation: "'schlecht' = Bad." },
          { questionNumber: 12, type: 'mcq', prompt: "'neu' means:", options: ['Old', 'New', 'Used', 'Broken'], correctAnswer: 'New', points: 1, explanation: "'neu' = New." },
          { questionNumber: 13, type: 'mcq', prompt: "'alt' means:", options: ['Young', 'New', 'Old', 'Ancient only'], correctAnswer: 'Old', points: 1, explanation: "'alt' = Old." },
          { questionNumber: 14, type: 'mcq', prompt: "'schön' means:", options: ['Ugly', 'Beautiful/nice', 'Boring', 'Strange'], correctAnswer: 'Beautiful/nice', points: 1, explanation: "'schön' = Beautiful or Nice." },
          { questionNumber: 15, type: 'mcq', prompt: "'lila' means:", options: ['Purple', 'Pink', 'Lime', 'Indigo'], correctAnswer: 'Purple', points: 1, explanation: "'lila' = Purple." },
        ],
      },
    ],
  },
  {
    title: 'A1 Paper 7: Days, Months & Time (Wochentage, Zeit)',
    level: 'A1',
    source: 'sample',
    year: 2024,
    totalTime: 20,
    totalMarks: 15,
    passingMarks: 9,
    tags: ['a1', 'time', 'days', 'months', 'uhrzeit'],
    sections: [
      {
        sectionType: 'reading',
        title: 'Wochentage, Monate & Uhrzeit — 15 Questions',
        instructions: 'Choose the correct answer for each calendar and time question.',
        timeLimit: 20,
        questions: [
          { questionNumber: 1, type: 'mcq', prompt: "'Montag' means:", options: ['Sunday', 'Monday', 'Tuesday', 'Saturday'], correctAnswer: 'Monday', points: 1, explanation: "'Montag' = Monday." },
          { questionNumber: 2, type: 'mcq', prompt: "'Mittwoch' means:", options: ['Tuesday', 'Thursday', 'Wednesday', 'Friday'], correctAnswer: 'Wednesday', points: 1, explanation: "'Mittwoch' = Wednesday (mid-week)." },
          { questionNumber: 3, type: 'mcq', prompt: "'Freitag' means:", options: ['Friday', 'Saturday', 'Thursday', 'Sunday'], correctAnswer: 'Friday', points: 1, explanation: "'Freitag' = Friday." },
          { questionNumber: 4, type: 'mcq', prompt: "'Sonntag' means:", options: ['Saturday', 'Monday', 'Sunday', 'Friday'], correctAnswer: 'Sunday', points: 1, explanation: "'Sonntag' = Sunday (sun-day)." },
          { questionNumber: 5, type: 'mcq', prompt: "'Januar' means:", options: ['June', 'January', 'July', 'December'], correctAnswer: 'January', points: 1, explanation: "'Januar' = January." },
          { questionNumber: 6, type: 'mcq', prompt: "'Dezember' means:", options: ['October', 'November', 'December', 'September'], correctAnswer: 'December', points: 1, explanation: "'Dezember' = December." },
          { questionNumber: 7, type: 'mcq', prompt: "'heute' means:", options: ['Yesterday', 'Tomorrow', 'Today', 'Now'], correctAnswer: 'Today', points: 1, explanation: "'heute' = Today." },
          { questionNumber: 8, type: 'mcq', prompt: "'morgen' (lowercase) means:", options: ['Morning only', 'Tomorrow', 'Yesterday', 'Evening'], correctAnswer: 'Tomorrow', points: 1, explanation: "'morgen' (lowercase) = Tomorrow (der Morgen = morning)." },
          { questionNumber: 9, type: 'mcq', prompt: "'gestern' means:", options: ['Today', 'Tomorrow', 'Yesterday', 'Tonight'], correctAnswer: 'Yesterday', points: 1, explanation: "'gestern' = Yesterday." },
          { questionNumber: 10, type: 'mcq', prompt: "'Wie viel Uhr ist es?' means:", options: ['What day is it?', 'What time is it?', 'What month is it?', 'How old are you?'], correctAnswer: 'What time is it?', points: 1, explanation: "'Wie viel Uhr ist es?' = 'What time is it?'" },
          { questionNumber: 11, type: 'mcq', prompt: "'Es ist ein Uhr.' means:", options: ["It is one o'clock.", 'It is Monday.', 'It is January.', 'It is one day.'], correctAnswer: "It is one o'clock.", points: 1, explanation: "'Es ist ein Uhr.' = 'It is 1:00.'" },
          { questionNumber: 12, type: 'mcq', prompt: "'die Woche' means:", options: ['Day', 'Week', 'Month', 'Year'], correctAnswer: 'Week', points: 1, explanation: "'die Woche' = Week." },
          { questionNumber: 13, type: 'mcq', prompt: "'der Monat' means:", options: ['Week', 'Month', 'Year', 'Season'], correctAnswer: 'Month', points: 1, explanation: "'der Monat' = Month." },
          { questionNumber: 14, type: 'mcq', prompt: "'das Jahr' means:", options: ['Day', 'Month', 'Year', 'Hour'], correctAnswer: 'Year', points: 1, explanation: "'das Jahr' = Year." },
          { questionNumber: 15, type: 'mcq', prompt: "'Samstag' means:", options: ['Sunday', 'Saturday', 'Wednesday', 'Friday'], correctAnswer: 'Saturday', points: 1, explanation: "'Samstag' = Saturday." },
        ],
      },
    ],
  },
  {
    title: 'A1 Paper 8: Food & Drinks (Essen und Trinken)',
    level: 'A1',
    source: 'sample',
    year: 2024,
    totalTime: 20,
    totalMarks: 15,
    passingMarks: 9,
    tags: ['a1', 'food', 'drinks', 'essen-trinken'],
    sections: [
      {
        sectionType: 'reading',
        title: 'Essen & Trinken — 15 Questions',
        instructions: 'Choose the correct English translation for each German food & drink word.',
        timeLimit: 20,
        questions: [
          { questionNumber: 1, type: 'mcq', prompt: "'das Brot' means:", options: ['Butter', 'Bread', 'Milk', 'Cheese'], correctAnswer: 'Bread', points: 1, explanation: "'das Brot' = Bread." },
          { questionNumber: 2, type: 'mcq', prompt: "'das Wasser' means:", options: ['Juice', 'Water', 'Milk', 'Wine'], correctAnswer: 'Water', points: 1, explanation: "'das Wasser' = Water." },
          { questionNumber: 3, type: 'mcq', prompt: "'die Milch' means:", options: ['Milk', 'Coffee', 'Tea', 'Beer'], correctAnswer: 'Milk', points: 1, explanation: "'die Milch' = Milk." },
          { questionNumber: 4, type: 'mcq', prompt: "'der Kaffee' means:", options: ['Cocoa', 'Tea', 'Coffee', 'Juice'], correctAnswer: 'Coffee', points: 1, explanation: "'der Kaffee' = Coffee." },
          { questionNumber: 5, type: 'mcq', prompt: "'der Apfel' means:", options: ['Orange', 'Apple', 'Banana', 'Grape'], correctAnswer: 'Apple', points: 1, explanation: "'der Apfel' = Apple." },
          { questionNumber: 6, type: 'mcq', prompt: "'die Suppe' means:", options: ['Salad', 'Soup', 'Sauce', 'Stew'], correctAnswer: 'Soup', points: 1, explanation: "'die Suppe' = Soup." },
          { questionNumber: 7, type: 'mcq', prompt: "'das Fleisch' means:", options: ['Fish', 'Vegetable', 'Meat', 'Egg'], correctAnswer: 'Meat', points: 1, explanation: "'das Fleisch' = Meat." },
          { questionNumber: 8, type: 'mcq', prompt: "'der Käse' means:", options: ['Cheese', 'Cream', 'Cake', 'Egg'], correctAnswer: 'Cheese', points: 1, explanation: "'der Käse' = Cheese." },
          { questionNumber: 9, type: 'mcq', prompt: "'das Ei' means:", options: ['Egg', 'Oil', 'Ice', 'Onion'], correctAnswer: 'Egg', points: 1, explanation: "'das Ei' = Egg." },
          { questionNumber: 10, type: 'mcq', prompt: "'der Zucker' means:", options: ['Salt', 'Sugar', 'Pepper', 'Honey'], correctAnswer: 'Sugar', points: 1, explanation: "'der Zucker' = Sugar." },
          { questionNumber: 11, type: 'mcq', prompt: "'das Salz' means:", options: ['Sugar', 'Salt', 'Spice', 'Oil'], correctAnswer: 'Salt', points: 1, explanation: "'das Salz' = Salt." },
          { questionNumber: 12, type: 'mcq', prompt: "'Ich möchte...' means:", options: ['I have...', 'I want / I would like...', 'I am...', 'I eat...'], correctAnswer: 'I want / I would like...', points: 1, explanation: "'Ich möchte...' = 'I would like...'" },
          { questionNumber: 13, type: 'mcq', prompt: "'der Tee' means:", options: ['Tea', 'Coffee', 'Toast', 'Sauce'], correctAnswer: 'Tea', points: 1, explanation: "'der Tee' = Tea." },
          { questionNumber: 14, type: 'mcq', prompt: "'das Obst' means:", options: ['Vegetables', 'Fruit', 'Meat', 'Bread'], correctAnswer: 'Fruit', points: 1, explanation: "'das Obst' = Fruit." },
          { questionNumber: 15, type: 'mcq', prompt: "'das Gemüse' means:", options: ['Fruit', 'Vegetables', 'Meat', 'Grain'], correctAnswer: 'Vegetables', points: 1, explanation: "'das Gemüse' = Vegetables." },
        ],
      },
    ],
  },
  {
    title: 'A1 Paper 9: Question Words & Survival Phrases',
    level: 'A1',
    source: 'sample',
    year: 2024,
    totalTime: 20,
    totalMarks: 15,
    passingMarks: 9,
    tags: ['a1', 'w-fragen', 'phrases', 'conversation'],
    sections: [
      {
        sectionType: 'reading',
        title: 'W-Fragen & Redewendungen — 15 Questions',
        instructions: 'Choose the correct meaning for each German question word or survival phrase.',
        timeLimit: 20,
        questions: [
          { questionNumber: 1, type: 'mcq', prompt: "'Was' means:", options: ['Who', 'What', 'Where', 'When'], correctAnswer: 'What', points: 1, explanation: "'Was' = What." },
          { questionNumber: 2, type: 'mcq', prompt: "'Wer' means:", options: ['What', 'Who', 'Why', 'How'], correctAnswer: 'Who', points: 1, explanation: "'Wer' = Who." },
          { questionNumber: 3, type: 'mcq', prompt: "'Wo' means:", options: ['Who', 'When', 'Where', 'Why'], correctAnswer: 'Where', points: 1, explanation: "'Wo' = Where." },
          { questionNumber: 4, type: 'mcq', prompt: "'Wann' means:", options: ['Where', 'When', 'Why', 'Which'], correctAnswer: 'When', points: 1, explanation: "'Wann' = When." },
          { questionNumber: 5, type: 'mcq', prompt: "'Warum' means:", options: ['What', 'Where', 'Why', 'Who'], correctAnswer: 'Why', points: 1, explanation: "'Warum' = Why." },
          { questionNumber: 6, type: 'mcq', prompt: "'Wie' means:", options: ['How', 'Who', 'Which', 'What'], correctAnswer: 'How', points: 1, explanation: "'Wie' = How." },
          { questionNumber: 7, type: 'mcq', prompt: "'Welche(r/s)' means:", options: ['Whose', 'Which', 'Whom', 'Why'], correctAnswer: 'Which', points: 1, explanation: "'Welche' = Which." },
          { questionNumber: 8, type: 'mcq', prompt: "'Wie viel' means:", options: ['How many/much', 'How often', 'How far', 'How long'], correctAnswer: 'How many/much', points: 1, explanation: "'Wie viel' = How much / How many." },
          { questionNumber: 9, type: 'mcq', prompt: "'Ich verstehe nicht.' means:", options: ["I don't know.", "I don't understand.", "I can't speak German.", 'I am not sure.'], correctAnswer: "I don't understand.", points: 1, explanation: "'Ich verstehe nicht.' = 'I do not understand.'" },
          { questionNumber: 10, type: 'mcq', prompt: "'Können Sie das wiederholen?' means:", options: ['Can you help me?', 'Can you repeat that?', 'Can you speak slower?', 'Can you write it down?'], correctAnswer: 'Can you repeat that?', points: 1, explanation: "'Können Sie das wiederholen?' = 'Could you repeat that?'" },
          { questionNumber: 11, type: 'mcq', prompt: "'Sprechen Sie Englisch?' means:", options: ['Do you speak English?', 'Do you understand me?', 'Are you from England?', 'Do you like English?'], correctAnswer: 'Do you speak English?', points: 1, explanation: "'Sprechen Sie Englisch?' = 'Do you speak English?'" },
          { questionNumber: 12, type: 'mcq', prompt: "'Wie bitte?' is used to say:", options: ['Please', 'Pardon? / What did you say?', "You're welcome", 'No problem'], correctAnswer: 'Pardon? / What did you say?', points: 1, explanation: "'Wie bitte?' = 'Pardon? / Excuse me?'" },
          { questionNumber: 13, type: 'mcq', prompt: "'Kein Problem' means:", options: ['No problem', 'No thanks', 'Not now', 'Never mind'], correctAnswer: 'No problem', points: 1, explanation: "'Kein Problem' = 'No problem'." },
          { questionNumber: 14, type: 'mcq', prompt: "'Ich weiß nicht.' means:", options: ["I don't understand.", "I don't know.", "I don't have it.", "I don't want it."], correctAnswer: "I don't know.", points: 1, explanation: "'Ich weiß nicht.' = 'I don't know.'" },
          { questionNumber: 15, type: 'mcq', prompt: "'Langsam, bitte.' means:", options: ['Quickly, please.', 'Again, please.', 'Slowly, please.', 'Louder, please.'], correctAnswer: 'Slowly, please.', points: 1, explanation: "'Langsam, bitte.' = 'Slowly, please.'" },
        ],
      },
    ],
  },
  {
    title: 'A1 Paper 10: Comprehensive Mixed Review',
    level: 'A1',
    source: 'sample',
    year: 2024,
    totalTime: 20,
    totalMarks: 15,
    passingMarks: 9,
    tags: ['a1', 'review', 'comprehensive', 'final-test'],
    sections: [
      {
        sectionType: 'reading',
        title: 'Abschlussprüfung — Alle Themen (15 Questions)',
        instructions: 'Final comprehensive review test covering all beginner German concepts.',
        timeLimit: 20,
        questions: [
          { questionNumber: 1, type: 'mcq', prompt: "'Guten Tag' means:", options: ['Good night', 'Good day/afternoon', 'Good morning', 'Goodbye'], correctAnswer: 'Good day/afternoon', points: 1, explanation: "'Guten Tag' = Good day / afternoon." },
          { questionNumber: 2, type: 'mcq', prompt: "What number is 'sechzehn'?", options: ['6', '16', '60', '66'], correctAnswer: '16', points: 1, explanation: "'sechzehn' = 16." },
          { questionNumber: 3, type: 'mcq', prompt: "Complete: 'Ich ___ 18 Jahre alt.' (I am 18 years old)", options: ['bin', 'bist', 'habe', 'hat'], correctAnswer: 'bin', points: 1, explanation: 'In German, age uses "sein": "Ich bin 18 Jahre alt."' },
          { questionNumber: 4, type: 'mcq', prompt: "Which article is correct? '___ Hund' (the dog, masculine)", options: ['der', 'die', 'das', 'den'], correctAnswer: 'der', points: 1, explanation: 'der Hund (masculine).' },
          { questionNumber: 5, type: 'mcq', prompt: "'die Schwester' means:", options: ['Mother', 'Sister', 'Aunt', 'Daughter'], correctAnswer: 'Sister', points: 1, explanation: "'die Schwester' = Sister." },
          { questionNumber: 6, type: 'mcq', prompt: "'rot' and 'blau' together describe:", options: ['Numbers', 'Colors', 'Days', 'Foods'], correctAnswer: 'Colors', points: 1, explanation: 'rot (red) and blau (blue) are colors (Farben).' },
          { questionNumber: 7, type: 'mcq', prompt: "'Dienstag' means:", options: ['Monday', 'Tuesday', 'Thursday', 'Sunday'], correctAnswer: 'Tuesday', points: 1, explanation: "'Dienstag' = Tuesday." },
          { questionNumber: 8, type: 'mcq', prompt: "'das Brot' means:", options: ['Water', 'Cheese', 'Bread', 'Meat'], correctAnswer: 'Bread', points: 1, explanation: "'das Brot' = Bread." },
          { questionNumber: 9, type: 'mcq', prompt: "'Warum' is used to ask:", options: ['Where', 'Why', 'When', 'Who'], correctAnswer: 'Why', points: 1, explanation: "'Warum' = Why." },
          { questionNumber: 10, type: 'mcq', prompt: "'Wir haben Zeit.' means:", options: ['We are on time.', 'We have time.', 'We are late.', 'We had time.'], correctAnswer: 'We have time.', points: 1, explanation: "'Wir haben Zeit.' = 'We have time.'" },
          { questionNumber: 11, type: 'mcq', prompt: "Which word means 'today'?", options: ['gestern', 'morgen', 'heute', 'jetzt'], correctAnswer: 'heute', points: 1, explanation: "'heute' = today." },
          { questionNumber: 12, type: 'mcq', prompt: "'die Mutter' and 'der Vater' together mean:", options: ['Siblings', 'Parents', 'Grandparents', 'Children'], correctAnswer: 'Parents', points: 1, explanation: 'die Eltern = Parents (Mother + Father).' },
          { questionNumber: 13, type: 'mcq', prompt: "'Ich möchte Wasser, bitte.' means:", options: ['I have water, thanks.', 'I want water, please.', 'I need water urgently.', 'I drank water already.'], correctAnswer: 'I want water, please.', points: 1, explanation: "'Ich möchte Wasser, bitte.' = 'I would like water, please.'" },
          { questionNumber: 14, type: 'mcq', prompt: "'Wie geht es dir?' is a way to ask:", options: ["What's your name?", 'How are you?', 'Where do you live?', 'How old are you?'], correctAnswer: 'How are you?', points: 1, explanation: "'Wie geht es dir?' = 'How are you?'" },
          { questionNumber: 15, type: 'mcq', prompt: "The plural article 'die' (for all genders) is used before words like:", options: ['Bücher (books)', 'Buch (book, singular)', 'Mann (man)', 'Frau (woman)'], correctAnswer: 'Bücher (books)', points: 1, explanation: 'die Bücher (plural).' },
        ],
      },
    ],
  },
];

// ── Sample Goethe Exam Papers for A1, A2, B1 ─────────────────────────────────
const GOETHE_EXAM_PAPERS = [
  {
    title: 'Goethe A1: Start Deutsch 1 — Full Exam Simulation',
    level: 'A1',
    source: 'goethe',
    year: 2024,
    totalTime: 65,
    totalMarks: 60,
    passingMarks: 36,
    tags: ['goethe', 'a1', 'official-style', '4-skills'],
    sections: [
      {
        sectionType: 'listening',
        title: 'Hören — Listening',
        instructions: 'You will hear short conversations and announcements. Choose the correct answer.',
        timeLimit: 20,
        questions: [
          { questionNumber: 1, type: 'mcq', prompt: 'Wo trifft sich Maria mit ihrer Freundin?', audioText: 'Hallo Maria! Treffen wir uns heute um 15 Uhr im Café Latte?', options: ['Im Park', 'Im Café', 'Im Supermarkt', 'Zu Hause'], correctAnswer: 'Im Café', points: 5, explanation: 'The audio mentions "Café Latte".' },
          { questionNumber: 2, type: 'mcq', prompt: 'Wie viel kostet das Buch?', audioText: 'Das Buch kostet zwölf Euro fünfzig.', options: ['10 €', '12,50 €', '15 €', '20 €'], correctAnswer: '12,50 €', points: 5, explanation: 'zwölf Euro fünfzig = 12.50 Euro.' },
          { questionNumber: 3, type: 'mcq', prompt: 'Wann fährt der nächste Zug nach München?', audioText: 'Der nächste Zug nach München fährt um achtzehn Uhr dreißig.', options: ['17:30', '18:00', '18:30', '19:00'], correctAnswer: '18:30', points: 5, explanation: 'achtzehn Uhr dreißig = 18:30.' },
        ],
      },
      {
        sectionType: 'reading',
        title: 'Lesen — Reading',
        instructions: 'Read the texts carefully and answer the questions.',
        timeLimit: 25,
        questions: [
          { questionNumber: 4, type: 'true_false', prompt: 'Text: "Liebe Anna, ich feiere am Samstag meinen Geburtstag. Die Party beginnt um 19 Uhr. Kannst du einen Kuchen mitbringen? Viele Grüße, Tim."\n\nFrage: Die Party von Tim ist am Sonntag.', options: ['Richtig', 'Falsch'], correctAnswer: 'Falsch', points: 5, explanation: 'The text states the party is "am Samstag" (Saturday), not Sunday.' },
          { questionNumber: 5, type: 'mcq', prompt: 'Text: "Sehr geehrte Damen und Herren, unsere Praxis ist vom 1. bis 15. August wegen Urlaub geschlossen. Im Notfall wenden Sie sich an Dr. Weber."\n\nWann ist die Praxis geöffnet?', options: ['Vom 1. bis 15. August', 'Ab dem 16. August', 'Nur am Wochenende', 'Nur für Notfälle'], correctAnswer: 'Ab dem 16. August', points: 5, explanation: 'Closed Aug 1–15, so open from Aug 16.' },
        ],
      },
      {
        sectionType: 'writing',
        title: 'Schreiben — Writing',
        instructions: 'Write a short message (30–40 words). Respond to all 3 points.',
        timeLimit: 20,
        questions: [
          { questionNumber: 6, type: 'writing', prompt: 'Ihr Freund Jan hat Sie zu seiner Geburtstagsparty eingeladen.\n• Bedanken Sie sich für die Einladung.\n• Sagen Sie, dass Sie kommen.\n• Fragen Sie, ob Sie etwas mitbringen sollen.', options: [], points: 15, explanation: 'A1 writing evaluated on 3 points (task=5, vocab=4, grammar=4, structure=2).' },
        ],
      },
    ],
  },
  {
    title: 'Goethe A2: Fit in Deutsch — Full Exam Simulation',
    level: 'A2',
    source: 'goethe',
    year: 2024,
    totalTime: 75,
    totalMarks: 60,
    passingMarks: 36,
    tags: ['goethe', 'a2', 'fit-in-deutsch'],
    sections: [
      {
        sectionType: 'listening',
        title: 'Hören — Listening',
        instructions: 'Listen to the interview and answer.',
        timeLimit: 20,
        questions: [
          { questionNumber: 1, type: 'mcq', prompt: 'Warum ist der Kurs ausgefallen?', audioText: 'Liebe Teilnehmer, der Deutschkurs fällt heute aus, weil die Dozentin krank ist.', options: ['Wegen Urlaub', 'Weil die Dozentin krank ist', 'Wegen Feiertag', 'Wegen Renovierung'], correctAnswer: 'Weil die Dozentin krank ist', points: 5, explanation: '"weil die Dozentin krank ist" is explicitly stated.' },
        ],
      },
      {
        sectionType: 'reading',
        title: 'Lesen — Reading',
        instructions: 'Read the email and answer.',
        timeLimit: 30,
        questions: [
          { questionNumber: 2, type: 'mcq', prompt: 'Email: "Hallo Sarah, ich habe eine neue Wohnung gefunden! Sie hat 3 Zimmer, einen Balkon und liegt direkt am Park. Am Wochenende ziehe ich um. Hast du Zeit zu helfen?"\n\nWas bittet der Absender?', options: ['Um Geld', 'Um Umzugshilfe', 'Um ein Rezept', 'Um Möbel'], correctAnswer: 'Um Umzugshilfe', points: 10, explanation: '"Hast du Zeit zu helfen?" for the move.' },
        ],
      },
      {
        sectionType: 'writing',
        title: 'Schreiben — Writing',
        instructions: 'Write a short email (40–50 words).',
        timeLimit: 25,
        questions: [
          { questionNumber: 3, type: 'writing', prompt: 'Sie können morgen nicht zum Deutschkurs kommen, weil Sie krank sind. Schreiben Sie Ihrer Lehrerin Frau Müller.\n• Grund für Ihre Abwesenheit\n• Entschuldigung\n• Frage nach den Hausaufgaben', options: [], points: 15, explanation: 'A2 writing evaluated on 3 content points + grammar + connectors.' },
        ],
      },
    ],
  },
  {
    title: 'Goethe B1: Zertifikat B1 — Full Exam Simulation',
    level: 'B1',
    source: 'goethe',
    year: 2024,
    totalTime: 90,
    totalMarks: 100,
    passingMarks: 60,
    tags: ['goethe', 'b1', 'zertifikat-b1'],
    sections: [
      {
        sectionType: 'reading',
        title: 'Lesen — Reading',
        instructions: 'Read the articles and answer.',
        timeLimit: 30,
        questions: [
          { questionNumber: 1, type: 'mcq', prompt: 'Warum essen mehr Deutsche vegetarisch oder vegan?', options: ['Wegen Gesundheitsproblemen', 'Wegen des Umweltschutzes', 'Wegen des Preises', 'Wegen des Geschmacks'], correctAnswer: 'Wegen des Umweltschutzes', points: 5, explanation: '"Umweltschutz" is mentioned as the main reason.' },
        ],
      },
      {
        sectionType: 'writing',
        title: 'Schreiben — Writing',
        instructions: 'Write a formal letter or post (80–100 words).',
        timeLimit: 30,
        questions: [
          { questionNumber: 2, type: 'writing', prompt: 'In Ihrem Stadtviertel soll ein neuer Supermarkt gebaut werden. Schreiben Sie einen Leserbrief an die Zeitung.\n• Standpunkt\n• 2 Argumente\n• Vorschlag', options: [], points: 25, explanation: 'B1 rubric: task=8, coherence=8, vocab=5, grammar=4.' },
        ],
      },
    ],
  },
];

// Helper to auto-seed if database has 0 test papers
async function autoSeedTestPapers() {
  const allPapers = [...A1_PRACTICE_PAPERS, ...GOETHE_EXAM_PAPERS].map((p) => ({
    ...p,
    isPublished: true,
  }));
  await TestPaper.deleteMany({});
  await TestPaper.insertMany(allPapers);
}

// ── List all test papers ─────────────────────────────────────────────────────
export const listTests = async (req: Request, res: Response): Promise<void> => {
  try {
    const { level } = req.query;
    let count = await TestPaper.countDocuments();
    if (count === 0) {
      await autoSeedTestPapers();
    }

    const filter: Record<string, any> = { isPublished: true };
    if (level && level !== 'all') filter.level = level;

    const papers = await TestPaper.find(filter)
      .select('title level source year totalTime totalMarks passingMarks tags sections')
      .lean();

    // Include section count and question count but not full question content
    const list = papers.map((p) => ({
      _id: p._id,
      title: p.title,
      level: p.level,
      source: p.source,
      year: p.year,
      totalTime: p.totalTime,
      totalMarks: p.totalMarks,
      passingMarks: p.passingMarks,
      tags: p.tags,
      sectionCount: p.sections.length,
      questionCount: p.sections.reduce((acc, s) => acc + s.questions.length, 0),
    }));

    res.json(list);
  } catch (err) {
    console.error('listTests error:', err);
    res.status(500).json({ message: 'Failed to list tests.' });
  }
};

// ── Get a full test paper (no correct answers for non-writing questions) ──────
export const getTest = async (req: Request, res: Response): Promise<void> => {
  try {
    const paper = await TestPaper.findById(req.params.id);
    if (!paper) {
      res.status(404).json({ message: 'Test not found.' });
      return;
    }

    // Strip correct answers before sending to client
    const sanitized = {
      ...paper.toObject(),
      sections: paper.sections.map((sec) => ({
        ...((sec as any).toObject?.() ?? sec),
        questions: sec.questions.map((q) => {
          const qObj = (q as any).toObject?.() ?? { ...q };
          delete (qObj as any).correctAnswer;
          delete (qObj as any).explanation;
          return qObj;
        }),
      })),
    };

    res.json(sanitized);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load test.' });
  }
};

// ── Submit and grade a full test paper ────────────────────────────────────────
export const submitTest = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?._id;
    const { answers, timeSpent } = req.body as {
      answers: Record<string, any>;
      timeSpent: number;
    };

    const paper = await TestPaper.findById(req.params.id);
    if (!paper) {
      res.status(404).json({ message: 'Test paper not found.' });
      return;
    }

    let totalScore = 0;
    const sectionResults: any[] = [];

    for (const section of paper.sections) {
      let sectionScore = 0;
      let sectionMaxScore = 0;
      const questionResults: any[] = [];

      for (const q of section.questions) {
        sectionMaxScore += q.points;
        const userAnswer = answers[q.questionNumber.toString()];
        let isCorrect = false;
        let pointsEarned = 0;

        if (q.type === 'mcq' || q.type === 'true_false') {
          isCorrect =
            userAnswer !== undefined &&
            userAnswer?.toString().trim().toLowerCase() ===
              q.correctAnswer?.toString().trim().toLowerCase();
          pointsEarned = isCorrect ? q.points : 0;
        } else if (q.type === 'fill_blank') {
          isCorrect =
            userAnswer !== undefined &&
            userAnswer?.toString().trim().toLowerCase() ===
              q.correctAnswer?.toString().trim().toLowerCase();
          pointsEarned = isCorrect ? q.points : 0;
        }

        sectionScore += pointsEarned;
        questionResults.push({
          questionNumber: q.questionNumber,
          userAnswer: userAnswer ?? '',
          correctAnswer: q.correctAnswer,
          isCorrect,
          pointsEarned,
          maxPoints: q.points,
          explanation: q.explanation,
        });
      }

      totalScore += sectionScore;
      sectionResults.push({
        sectionType: section.sectionType,
        score: sectionScore,
        maxScore: sectionMaxScore,
        questionResults,
      });
    }

    const percentage = Math.round((totalScore / paper.totalMarks) * 100);
    const passed = totalScore >= paper.passingMarks;

    const testResult = await TestResult.create({
      userId,
      testPaperId: paper._id,
      score: totalScore,
      maxScore: paper.totalMarks,
      percentage,
      passed,
      timeSpent: timeSpent || 0,
      sectionResults,
    });

    res.json({
      resultId: testResult._id,
      score: totalScore,
      maxScore: paper.totalMarks,
      percentage,
      passed,
      passingMarks: paper.passingMarks,
      sectionResults,
    });
  } catch (err) {
    console.error('submitTest error:', err);
    res.status(500).json({ message: 'Failed to grade test.' });
  }
};

// ── Get past test result ──────────────────────────────────────────────────────
export const getResult = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await TestResult.findById(req.params.resultId).populate('testPaperId', 'title level');
    if (!result) {
      res.status(404).json({ message: 'Result not found.' });
      return;
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load result.' });
  }
};

// ── Seed sample test papers (admin or user trigger) ───────────────────────────
export const seedTestPapers = async (_req: Request, res: Response): Promise<void> => {
  try {
    await autoSeedTestPapers();
    const count = await TestPaper.countDocuments();
    res.json({ message: `Seeded ${count} test papers successfully.` });
  } catch (err) {
    console.error('seedTestPapers error:', err);
    res.status(500).json({ message: 'Seed failed.' });
  }
};
