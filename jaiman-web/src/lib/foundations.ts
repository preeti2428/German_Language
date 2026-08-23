/**
 * Phase 0 — Foundations: the pre-A1 decks that take a learner from zero.
 * Ordered easiest-first; the flashcards page unlocks each deck when the
 * previous one is 80% learned. `say` is what the TTS speaks (a bare letter
 * spoken with the German voice says its German name — exactly the lesson).
 */

export interface FCard {
  front: string;
  back: string;
  hint?: string;
  say?: string;
}

export interface FDeck {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  color: string;
  bg: string;
  cards: FCard[];
}

const L = (front: string, back: string, hint?: string): FCard => ({ front, back, hint });

export const FOUNDATION_DECKS: FDeck[] = [
  {
    id: 'f1',
    title: 'The Alphabet',
    subtitle: 'How Germans say their ABC',
    emoji: '🔤',
    color: '#4361EE',
    bg: '#EEF2FF',
    cards: [
      L('A', '„ah"', "like a in 'father'"),
      L('B', '„beh"'),
      L('C', '„tseh"'),
      L('D', '„deh"'),
      L('E', '„eh"', "like e in 'bed'"),
      L('F', '„eff"'),
      L('G', '„geh"', 'always a hard g, as in go'),
      L('H', '„hah"'),
      L('I', '„ee"', "like ee in 'see'"),
      L('J', '„yot"', 'J sounds like English Y — ja = "ya"'),
      L('K', '„kah"'),
      L('L', '„ell"'),
      L('M', '„emm"'),
      L('N', '„enn"'),
      L('O', '„oh"'),
      L('P', '„peh"'),
      L('Q', '„kuh"', 'qu sounds like "kv" — Quiz = "kvits"'),
      L('R', '„err"', 'gargled at the back of the throat'),
      L('S', '„ess"', 'before a vowel it buzzes like z — Sie = "zee"'),
      L('T', '„teh"'),
      L('U', '„uh"', "like oo in 'moon'"),
      L('V', '„fau"', 'usually sounds like F — Vater = "fah-ta"'),
      L('W', '„veh"', 'sounds like English V — Wasser = "vasser"'),
      L('X', '„iks"'),
      L('Y', '„üpsilon"', 'rare; sounds like ü'),
      L('Z', '„tset"', 'sounds like TS — zehn = "tsehn"'),
    ],
  },
  {
    id: 'f2',
    title: 'Umlauts & ß',
    subtitle: 'The four special letters',
    emoji: '✨',
    color: '#CE82FF',
    bg: '#F7EDFF',
    cards: [
      { front: 'ä', back: '„eh"', hint: "like e in 'bed' — Mädchen", say: 'Mädchen' },
      { front: 'ö', back: 'say „ay" with rounded lips', hint: 'schön, hören', say: 'schön' },
      { front: 'ü', back: 'say „ee" with rounded lips', hint: 'über, fünf, Tschüss', say: 'über' },
      { front: 'ß', back: 'a sharp double-S', hint: 'heißen, Straße — never at the start of a word', say: 'heißen' },
    ],
  },
  {
    id: 'f3',
    title: 'Sound Combos',
    subtitle: 'Read any German word',
    emoji: '🔊',
    color: '#FF9F43',
    bg: '#FFF4E6',
    cards: [
      { front: 'sch', back: '„sh"', hint: 'Schule = "shoo-luh"', say: 'Schule' },
      { front: 'ch (soft)', back: 'a hissed „sh" behind the teeth', hint: 'after e/i — ich, nicht', say: 'ich' },
      { front: 'ch (hard)', back: 'a throaty „kh"', hint: 'after a/o/u — Buch, acht', say: 'acht' },
      { front: 'ei', back: '„eye"', hint: 'nein = "nine", eins = "eyns"', say: 'nein' },
      { front: 'ie', back: '„ee"', hint: 'wie = "vee", sieben = "zee-ben"', say: 'wie' },
      { front: 'eu', back: '„oy"', hint: 'Deutsch = "doytch", neun = "noyn"', say: 'Deutsch' },
      { front: 'äu', back: '„oy" too', hint: 'Häuser = "hoy-za"', say: 'Häuser' },
      { front: 'au', back: '„ow"', hint: 'Frau = "frow", auch = "owkh"', say: 'Frau' },
      { front: 'st- (start)', back: '„sht"', hint: 'Straße = "shtrah-suh"', say: 'Straße' },
      { front: 'sp- (start)', back: '„shp"', hint: 'sprechen = "shpre-khen"', say: 'sprechen' },
      { front: '-er (end)', back: 'a soft „a"', hint: 'Mutter = "mut-ta"', say: 'Mutter' },
      { front: '-e (end)', back: 'a soft „uh" — never silent', hint: 'bitte = "bit-tuh"', say: 'bitte' },
      { front: 'z', back: '„ts"', hint: 'Zeit = "tsite", zwei = "tsvy"', say: 'zwei' },
    ],
  },
  {
    id: 'f4',
    title: 'Numbers 0–12',
    subtitle: 'The ones you memorise',
    emoji: '🔢',
    color: '#20BF6B',
    bg: '#E8FBF0',
    cards: [
      L('null', '0'), L('eins', '1'), L('zwei', '2'), L('drei', '3'),
      L('vier', '4'), L('fünf', '5'), L('sechs', '6'), L('sieben', '7'),
      L('acht', '8'), L('neun', '9'), L('zehn', '10'), L('elf', '11'), L('zwölf', '12'),
    ],
  },
  {
    id: 'f5',
    title: 'Numbers 13–1000',
    subtitle: 'The patterns, not a list',
    emoji: '💯',
    color: '#4CC9F0',
    bg: '#E8F8FE',
    cards: [
      L('dreizehn', '13', 'pattern: digit + zehn'),
      L('vierzehn', '14'),
      L('sechzehn', '16', 'careful: sechs drops its s'),
      L('siebzehn', '17', 'careful: sieben drops its en'),
      L('zwanzig', '20'),
      L('einundzwanzig', '21', 'Germans say it BACKWARDS: "one-and-twenty"'),
      L('zweiunddreißig', '32', '"two-and-thirty"'),
      L('dreißig', '30', 'spelled with ß, not z'),
      L('vierzig', '40'),
      L('fünfzig', '50'),
      L('sechzig', '60', 'drops the s again'),
      L('siebzig', '70', 'drops the en again'),
      L('hundert', '100'),
      L('tausend', '1000'),
    ],
  },
  {
    id: 'f6',
    title: 'Days & Seasons',
    subtitle: 'The calendar words',
    emoji: '📅',
    color: '#F7B731',
    bg: '#FDF6E4',
    cards: [
      L('Montag', 'Monday', '"moon-day", just like English'),
      L('Dienstag', 'Tuesday'),
      L('Mittwoch', 'Wednesday', 'literally "mid-week"'),
      L('Donnerstag', 'Thursday', '"thunder-day"'),
      L('Freitag', 'Friday'),
      L('Samstag', 'Saturday'),
      L('Sonntag', 'Sunday', '"sun-day"'),
      L('der Frühling', 'spring'),
      L('der Sommer', 'summer'),
      L('der Herbst', 'autumn'),
      L('der Winter', 'winter'),
      L('das Jahr', 'year'),
      L('der Monat', 'month'),
      L('die Woche', 'week'),
    ],
  },
  {
    id: 'f7',
    title: 'Colors & Survival Phrases',
    subtitle: 'Never get stuck in class',
    emoji: '🎨',
    color: '#FF4757',
    bg: '#FFF0F0',
    cards: [
      L('rot', 'red'), L('blau', 'blue'), L('grün', 'green'), L('gelb', 'yellow'),
      L('schwarz', 'black'), L('weiß', 'white'), L('orange', 'orange'), L('braun', 'brown'),
      L('Wie sagt man das auf Deutsch?', 'How do you say that in German?'),
      L('Ich verstehe nicht.', "I don't understand."),
      L('Langsamer, bitte!', 'Slower, please!'),
      L('Noch einmal, bitte.', 'Once more, please.'),
      L('Was bedeutet das?', 'What does that mean?'),
      L('Danke schön!', 'Thank you very much!'),
    ],
  },
];

/** Deck N unlocks when the previous deck is at least this % learned. */
export const UNLOCK_PCT = 80;
