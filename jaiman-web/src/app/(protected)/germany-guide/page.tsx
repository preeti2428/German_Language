'use client';

import { useState } from 'react';
import { MapPin, ChevronDown, ChevronUp, Volume2, CheckCircle } from 'lucide-react';
import { speakGerman } from '@/lib/speech';
import { useDailyTimer } from '@/hooks/useDailyTimer';

const TOPICS = [
  {
    id: 'flughafen',
    title: 'Am Flughafen',
    titleEn: 'At the Airport',
    emoji: '✈️',
    color: '#1565C0',
    colorLight: '#E3F2FD',
    colorBorder: '#90CAF9',
    situation: 'You just landed in Germany. You need to get through passport control and find the train.',
    phrases: [
      { de: 'Guten Tag, hier ist mein Reisepass.', en: 'Good day, here is my passport.', tip: 'Always have your passport ready at immigration.' },
      { de: 'Ich bin hier zum Studium.', en: 'I am here for studies.', tip: 'State your purpose of stay clearly.' },
      { de: 'Ich bleibe für sechs Monate.', en: 'I am staying for six months.', tip: 'Have your enrollment letter handy.' },
      { de: 'Wo ist die S-Bahn zum Stadtzentrum?', en: 'Where is the S-Bahn to the city center?', tip: 'S-Bahn = city rail. U-Bahn = subway.' },
      { de: 'Ein Ticket nach München Hauptbahnhof, bitte.', en: 'One ticket to Munich Central Station, please.', tip: 'Always validate your ticket before boarding!' },
      { de: 'Entschuldigung, wo ist mein Gepäck?', en: 'Excuse me, where is my luggage?', tip: 'Check the display boards for your flight number.' },
    ],
  },
  {
    id: 'anmeldung',
    title: 'Die Anmeldung',
    titleEn: 'City Registration (Bürgeramt)',
    emoji: '🏢',
    color: '#E53935',
    colorLight: '#FFF5F5',
    colorBorder: '#FFCDD2',
    situation: 'You must register your address at the Bürgeramt within 14 days of moving in. This is legally required.',
    phrases: [
      { de: 'Ich möchte mich anmelden.', en: 'I would like to register my address.', tip: 'This is mandatory (Pflicht) within 14 days.' },
      { de: 'Ich brauche einen Termin.', en: 'I need an appointment.', tip: 'Book online at berlin.de or your city\'s website.' },
      { de: 'Hier ist meine Wohnungsgeberbestätigung.', en: 'Here is my landlord confirmation.', tip: 'Your landlord must fill this form for you.' },
      { de: 'Wann bekomme ich die Meldebestätigung?', en: 'When will I get the registration confirmation?', tip: 'You get it on the spot — keep it safe!' },
      { de: 'Sprechen Sie Englisch?', en: 'Do you speak English?', tip: 'Ask politely — many officials can help in English.' },
    ],
  },
  {
    id: 'wohnung',
    title: 'Wohnungssuche & WG',
    titleEn: 'Flat Hunting & Shared Housing',
    emoji: '🏠',
    color: '#43A047',
    colorLight: '#E8F5E9',
    colorBorder: '#A5D6A7',
    situation: 'You\'re viewing a WG (shared flat) and meeting potential flatmates at a Casting.',
    phrases: [
      { de: 'Ich suche ein WG-Zimmer.', en: 'I am looking for a room in a shared flat.', tip: 'WG = Wohngemeinschaft. Check WG-Gesucht.de.' },
      { de: 'Wie hoch ist die Miete inklusive Nebenkosten?', en: 'How much is the rent including utilities?', tip: 'Always clarify if utilities (Nebenkosten) are included.' },
      { de: 'Wann kann ich einziehen?', en: 'When can I move in?', tip: 'Have your documents ready: passport, income proof, SCHUFA.' },
      { de: 'Gibt es eine Waschmaschine?', en: 'Is there a washing machine?', tip: 'Very important! Laundromats exist but are expensive.' },
      { de: 'Ich bin ruhig und ordentlich.', en: 'I am quiet and tidy.', tip: 'Flatmates appreciate cleanliness — say it honestly!' },
      { de: 'Kann ich die Wohnung heute besichtigen?', en: 'Can I view the flat today?', tip: 'Speed matters — respond to listings within hours.' },
    ],
  },
  {
    id: 'supermarkt',
    title: 'Im Supermarkt',
    titleEn: 'At the Supermarket',
    emoji: '🛒',
    color: '#FF9F43',
    colorLight: '#FFF8EE',
    colorBorder: '#FFE0B2',
    situation: 'You\'re at ALDI or REWE. The checkout is fast and cashiers don\'t wait for you!',
    phrases: [
      { de: 'Haben Sie eine Kundenkarte?', en: 'Do you have a loyalty card?', tip: 'Say "Nein, danke" if you don\'t have one.' },
      { de: 'Mit Karte, bitte.', en: 'By card, please.', tip: 'Germany loves cash! But cards are widely accepted now.' },
      { de: 'Ich zahle bar.', en: 'I\'m paying cash.', tip: 'Bar = cash. Always carry some Euros.' },
      { de: 'Wo sind die Einkaufstüten?', en: 'Where are the shopping bags?', tip: 'Bring your own bag! Plastic bags cost extra.' },
      { de: 'Entschuldigung, wo finde ich den Käse?', en: 'Excuse me, where can I find the cheese?', tip: 'German cheese aisle = Käsetheke. Amazing variety!' },
      { de: 'Das stimmt nicht. Können Sie nochmal nachschauen?', en: 'That\'s not correct. Could you check again?', tip: 'Be polite but firm if there\'s a price error.' },
    ],
  },
  {
    id: 'transport',
    title: 'Öffentliche Verkehrsmittel',
    titleEn: 'Public Transport',
    emoji: '🚇',
    color: '#6A1B9A',
    colorLight: '#F3E5F5',
    colorBorder: '#CE93D8',
    situation: 'Using the U-Bahn, S-Bahn, Bus, or Tram. Don\'t forget to validate your ticket!',
    phrases: [
      { de: 'Bitte einmal nach Alexanderplatz.', en: 'One ticket to Alexanderplatz, please.', tip: 'Say the destination clearly when buying at the counter.' },
      { de: 'Ist das der richtige Zug nach Frankfurt?', en: 'Is this the right train to Frankfurt?', tip: 'Check the display above the doors. Destinations are listed.' },
      { de: 'Ich habe meinen Fahrschein nicht entwertet.', en: 'I have not validated my ticket.', tip: 'ALWAYS validate (entwerten) before boarding. Inspectors (Kontrolleure) check randomly!' },
      { de: 'Entschuldigung, ich muss aussteigen.', en: 'Excuse me, I need to get off.', tip: 'Say this to get past people blocking the door.' },
      { de: 'Ist dieser Platz frei?', en: 'Is this seat free?', tip: 'Always ask before sitting next to someone.' },
      { de: 'Der Zug hat Verspätung.', en: 'The train is delayed.', tip: 'This is common with Deutsche Bahn (DB). Check the DB Navigator app.' },
    ],
  },
  {
    id: 'arzt',
    title: 'Beim Arzt / Krankenversicherung',
    titleEn: 'At the Doctor / Health Insurance',
    emoji: '🏥',
    color: '#E53935',
    colorLight: '#FFF5F5',
    colorBorder: '#FFCDD2',
    situation: 'You need to visit a doctor or sort out your health insurance (Krankenversicherung). Mandatory in Germany!',
    phrases: [
      { de: 'Ich brauche einen Termin beim Arzt.', en: 'I need a doctor\'s appointment.', tip: 'Use the Doctolib or Jameda app to book online.' },
      { de: 'Ich bin neu in Deutschland und brauche Krankenversicherung.', en: 'I am new to Germany and need health insurance.', tip: 'As a student, get public insurance through TK, AOK, or Barmer.' },
      { de: 'Hier ist meine Versicherungskarte.', en: 'Here is my insurance card.', tip: 'Always bring your Krankenkassenkarte to appointments.' },
      { de: 'Ich habe Kopfschmerzen / Bauchschmerzen.', en: 'I have a headache / stomach ache.', tip: 'Name your symptom simply and the doctor will understand.' },
      { de: 'Wo ist die nächste Apotheke?', en: 'Where is the nearest pharmacy?', tip: 'Apotheke (green cross sign) — prescription needed for many meds.' },
    ],
  },
];

export default function GermanyGuidePage() {
  useDailyTimer(true);
  const [open, setOpen] = useState<string | null>(null);
  const [done, setDone] = useState<Set<string>>(new Set());

  const toggle = (id: string) => setOpen(prev => prev === id ? null : id);
  const markDone = (id: string) => setDone(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  return (
    <div className="min-h-screen bg-[#F5F6FA] p-6">
      {/* Header */}
      <header className="mb-6">
        <p className="dj-crumb">DISCOVER · GUIDE</p>
        <h1 className="dj-title flex items-center gap-2">
          <MapPin className="text-[#E53935]" size={26} />
          First Time in Germany? 🇩🇪
        </h1>
        <p className="text-sm text-[#9E9E9E] mt-1">
          Moving or traveling to Germany for the first time? Master essential situations, spoken phrases, and practical local tips.
        </p>
      </header>

      {/* Progress chips */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="dj-chip dj-chip-xp">
          <CheckCircle size={15} className="text-[#43A047]" />
          {done.size}/{TOPICS.length} Topics Explored
        </div>
        <div className="dj-chip text-xs text-[#9E9E9E]">
          🇩🇪 {TOPICS.length} Real Situations
        </div>
      </div>

      {/* Topic Cards */}
      <div className="flex flex-col gap-3">
        {TOPICS.map((topic) => {
          const isOpen = open === topic.id;
          const isDone = done.has(topic.id);
          return (
            <div
              key={topic.id}
              className="bg-white rounded-[1.5rem] border border-[#EAEAEA] border-b-[4px] overflow-hidden"
              style={{ borderBottomColor: topic.color }}
            >
              {/* Topic Header */}
              <button
                onClick={() => { toggle(topic.id); if (!isDone) markDone(topic.id); }}
                className="w-full flex items-center gap-4 p-4 text-left hover:bg-[#FAFAFA] transition-colors"
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: topic.colorLight, border: `1.5px solid ${topic.colorBorder}` }}
                >
                  {topic.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-black text-[#1A1A2E] text-sm">{topic.title}</p>
                    {isDone && (
                      <span className="text-[9px] font-black text-[#43A047] bg-[#E8F5E9] border border-[#A5D6A7] px-2 py-0.5 rounded-full">✓ DONE</span>
                    )}
                  </div>
                  <p className="text-xs text-[#9E9E9E] font-medium">{topic.titleEn}</p>
                </div>
                <div className="flex-shrink-0">
                  {isOpen
                    ? <ChevronUp size={18} className="text-[#BDBDBD]" />
                    : <ChevronDown size={18} className="text-[#BDBDBD]" />
                  }
                </div>
              </button>

              {/* Expanded Content */}
              {isOpen && (
                <div className="border-t border-[#F5F5F5] px-5 pb-5 animate-slide-up">
                  {/* Situation box */}
                  <div
                    className="mt-4 mb-4 p-3 rounded-xl text-xs font-medium"
                    style={{ background: topic.colorLight, color: topic.color, border: `1px solid ${topic.colorBorder}` }}
                  >
                    <span className="font-black">📍 Situation: </span>{topic.situation}
                  </div>

                  {/* Phrases */}
                  <div className="flex flex-col gap-2">
                    {topic.phrases.map((phrase, i) => (
                      <div key={i} className="bg-[#F5F6FA] rounded-2xl p-4 border border-[#EAEAEA]">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-black text-[#1A1A2E] text-sm">{phrase.de}</p>
                              <button
                                onClick={() => speakGerman(phrase.de)}
                                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white transition-colors flex-shrink-0"
                                style={{ border: `1.5px solid ${topic.colorBorder}` }}
                              >
                                <Volume2 size={12} style={{ color: topic.color }} />
                              </button>
                            </div>
                            <p className="text-xs text-[#9E9E9E] font-medium italic">{phrase.en}</p>
                          </div>
                        </div>
                        {phrase.tip && (
                          <div className="mt-2 flex items-start gap-2 text-[11px]">
                            <span>💡</span>
                            <span className="text-[#757575] font-medium">{phrase.tip}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom tip */}
      <div className="mt-6 flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5F5] to-[#FFF8E1] rounded-2xl border border-[#FFE0B2]">
        <span className="text-2xl">🎯</span>
        <p className="text-xs font-semibold text-[#757575]">
          <strong className="text-[#E53935]">Pro tip:</strong> Practice each situation out loud with Jai in the{' '}
          <a href="/tutor" className="text-[#E53935] underline font-bold">AI Tutor</a> before you face it in real life!
        </p>
      </div>
    </div>
  );
}
