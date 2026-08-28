import os
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

# ── Colors ───────────────────────────────────────────────────────────────────
PRIMARY = colors.HexColor('#1A1A2E')      # Deep navy
ACCENT = colors.HexColor('#E53935')       # German with Jai Red
SECONDARY = colors.HexColor('#4361EE')    # Royal Blue
SUCCESS = colors.HexColor('#20BF6B')      # Forest Green
BG_LIGHT = colors.HexColor('#F8F9FA')     # Soft grey
BORDER_COLOR = colors.HexColor('#E0E0E0') # Light border
TEXT_MUTED = colors.HexColor('#666666')   # Secondary text

# ── Numbered Canvas for Footer / Header ─────────────────────────────────────
class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor('#9E9E9E'))
        
        # Header (pages 2+)
        if self._pageNumber > 1:
            self.drawString(40, 805, "German with Jai • A1 Multiple-Choice Practice Test Papers")
            self.setStrokeColor(BORDER_COLOR)
            self.setLineWidth(0.5)
            self.line(40, 798, 555, 798)
            
        # Footer
        self.setStrokeColor(BORDER_COLOR)
        self.setLineWidth(0.5)
        self.line(40, 45, 555, 45)
        
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(ACCENT)
        self.drawString(40, 32, "German with Jai")
        self.setFillColor(TEXT_MUTED)
        self.setFont("Helvetica", 8)
        self.drawString(110, 32, "•  A1 CEFR Exam Preparation Series")
        
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(555, 32, page_str)
        self.restoreState()


# ── Test Papers Data ────────────────────────────────────────────────────────
PAPERS_DATA = [
    {
        "id": 1,
        "title": "Greetings & Introductions",
        "subtitle": "Begrüßung & Kennenlernen",
        "description": "Basic conversational greetings, introducing oneself, asking questions about origin and age.",
        "questions": [
            ("How do you say 'Hello' (informal) in German?", ["Tschüss", "Hallo", "Danke", "Bitte"], "B"),
            ("What does 'Guten Morgen' mean?", ["Good evening", "Good night", "Good morning", "Good afternoon"], "C"),
            ("Which phrase means 'Good evening'?", ["Guten Tag", "Guten Abend", "Gute Nacht", "Guten Morgen"], "B"),
            ("How do you say 'My name is...' in German?", ["Ich bin...", "Ich heiße...", "Ich habe...", "Ich komme..."], "B"),
            ("What is the German word for 'goodbye' (informal)?", ["Hallo", "Bitte", "Tschüss", "Danke"], "C"),
            ("'Wie geht es dir?' means...", ["What is your name?", "Where are you from?", "How are you?", "How old are you?"], "C"),
            ("A polite reply to 'Wie geht es dir?' is:", ["Mir geht es gut, danke.", "Ich bin fünfzehn.", "Ich komme aus Indien.", "Tschüss!"], "A"),
            ("How do you say 'Nice to meet you' in German?", ["Bis bald", "Schönen Tag", "Freut mich", "Gute Reise"], "C"),
            ("'Woher kommst du?' is asking...", ["What your name is", "Where you are from", "How old you are", "What you do"], "B"),
            ("The correct answer to 'Woher kommst du?' is:", ["Ich komme aus Indien.", "Ich heiße Anna.", "Ich bin 20 Jahre alt.", "Mir geht es gut."], "A"),
            ("'Wie alt bist du?' means:", ["What is your name?", "How old are you?", "How are you?", "Where do you live?"], "B"),
            ("Which is the formal way to say 'you' in German?", ["du", "ihr", "Sie", "wir"], "C"),
            ("'Auf Wiedersehen' is used to say...", ["Hello (formal)", "Goodbye (formal)", "Thank you", "Excuse me"], "B"),
            ("'Entschuldigung' means:", ["Please", "Thank you", "Excuse me / Sorry", "You're welcome"], "C"),
            ("How do you say 'Please' in German?", ["Danke", "Bitte", "Tschüss", "Ja"], "B")
        ]
    },
    {
        "id": 2,
        "title": "Numbers 0–100",
        "subtitle": "Zahlen von 0 bis 100",
        "description": "Cardinal numbers, compound numbers (einundzwanzig pattern), and basic counting rules.",
        "questions": [
            ("What is 'eins' in English?", ["Zero", "One", "Two", "Ten"], "B"),
            ("What is the German word for '5'?", ["vier", "fünf", "sechs", "sieben"], "B"),
            ("'zehn' means:", ["9", "10", "11", "20"], "B"),
            ("How do you say '20' in German?", ["zwölf", "zwanzig", "zehn", "zwei"], "B"),
            ("'dreizehn' is the number:", ["3", "13", "30", "31"], "B"),
            ("Which number is 'hundert'?", ["10", "100", "1000", "10000"], "B"),
            ("'siebzehn' means:", ["7", "17", "70", "71"], "B"),
            ("What is '50' in German?", ["fünfzig", "fünfzehn", "fünf", "fünfhundert"], "A"),
            ("'null' means:", ["One", "Nothing/Zero", "Ten", "None of these"], "B"),
            ("How do you say '21' (twenty-one) in German? (Hint: 'one-and-twenty')", ["zwanzigeins", "einundzwanzig", "zweiundzwanzig", "elfzwanzig"], "B"),
            ("'neun' means:", ["6", "9", "19", "90"], "B"),
            ("'zwölf' is the number:", ["2", "10", "12", "20"], "C"),
            ("What is '80' in German?", ["achtzehn", "achtzig", "acht", "achthundert"], "B"),
            ("'vierzig' means:", ["4", "14", "40", "44"], "C"),
            ("'sechzig' means:", ["6", "16", "60", "66"], "C")
        ]
    },
    {
        "id": 3,
        "title": "Personal Pronouns & Essential Verbs",
        "subtitle": "Personalpronomen & die Verben 'sein' und 'haben'",
        "description": "Subject pronouns (ich, du, er, sie, es, wir, ihr, sie/Sie) and conjugations of 'sein' & 'haben'.",
        "questions": [
            ("What does 'ich' mean?", ["you", "I", "he", "we"], "B"),
            ("'du' means:", ["I (informal)", "you (informal, singular)", "he", "they"], "B"),
            ("Which pronoun means 'she'?", ["er", "sie", "es", "wir"], "B"),
            ("'wir' means:", ["you (plural)", "they", "we", "I"], "C"),
            ("Complete: 'Ich ___ müde.' (I am tired)", ["bin", "bist", "ist", "sind"], "A"),
            ("Complete: 'Du ___ nett.' (You are nice)", ["bin", "bist", "ist", "seid"], "B"),
            ("Complete: 'Er ___ Lehrer.' (He is a teacher)", ["bin", "bist", "ist", "sind"], "C"),
            ("Complete: 'Wir ___ Studenten.' (We are students)", ["bin", "ist", "seid", "sind"], "D"),
            ("Which is the correct 'to have' form: 'Ich ___ ein Buch.' (I have a book)", ["habe", "hast", "hat", "haben"], "A"),
            ("Complete: 'Du ___ einen Hund.' (You have a dog)", ["habe", "hast", "hat", "habt"], "B"),
            ("Complete: 'Sie (she) ___ Zeit.' (She has time)", ["habe", "hast", "hat", "haben"], "C"),
            ("'ihr' (plural you) with 'sein' becomes:", ["ihr bin", "ihr bist", "ihr seid", "ihr sind"], "C"),
            ("'sie' (they) with 'haben' becomes:", ["sie habe", "sie hast", "sie hat", "sie haben"], "D"),
            ("Which pronoun means 'it'?", ["er", "sie", "es", "man"], "C"),
            ("Complete: 'Wir ___ Hunger.' (We are hungry)", ["habe", "hast", "haben", "hat"], "C")
        ]
    },
    {
        "id": 4,
        "title": "Articles & Nouns — der / die / das",
        "subtitle": "Bestimmte & unbestimmte Artikel (Genus)",
        "description": "Definite articles (der, die, das), indefinite articles (ein, eine), plurals, and noun capitalization.",
        "questions": [
            ("In German, every noun has a grammatical gender. How many genders are there?", ["2", "3", "4", "5"], "B"),
            ("The masculine definite article ('the') in the nominative case is:", ["die", "das", "der", "den"], "C"),
            ("The feminine definite article ('the') in the nominative case is:", ["der", "die", "das", "dem"], "B"),
            ("The neuter definite article ('the') in the nominative case is:", ["der", "die", "das", "des"], "C"),
            ("Which article goes with 'Mann' (man)? '___ Mann'", ["der", "die", "das", "den"], "A"),
            ("Which article goes with 'Frau' (woman)? '___ Frau'", ["der", "die", "das", "dem"], "B"),
            ("Which article goes with 'Kind' (child)? '___ Kind'", ["der", "die", "das", "den"], "C"),
            ("The indefinite article 'a/an' for masculine nouns is:", ["ein", "eine", "einen", "einer"], "A"),
            ("The indefinite article 'a/an' for feminine nouns is:", ["ein", "eine", "einen", "einem"], "B"),
            ("'Das Buch' means:", ["A book", "The book", "My book", "Some books"], "B"),
            ("The plural definite article ('the', for all genders) is:", ["der", "die", "das", "dem"], "B"),
            ("Which article goes with 'Tisch' (table)? '___ Tisch'", ["der", "die", "das", "den"], "A"),
            ("Which article goes with 'Lampe' (lamp)? '___ Lampe'", ["der", "die", "das", "dem"], "B"),
            ("Which article goes with 'Auto' (car)? '___ Auto'", ["der", "die", "das", "den"], "C"),
            ("German nouns always start with:", ["a lowercase letter", "a capital letter", "the letter 'd'", "an article only"], "B")
        ]
    },
    {
        "id": 5,
        "title": "Family Members",
        "subtitle": "Familie & Verwandte",
        "description": "Family vocabulary, nuclear and extended relatives, and relationship nouns.",
        "questions": [
            ("'die Mutter' means:", ["Father", "Mother", "Sister", "Daughter"], "B"),
            ("'der Vater' means:", ["Mother", "Brother", "Father", "Uncle"], "C"),
            ("'der Bruder' means:", ["Sister", "Brother", "Cousin", "Son"], "B"),
            ("'die Schwester' means:", ["Brother", "Sister", "Mother", "Aunt"], "B"),
            ("'die Tochter' means:", ["Son", "Daughter", "Wife", "Niece"], "B"),
            ("'der Sohn' means:", ["Daughter", "Son", "Grandfather", "Husband"], "B"),
            ("'die Großmutter' means:", ["Grandfather", "Grandmother", "Great-aunt", "Mother-in-law"], "B"),
            ("'der Großvater' means:", ["Grandmother", "Uncle", "Grandfather", "Father-in-law"], "C"),
            ("'die Eltern' means:", ["Children", "Parents", "Grandparents", "Relatives"], "B"),
            ("'der Onkel' means:", ["Uncle", "Aunt", "Nephew", "Cousin"], "A"),
            ("'die Tante' means:", ["Uncle", "Aunt", "Niece", "Grandmother"], "B"),
            ("'die Familie' means:", ["Friend", "Family", "Neighbor", "Colleague"], "B"),
            ("'der Mann' can mean:", ["Woman / wife", "Man / husband", "Child", "Friend"], "B"),
            ("'die Frau' can mean:", ["Man / husband", "Woman / wife", "Sister", "Girl only"], "B"),
            ("'das Kind' means:", ["Adult", "Child", "Baby only", "Teenager"], "B")
        ]
    },
    {
        "id": 6,
        "title": "Colors & Basic Adjectives",
        "subtitle": "Farben & grundlegende Adjektive",
        "description": "Color terms (rot, blau, grün, gelb, schwarz, weiß) and foundational descriptive adjectives.",
        "questions": [
            ("'rot' means:", ["Blue", "Red", "Green", "Yellow"], "B"),
            ("'blau' means:", ["Black", "White", "Blue", "Brown"], "C"),
            ("'grün' means:", ["Grey", "Green", "Gold", "Orange"], "B"),
            ("'gelb' means:", ["Yellow", "Purple", "Pink", "Silver"], "A"),
            ("'schwarz' means:", ["White", "Black", "Dark blue", "Brown"], "B"),
            ("'weiß' means:", ["Black", "White", "Grey", "Beige"], "B"),
            ("'braun' means:", ["Brown", "Orange", "Green", "Tan"], "A"),
            ("'groß' means:", ["Small", "Big/tall", "Wide", "Long"], "B"),
            ("'klein' means:", ["Big", "Small", "Short", "Thin"], "B"),
            ("'gut' means:", ["Bad", "Good", "Nice", "Great"], "B"),
            ("'schlecht' means:", ["Good", "Bad", "Fine", "New"], "B"),
            ("'neu' means:", ["Old", "New", "Used", "Broken"], "B"),
            ("'alt' means:", ["Young", "New", "Old", "Ancient only"], "C"),
            ("'schön' means:", ["Ugly", "Beautiful/nice", "Boring", "Strange"], "B"),
            ("'lila' means:", ["Purple", "Pink", "Lime", "Indigo"], "A")
        ]
    },
    {
        "id": 7,
        "title": "Days, Months & Time",
        "subtitle": "Wochentage, Monate & Uhrzeit",
        "description": "Days of the week, months of the year, telling time, and temporal adverbs (heute, morgen, gestern).",
        "questions": [
            ("'Montag' means:", ["Sunday", "Monday", "Tuesday", "Saturday"], "B"),
            ("'Mittwoch' means:", ["Tuesday", "Thursday", "Wednesday", "Friday"], "C"),
            ("'Freitag' means:", ["Friday", "Saturday", "Thursday", "Sunday"], "A"),
            ("'Sonntag' means:", ["Saturday", "Monday", "Sunday", "Friday"], "C"),
            ("'Januar' means:", ["June", "January", "July", "December"], "B"),
            ("'Dezember' means:", ["October", "November", "December", "September"], "C"),
            ("'heute' means:", ["Yesterday", "Tomorrow", "Today", "Now"], "C"),
            ("'morgen' (lowercase) means:", ["Morning only", "Tomorrow", "Yesterday", "Evening"], "B"),
            ("'gestern' means:", ["Today", "Tomorrow", "Yesterday", "Tonight"], "C"),
            ("'Wie viel Uhr ist es?' means:", ["What day is it?", "What time is it?", "What month is it?", "How old are you?"], "B"),
            ("'Es ist ein Uhr.' means:", ["It is one o'clock.", "It is Monday.", "It is January.", "It is one day."], "A"),
            ("'die Woche' means:", ["Day", "Week", "Month", "Year"], "B"),
            ("'der Monat' means:", ["Week", "Month", "Year", "Season"], "B"),
            ("'das Jahr' means:", ["Day", "Month", "Year", "Hour"], "C"),
            ("'Samstag' means:", ["Sunday", "Saturday", "Wednesday", "Friday"], "B")
        ]
    },
    {
        "id": 8,
        "title": "Food & Drinks",
        "subtitle": "Essen & Trinken",
        "description": "Essential foods, beverages, restaurant phrases, and polite ordering with 'Ich möchte...'.",
        "questions": [
            ("'das Brot' means:", ["Butter", "Bread", "Milk", "Cheese"], "B"),
            ("'das Wasser' means:", ["Juice", "Water", "Milk", "Wine"], "B"),
            ("'die Milch' means:", ["Milk", "Coffee", "Tea", "Beer"], "A"),
            ("'der Kaffee' means:", ["Cocoa", "Tea", "Coffee", "Juice"], "C"),
            ("'der Apfel' means:", ["Orange", "Apple", "Banana", "Grape"], "B"),
            ("'die Suppe' means:", ["Salad", "Soup", "Sauce", "Stew"], "B"),
            ("'das Fleisch' means:", ["Fish", "Vegetable", "Meat", "Egg"], "C"),
            ("'der Käse' means:", ["Cheese", "Cream", "Cake", "Egg"], "A"),
            ("'das Ei' means:", ["Egg", "Oil", "Ice", "Onion"], "A"),
            ("'der Zucker' means:", ["Salt", "Sugar", "Pepper", "Honey"], "B"),
            ("'das Salz' means:", ["Sugar", "Salt", "Spice", "Oil"], "B"),
            ("'Ich möchte...' means:", ["I have...", "I want / I would like...", "I am...", "I eat..."], "B"),
            ("'der Tee' means:", ["Tea", "Coffee", "Toast", "Sauce"], "A"),
            ("'das Obst' means:", ["Vegetables", "Fruit", "Meat", "Bread"], "B"),
            ("'das Gemüse' means:", ["Fruit", "Vegetables", "Meat", "Grain"], "B")
        ]
    },
    {
        "id": 9,
        "title": "Question Words & Survival Phrases",
        "subtitle": "W-Fragen & wichtige Redewendungen",
        "description": "Key German question words (Was, Wer, Wo, Wann, Warum, Wie) and essential communication phrases.",
        "questions": [
            ("'Was' means:", ["Who", "What", "Where", "When"], "B"),
            ("'Wer' means:", ["What", "Who", "Why", "How"], "B"),
            ("'Wo' means:", ["Who", "When", "Where", "Why"], "C"),
            ("'Wann' means:", ["Where", "When", "Why", "Which"], "B"),
            ("'Warum' means:", ["What", "Where", "Why", "Who"], "C"),
            ("'Wie' means:", ["How", "Who", "Which", "What"], "A"),
            ("'Welche(r/s)' means:", ["Whose", "Which", "Whom", "Why"], "B"),
            ("'Wie viel' means:", ["How many/much", "How often", "How far", "How long"], "A"),
            ("'Ich verstehe nicht.' means:", ["I don't know.", "I don't understand.", "I can't speak German.", "I am not sure."], "B"),
            ("'Können Sie das wiederholen?' means:", ["Can you help me?", "Can you repeat that?", "Can you speak slower?", "Can you write it down?"], "B"),
            ("'Sprechen Sie Englisch?' means:", ["Do you speak English?", "Do you understand me?", "Are you from England?", "Do you like English?"], "A"),
            ("'Wie bitte?' is used to say:", ["Please", "Pardon? / What did you say?", "You're welcome", "No problem"], "B"),
            ("'Kein Problem' means:", ["No problem", "No thanks", "Not now", "Never mind"], "A"),
            ("'Ich weiß nicht.' means:", ["I don't understand.", "I don't know.", "I don't have it.", "I don't want it."], "B"),
            ("'Langsam, bitte.' means:", ["Quickly, please.", "Again, please.", "Slowly, please.", "Louder, please."], "C")
        ]
    },
    {
        "id": 10,
        "title": "Comprehensive Mixed Review",
        "subtitle": "Abschlussprüfung — Alle Themen",
        "description": "Comprehensive review test paper assessing all beginner grammar, vocabulary, articles, and phrases.",
        "questions": [
            ("'Guten Tag' means:", ["Good night", "Good day/afternoon", "Good morning", "Goodbye"], "B"),
            ("What number is 'sechzehn'?", ["6", "16", "60", "66"], "B"),
            ("Complete: 'Ich ___ 18 Jahre alt.' (I am 18 years old)", ["bin", "bist", "habe", "hat"], "A"),
            ("Which article is correct? '___ Hund' (the dog, masculine)", ["der", "die", "das", "den"], "A"),
            ("'die Schwester' means:", ["Mother", "Sister", "Aunt", "Daughter"], "B"),
            ("'rot' and 'blau' together describe:", ["Numbers", "Colors", "Days", "Foods"], "B"),
            ("'Dienstag' means:", ["Monday", "Tuesday", "Thursday", "Sunday"], "B"),
            ("'das Brot' means:", ["Water", "Cheese", "Bread", "Meat"], "C"),
            ("'Warum' is used to ask:", ["Where", "Why", "When", "Who"], "B"),
            ("'Wir haben Zeit.' means:", ["We are on time.", "We have time.", "We are late.", "We had time."], "B"),
            ("Which word means 'today'?", ["gestern", "morgen", "heute", "jetzt"], "C"),
            ("'die Mutter' and 'der Vater' together mean:", ["Siblings", "Parents", "Grandparents", "Children"], "B"),
            ("'Ich möchte Wasser, bitte.' means:", ["I have water, thanks.", "I want water, please.", "I need water urgently.", "I drank water already."], "B"),
            ("'Wie geht es dir?' is a way to ask:", ["What's your name?", "How are you?", "Where do you live?", "How old are you?"], "B"),
            ("The plural article 'die' (for all genders) is used before words like:", ["Bücher (books)", "Buch (book, singular)", "Mann (man)", "Frau (woman)"], "A")
        ]
    }
]


def create_test_paper_pdf(paper, output_filepath):
    doc = SimpleDocTemplate(
        output_filepath,
        pagesize=A4,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=PRIMARY
    )
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=ACCENT
    )
    desc_style = ParagraphStyle(
        'DocDesc',
        fontName='Helvetica',
        fontSize=8.5,
        leading=11,
        textColor=TEXT_MUTED
    )
    instr_style = ParagraphStyle(
        'InstrStyle',
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=PRIMARY
    )
    q_num_style = ParagraphStyle(
        'QNum',
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=ACCENT
    )
    q_text_style = ParagraphStyle(
        'QText',
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=PRIMARY
    )
    opt_style = ParagraphStyle(
        'OptStyle',
        fontName='Helvetica',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#2C3E50')
    )
    ans_key_title = ParagraphStyle(
        'AnsKeyTitle',
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=SUCCESS
    )

    story = []

    # ── Header Banner ────────────────────────────────────────────────────────
    brand_table_data = [
        [
            Paragraph("<b>GERMAN WITH JAI</b><br/><font size='7.5' color='#666666'>A1 German Test Series • Practice Booklet</font>", title_style),
            Paragraph(f"<font size='9' color='#E53935'><b>TEST PAPER {paper['id']} OF 10</b></font><br/><font size='7.5' color='#4361EE'><b>Level: CEFR A1 (Beginner)</b></font>", ParagraphStyle('RightH', parent=title_style, alignment=2))
        ]
    ]
    brand_table = Table(brand_table_data, colWidths=[320, 203])
    brand_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
    ]))
    story.append(brand_table)
    story.append(HRFlowable(width="100%", thickness=1.5, color=ACCENT, spaceAfter=8, spaceBefore=4))

    # ── Paper Title & Subtitle ───────────────────────────────────────────────
    story.append(Paragraph(f"Test Paper {paper['id']}: {paper['title']}", title_style))
    story.append(Paragraph(f"<b>German Topic:</b> {paper['subtitle']}", subtitle_style))
    story.append(Paragraph(paper['description'], desc_style))
    story.append(Spacer(1, 6))

    # ── Student Info Box ─────────────────────────────────────────────────────
    info_data = [
        [
            Paragraph("<b>Student Name:</b> ___________________________", desc_style),
            Paragraph("<b>Date:</b> _____________", desc_style),
            Paragraph("<b>Score:</b> ____ / 15", desc_style),
            Paragraph("<b>Time:</b> 20 Min", desc_style)
        ]
    ]
    info_table = Table(info_data, colWidths=[190, 110, 110, 113])
    info_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), BG_LIGHT),
        ('BOX', (0, 0), (-1, -1), 1, BORDER_COLOR),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 6))

    # ── Instructions ─────────────────────────────────────────────────────────
    inst_box = Table(
        [[Paragraph("<b>Instructions:</b> Read each question carefully and select the single best answer (A, B, C, or D). Each correct answer is worth <b>1 point</b> (Total: 15 points).", instr_style)]],
        colWidths=[523]
    )
    inst_box.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#EEF2FF')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#C5D0FF')),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(inst_box)
    story.append(Spacer(1, 8))

    # ── 15 Questions ─────────────────────────────────────────────────────────
    LETTERS = ['A', 'B', 'C', 'D']
    
    for idx, (q_text, opts, _) in enumerate(paper['questions'], 1):
        # Format options in 2x2 grid or compact horizontal layout
        opt_a = f"<b>A)</b> {opts[0]}"
        opt_b = f"<b>B)</b> {opts[1]}"
        opt_c = f"<b>C)</b> {opts[2]}"
        opt_d = f"<b>D)</b> {opts[3]}"

        q_row_data = [
            [
                Paragraph(f"<b>{idx}.</b>", q_num_style),
                Paragraph(f"<b>{q_text}</b>", q_text_style)
            ]
        ]
        q_header_table = Table(q_row_data, colWidths=[20, 503])
        q_header_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('TOPPADDING', (0, 0), (-1, -1), 0),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 1),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ]))

        # Options table: 2 columns
        opts_data = [
            [Paragraph(opt_a, opt_style), Paragraph(opt_b, opt_style)],
            [Paragraph(opt_c, opt_style), Paragraph(opt_d, opt_style)]
        ]
        opts_table = Table(opts_data, colWidths=[250, 253])
        opts_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 1),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 1),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 4),
        ]))

        q_block = Table(
            [[q_header_table], [opts_table]],
            colWidths=[523]
        )
        bg = colors.HexColor('#FAFAFA') if idx % 2 == 0 else colors.white
        q_block.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), bg),
            ('BOX', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ]))

        story.append(KeepTogether(q_block))
        story.append(Spacer(1, 3))

    # ── Answer Key & Evaluation Section (Page 2) ─────────────────────────────
    story.append(PageBreak())
    
    story.append(Paragraph(f"Answer Key & Evaluation — Test Paper {paper['id']}", ans_key_title))
    story.append(Paragraph(f"<b>Topic:</b> {paper['title']} ({paper['subtitle']})", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1, color=SUCCESS, spaceAfter=8, spaceBefore=4))

    # Key table (3 rows of 5 columns)
    key_headers = [f"Q{i}" for i in range(1, 16)]
    key_answers = [f"<b>{paper['questions'][i-1][2]}</b>" for i in range(1, 16)]
    
    # Split into 3 chunks of 5
    grid_rows = [
        ["<b>Question</b>", "Q1", "Q2", "Q3", "Q4", "Q5", "Q6", "Q7", "Q8", "Q9", "Q10", "Q11", "Q12", "Q13", "Q14", "Q15"],
        ["<b>Correct Key</b>"] + [f"<b>{paper['questions'][i-1][2]}</b>" for i in range(1, 16)]
    ]
    
    key_table = Table(grid_rows, colWidths=[68] + [30.3]*15)
    key_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('BACKGROUND', (0, 1), (-1, 1), colors.HexColor('#E8FBF0')),
        ('TEXTCOLOR', (0, 1), (-1, 1), colors.HexColor('#1E7E34')),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#A5D6A7')),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
    ]))
    story.append(key_table)
    story.append(Spacer(1, 14))

    # Detailed Review List
    story.append(Paragraph("<b>Detailed Answer Explanations:</b>", instr_style))
    story.append(Spacer(1, 4))
    
    exp_data = []
    for idx, (q_text, opts, correct_letter) in enumerate(paper['questions'], 1):
        correct_idx = LETTERS.index(correct_letter)
        correct_text = opts[correct_idx]
        exp_data.append([
            Paragraph(f"<b>{idx}.</b>", q_num_style),
            Paragraph(f"{q_text}", opt_style),
            Paragraph(f"<b>{correct_letter}) {correct_text}</b>", ParagraphStyle('GreenKey', fontName='Helvetica-Bold', fontSize=8, textColor=colors.HexColor('#1E7E34')))
        ])
    
    exp_table = Table(exp_data, colWidths=[20, 280, 223])
    exp_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0, 0), (-1, -1), [colors.HexColor('#FAFAFA'), colors.white]),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(exp_table)
    story.append(Spacer(1, 14))

    # Performance Grading Scale
    scale_data = [
        [
            Paragraph("<b>14 – 15 Correct (90–100%)</b><br/><font color='#20BF6B'><b>🌟 Ausgezeichnet! (Mastered)</b></font><br/>Ready for next level topics.", opt_style),
            Paragraph("<b>11 – 13 Correct (70–89%)</b><br/><font color='#4361EE'><b>👍 Gut gemacht! (Proficient)</b></font><br/>Minor review needed.", opt_style),
            Paragraph("<b>0 – 10 Correct (&lt; 70%)</b><br/><font color='#E53935'><b>📖 Wiederholen! (Needs Practice)</b></font><br/>Review vocabulary before moving on.", opt_style),
        ]
    ]
    scale_table = Table(scale_data, colWidths=[174, 174, 175])
    scale_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, 0), colors.HexColor('#E8FBF0')),
        ('BACKGROUND', (1, 0), (1, 0), colors.HexColor('#EEF2FF')),
        ('BACKGROUND', (2, 0), (2, 0), colors.HexColor('#FFF5F5')),
        ('BOX', (0, 0), (-1, -1), 1, BORDER_COLOR),
        ('INNERGRID', (0, 0), (-1, -1), 1, BORDER_COLOR),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(KeepTogether([
        Paragraph("<b>CEFR A1 Performance Grading Scale:</b>", instr_style),
        Spacer(1, 4),
        scale_table
    ]))

    doc.build(story, canvasmaker=NumberedCanvas)


def generate_all_pdfs():
    out_dir = r"c:\Users\PREETI\German_Language\test_papers_pdf"
    web_dir = r"c:\Users\PREETI\German_Language\jaiman-web\public\downloads\test-papers"
    
    os.makedirs(out_dir, exist_ok=True)
    os.makedirs(web_dir, exist_ok=True)

    generated_files = []

    for paper in PAPERS_DATA:
        filename = f"A1_German_Test_Paper_{paper['id']}_{paper['title'].replace(' ', '_').replace('&', 'and').replace('/', '_')}.pdf"
        out_path = os.path.join(out_dir, filename)
        web_path = os.path.join(web_dir, filename)
        
        print(f"Generating Test Paper {paper['id']}: {paper['title']}...")
        create_test_paper_pdf(paper, out_path)
        
        # Also copy to web public folder
        create_test_paper_pdf(paper, web_path)
        generated_files.append((paper['id'], paper['title'], out_path))

    print(f"\nSuccessfully generated all {len(generated_files)} PDF Test Papers!")
    return generated_files

if __name__ == "__main__":
    generate_all_pdfs()
