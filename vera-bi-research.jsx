import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import * as Plotly from "plotly";

// ============================================================================
// DOMAIN LAYER
// ============================================================================

const ROLLEN = ["PDL", "stvPDL", "PFK_LG", "PFK_ST", "Ungelernt"];

const CODEBUCH = [
  // Personal (7)
  { id: "P01", label: "Personalmangel", ober: "Personal", qpr: "QB5.3", kritikalitaet: 3, keywords: ["personalmangel", "unterbesetzt", "stellen", "vakanz"] },
  { id: "P02", label: "Überlastung/Fluktuation", ober: "Personal", qpr: "QB5.3", kritikalitaet: 3, keywords: ["überlast", "fluktuation", "kündigung", "burnout"] },
  { id: "P03", label: "Qualifikationsdefizit", ober: "Personal", qpr: "QB3.1", kritikalitaet: 2, keywords: ["qualifikation", "kompetenz", "schulung", "fortbildung"] },
  { id: "P04", label: "Krankheitsausfall", ober: "Personal", qpr: "QB5.3", kritikalitaet: 3, keywords: ["krankheit", "ausfall", "krankenstand", "fehlzeiten"] },
  { id: "P05", label: "Einarbeitung", ober: "Personal", qpr: "QB3.1", kritikalitaet: 2, keywords: ["einarbeitung", "mentor", "neue mitarbeiter"] },
  { id: "P06", label: "Arbeitszeitmodell", ober: "Personal", qpr: "QB5.3", kritikalitaet: 1, keywords: ["arbeitszeit", "teilzeit", "flexibel", "schicht"] },
  { id: "P07", label: "Springerpool", ober: "Personal", qpr: "QB5.3", kritikalitaet: 2, keywords: ["springer", "pool", "vertretung", "reserve"] },
  // Einzugsgebiet (5)
  { id: "EG01", label: "Gebietsfestlegung", ober: "Einzugsgebiet", qpr: "QB5.3", kritikalitaet: 1, keywords: ["einzugsgebiet", "radius", "gebiet"] },
  { id: "EG02", label: "Stadt-Land-Unterschied", ober: "Einzugsgebiet", qpr: "QB5.3", kritikalitaet: 1, keywords: ["stadt", "land", "urban", "rural"] },
  { id: "EG03", label: "Wegekosten", ober: "Einzugsgebiet", qpr: "QB5.3", kritikalitaet: 2, keywords: ["wegepauschale", "wegekosten", "fahrtkosten", "kilometer"] },
  { id: "EG04", label: "Alternative Mobilität", ober: "Einzugsgebiet", qpr: "QB5.3", kritikalitaet: 1, keywords: ["e-bike", "fahrrad", "öpnv", "mobilität"] },
  { id: "EG05", label: "Parkplatzproblematik", ober: "Einzugsgebiet", qpr: "QB5.3", kritikalitaet: 1, keywords: ["parkplatz", "knöllchen", "parken"] },
  // Tourenplanung (5)
  { id: "T01", label: "Zeitdruck/Optimierung", ober: "Touren", qpr: "QB1.1", kritikalitaet: 3, keywords: ["zeitdruck", "optimierung", "effizient", "zeit"] },
  { id: "T02", label: "Planungsprobleme", ober: "Touren", qpr: "QB1.1", kritikalitaet: 2, keywords: ["planung", "software", "medifox", "vivendi", "touren"] },
  { id: "T03", label: "Ausfallkompensation fehlt", ober: "Touren", qpr: "QB1.1", kritikalitaet: 3, keywords: ["ausfall", "kompensation", "einspringen", "notfall"] },
  { id: "T04", label: "Kontinuität", ober: "Touren", qpr: "QB1.1", kritikalitaet: 2, keywords: ["kontinuität", "bezugspflege", "stammkunde"] },
  { id: "T05", label: "Pausen", ober: "Touren", qpr: "QB1.1", kritikalitaet: 2, keywords: ["pause", "erholung", "ruhezeit"] },
  // Versorgung (3)
  { id: "V01", label: "Ablehnungen häufig", ober: "Versorgung", qpr: "QB1.3", kritikalitaet: 2, keywords: ["ablehnung", "kapazität", "warteliste"] },
  { id: "V02", label: "Leistungsarten", ober: "Versorgung", qpr: "QB1.1", kritikalitaet: 1, keywords: ["hkp", "hauswirtschaft", "leistung", "sgb"] },
  { id: "V03", label: "Entlassmanagement", ober: "Versorgung", qpr: "QB1.3", kritikalitaet: 2, keywords: ["entlassung", "krankenhaus", "überleitung", "recare"] },
  // Qualität (6)
  { id: "Q01", label: "Risikomanagement fehlt", ober: "Qualität", qpr: "QB1.2", kritikalitaet: 3, keywords: ["risiko", "gefahr", "sturz", "dekubitus"] },
  { id: "Q02", label: "Pflegeplanung unvollständig", ober: "Qualität", qpr: "QB1.2", kritikalitaet: 2, keywords: ["pflegeplanung", "sis", "maßnahme", "assessment"] },
  { id: "Q03", label: "Beschwerden ungeklärt", ober: "Qualität", qpr: "QB1.3", kritikalitaet: 2, keywords: ["beschwerde", "kritik", "unzufried"] },
  { id: "Q04", label: "Gewaltschutz", ober: "Qualität", qpr: "QB1.2", kritikalitaet: 3, keywords: ["gewalt", "schutz", "vernachlässigung"] },
  { id: "Q05", label: "QM-Ziele fehlen", ober: "Qualität", qpr: "QB3.1", kritikalitaet: 2, keywords: ["qualitätsziel", "qm", "audit", "kennzahl"] },
  { id: "Q06", label: "Behandlungssicherheit", ober: "Qualität", qpr: "QB1.2", kritikalitaet: 3, keywords: ["sicherheit", "fehler", "medikament", "wunde"] },
  // Dokumentation (3)
  { id: "D01", label: "Dokumentation lückenhaft", ober: "Dokumentation", qpr: "QB1.2", kritikalitaet: 2, keywords: ["dokumentation", "lücke", "unvollständig", "doku"] },
  { id: "D02", label: "Keine digitale Doku", ober: "Dokumentation", qpr: "QB1.2", kritikalitaet: 1, keywords: ["digital", "papier", "handschrift"] },
  { id: "D03", label: "Doku-Schulung fehlt", ober: "Dokumentation", qpr: "QB3.1", kritikalitaet: 1, keywords: ["schulung", "training", "anleitung"] },
  // Digitalisierung (5)
  { id: "DI01", label: "Softwareauswahl", ober: "Digitalisierung", qpr: "QB3.1", kritikalitaet: 1, keywords: ["software", "system", "app", "tool"] },
  { id: "DI02", label: "TI-Nutzung", ober: "Digitalisierung", qpr: "QB3.1", kritikalitaet: 1, keywords: ["ti", "telematik", "erezept", "epa"] },
  { id: "DI03", label: "Fördermittel", ober: "Digitalisierung", qpr: "QB3.1", kritikalitaet: 1, keywords: ["förderung", "fördermittel", "zuschuss"] },
  { id: "DI04", label: "Mobile Endgeräte", ober: "Digitalisierung", qpr: "QB1.2", kritikalitaet: 2, keywords: ["smartphone", "tablet", "mobil", "handy"] },
  { id: "DI05", label: "Digitale Akzeptanz gering", ober: "Digitalisierung", qpr: "QB3.1", kritikalitaet: 2, keywords: ["akzeptanz", "widerstand", "ablehnung"] },
  // Steuerung (2)
  { id: "S01", label: "Keine Kennzahlensteuerung", ober: "Steuerung", qpr: "QB3.1", kritikalitaet: 2, keywords: ["kennzahl", "controlling", "steuerung", "kpi"] },
  { id: "S02", label: "Keine strategische Planung", ober: "Steuerung", qpr: "QB3.1", kritikalitaet: 1, keywords: ["strategie", "planung", "zukunft", "vision"] },
  // Kooperation (5)
  { id: "K01", label: "Trägerkooperation", ober: "Kooperation", qpr: "QB3.1", kritikalitaet: 1, keywords: ["träger", "verbund", "kooperation"] },
  { id: "K02", label: "Arztkooperation", ober: "Kooperation", qpr: "QB1.3", kritikalitaet: 2, keywords: ["arzt", "verordnung", "hausarzt", "rezept"] },
  { id: "K03", label: "Netzwerke", ober: "Kooperation", qpr: "QB3.1", kritikalitaet: 1, keywords: ["netzwerk", "austausch", "pflegestützpunkt"] },
  { id: "K04", label: "Angehörigenarbeit", ober: "Kooperation", qpr: "QB1.3", kritikalitaet: 2, keywords: ["angehörige", "familie", "beratung"] },
  { id: "K05", label: "Externe Partner", ober: "Kooperation", qpr: "QB3.1", kritikalitaet: 1, keywords: ["apotheke", "sanitätshaus", "physio"] },
  // Stress (3)
  { id: "ST01", label: "Hauptstressoren", ober: "Stress", qpr: "QB5.3", kritikalitaet: 3, keywords: ["stress", "belastung", "druck", "überforder"] },
  { id: "ST02", label: "Vereinbarkeit", ober: "Stress", qpr: "QB5.3", kritikalitaet: 2, keywords: ["familie", "beruf", "vereinbarkeit"] },
  { id: "ST03", label: "Entlastung fehlt", ober: "Stress", qpr: "QB5.3", kritikalitaet: 2, keywords: ["entlastung", "hilfe", "unterstützung", "supervision"] },
];

const QPR_ASPEKTE = [
  { id: "QB1.1", label: "Bedarfsgerechte Pflege & Betreuung", bereich: "Ergebnisqualität" },
  { id: "QB1.2", label: "Unterstützung bei Alltagsgestaltung", bereich: "Ergebnisqualität" },
  { id: "QB1.3", label: "Überleitung & Zusammenarbeit", bereich: "Ergebnisqualität" },
  { id: "QB3.1", label: "Qualitätsmanagement", bereich: "Strukturqualität" },
  { id: "QB5.3", label: "Personal & Organisation", bereich: "Strukturqualität" },
];

const LEITFADEN = [
  // === BLOCK A – Struktur & Organisation ===
  { id:"A1", block:"Struktur", text:"Sind Verantwortlichkeiten klar definiert und allen Mitarbeitenden bekannt?", impulse:"Organigramm? Stellenbeschreibungen?", pflicht:true, rollen:["PDL","stvPDL"], qpr:["QB3.1"], dimension:"qualität", gewicht:2 },
  { id:"A2", block:"Struktur", text:"Existieren schriftliche Prozessstandards (SOPs) für Kernabläufe?", impulse:"QM-Handbuch? Checklisten?", pflicht:true, rollen:["PDL","stvPDL"], qpr:["QB1.2"], dimension:"qualität", gewicht:2 },
  { id:"A3", block:"Struktur", text:"Finden regelmäßige Teambesprechungen mit Agenda und Protokoll statt?", impulse:"Frequenz? Wer moderiert? Teilnahme?", pflicht:true, rollen:["PDL","stvPDL","PFK_LG","PFK_ST","Ungelernt"], qpr:["QB3.1"], dimension:"qualität", gewicht:1 },

  // === BLOCK B – Personal & Ressourcen ===
  { id:"B1", block:"Personal", text:"Gibt es geregelte Verfahren für den Umgang mit Personalmangel?", impulse:"Springerpool? Leiharbeit? Verdichtung?", pflicht:true, rollen:["PDL","stvPDL","PFK_LG"], qpr:["QB5.3"], dimension:"ressource", gewicht:2 },
  { id:"B2", block:"Personal", text:"Existieren verbindliche Vertretungsregelungen für Schlüsselpositionen?", impulse:"Wer vertritt PDL? Schriftlich fixiert?", pflicht:true, rollen:["PDL","stvPDL"], qpr:["QB5.3"], dimension:"ressource", gewicht:2 },
  { id:"B3", block:"Personal", text:"Werden neue Mitarbeitende nach strukturiertem Konzept eingearbeitet?", impulse:"Dauer? Mentoring? Checklisten?", pflicht:true, rollen:["PDL","stvPDL","PFK_LG","PFK_ST","Ungelernt"], qpr:["QB3.1"], dimension:"qualität", gewicht:2 },
  { id:"B4", block:"Personal", text:"Wird Überlastung frühzeitig erkannt und systematisch adressiert?", impulse:"Signale? Gespräche? Maßnahmen?", pflicht:true, rollen:["PDL","stvPDL","PFK_LG","PFK_ST","Ungelernt"], qpr:["QB5.3"], dimension:"ressource", gewicht:2 },
  { id:"B5", block:"Personal", text:"Wie hoch ist das aktuelle Stresslevel im Arbeitsalltag?", impulse:"Top-3 Stressoren benennen", pflicht:true, rollen:["PDL","stvPDL","PFK_LG","PFK_ST","Ungelernt"], qpr:["QB5.3"], dimension:"ressource", gewicht:2 },
  { id:"B6", block:"Personal", text:"Ist eine strukturierte Fortbildungsplanung etabliert?", impulse:"Budget? Themen? Pflichtschulungen?", pflicht:false, rollen:["PDL","stvPDL","PFK_LG","PFK_ST"], qpr:["QB3.1"], dimension:"qualität", gewicht:1 },

  // === BLOCK C – Tourenplanung & Versorgung ===
  { id:"C1", block:"Touren", text:"Erfolgt die Tourenplanung nach transparenten und nachvollziehbaren Kriterien?", impulse:"Welche Software? Planungslogik?", pflicht:true, rollen:["PDL","stvPDL"], qpr:["QB1.1"], dimension:"prozess", gewicht:2 },
  { id:"C2", block:"Touren", text:"Sind Verspätungen selten und werden systematisch erfasst?", impulse:"Häufigkeit? Abweichungsprotokoll?", pflicht:true, rollen:["PFK_LG","PFK_ST","Ungelernt"], qpr:["QB1.1"], dimension:"prozess", gewicht:2 },
  { id:"C3", block:"Touren", text:"Gibt es ein definiertes Ausfallmanagement mit Eskalationsstufen?", impulse:"Rufbereitschaft? Verdichtung? Springer?", pflicht:true, rollen:["PDL","stvPDL","PFK_LG","PFK_ST","Ungelernt"], qpr:["QB1.1"], dimension:"prozess", gewicht:2 },
  { id:"C4", block:"Touren", text:"Wie hoch ist die Bezugspflege-Kontinuität bei Stammkunden?", impulse:"Quote? Wechselhäufigkeit pro Woche?", pflicht:true, rollen:["PDL","stvPDL","PFK_LG","PFK_ST"], qpr:["QB1.1"], dimension:"prozess", gewicht:1 },
  { id:"C5", block:"Touren", text:"Werden Ablehnungen von Versorgungsanfragen systematisch erfasst?", impulse:"Häufigkeit? Gründe? Meldung an Landespflegeausschuss?", pflicht:false, rollen:["PDL","stvPDL"], qpr:["QB1.3"], dimension:"prozess", gewicht:1 },

  // === BLOCK D – Qualität & Risiko ===
  { id:"D1", block:"Qualität", text:"Ist ein systematisches Risikomanagement dokumentiert und aktiv?", impulse:"Sturz? Dekubitus? Schmerz? Aktualisierung?", pflicht:true, rollen:["PDL","stvPDL","PFK_LG"], qpr:["QB1.2"], dimension:"qualität", gewicht:2 },
  { id:"D2", block:"Qualität", text:"Existiert ein strukturiertes Beschwerdemanagement?", impulse:"Zentral? Häufigste Themen? Reaktionszeit?", pflicht:true, rollen:["PDL","stvPDL"], qpr:["QB1.3"], dimension:"qualität", gewicht:2 },
  { id:"D3", block:"Qualität", text:"Wird die Pflegeplanung regelmäßig überprüft und angepasst?", impulse:"Frequenz? Wer prüft? SIS aktuell?", pflicht:true, rollen:["PFK_LG","PFK_ST","Ungelernt"], qpr:["QB1.2"], dimension:"qualität", gewicht:2 },
  { id:"D4", block:"Qualität", text:"Werden Qualitätskennzahlen systematisch erhoben und ausgewertet?", impulse:"Welche KPIs? Monatlich? PDCA?", pflicht:true, rollen:["PDL","stvPDL"], qpr:["QB3.1"], dimension:"qualität", gewicht:2 },
  { id:"D5", block:"Qualität", text:"Wie sicher fühlen Sie sich bei der täglichen Leistungserbringung?", impulse:"Medikamente? Wundversorgung? Hilfsmittel?", pflicht:true, rollen:["PFK_LG","PFK_ST","Ungelernt"], qpr:["QB1.2"], dimension:"qualität", gewicht:2 },

  // === BLOCK E – Dokumentation ===
  { id:"E1", block:"Dokumentation", text:"Ist die Pflegedokumentation vollständig und nachvollziehbar?", impulse:"SIS? Maßnahmenplan? Evaluation?", pflicht:true, rollen:["PFK_LG","PFK_ST","Ungelernt"], qpr:["QB1.2"], dimension:"qualität", gewicht:2 },
  { id:"E2", block:"Dokumentation", text:"Erfolgt die Dokumentation zeitnah am selben Tag?", impulse:"Sofort vor Ort? Abends? Nächster Tag?", pflicht:true, rollen:["PFK_LG","PFK_ST","Ungelernt"], qpr:["QB1.2"], dimension:"prozess", gewicht:2 },
  { id:"E3", block:"Dokumentation", text:"Wird ein digitales Dokumentationssystem eingesetzt und akzeptiert?", impulse:"Welches System? Zufriedenheit?", pflicht:true, rollen:["PDL","stvPDL","PFK_LG","PFK_ST","Ungelernt"], qpr:["QB1.2"], dimension:"digital", gewicht:2 },

  // === BLOCK F – Digitalisierung ===
  { id:"F1", block:"Digitalisierung", text:"Sind mobile Endgeräte im Einsatz und funktional?", impulse:"Smartphone? Tablet? Akkulaufzeit?", pflicht:true, rollen:["PDL","stvPDL","PFK_LG","PFK_ST","Ungelernt"], qpr:["QB1.2"], dimension:"digital", gewicht:2 },
  { id:"F2", block:"Digitalisierung", text:"Werden KPIs digital ausgewertet und für Steuerung genutzt?", impulse:"Dashboard? Automatische Berichte?", pflicht:true, rollen:["PDL","stvPDL"], qpr:["QB3.1"], dimension:"digital", gewicht:2 },
  { id:"F3", block:"Digitalisierung", text:"Ist die Akzeptanz digitaler Tools bei Mitarbeitenden hoch?", impulse:"Widerstand? Generationsunterschied? Schulungsbedarf?", pflicht:true, rollen:["PDL","stvPDL","PFK_LG","PFK_ST","Ungelernt"], qpr:["QB3.1"], dimension:"digital", gewicht:1 },
  { id:"F4", block:"Digitalisierung", text:"Ist digitale Kommunikation (Messenger/Intranet) etabliert?", impulse:"Welche Kanäle? Nutzungsquote?", pflicht:false, rollen:["PDL","stvPDL","PFK_LG","PFK_ST","Ungelernt"], qpr:["QB3.1"], dimension:"digital", gewicht:1 },

  // === BLOCK G – Steuerung & Wirtschaft ===
  { id:"G1", block:"Steuerung", text:"Werden betriebswirtschaftliche Kennzahlen regelmäßig analysiert?", impulse:"Welche KPIs? Monatlich? Wer analysiert?", pflicht:true, rollen:["PDL","stvPDL"], qpr:["QB3.1"], dimension:"qualität", gewicht:2 },
  { id:"G2", block:"Steuerung", text:"Wird die Wirtschaftlichkeit des Betriebs aktiv überwacht?", impulse:"Deckungsbeitrag? Vergütungssätze? Break-Even?", pflicht:true, rollen:["PDL","stvPDL"], qpr:["QB5.3"], dimension:"ressource", gewicht:2 },

  // === BLOCK H – Zukunft & Kooperation ===
  { id:"H1", block:"Zukunft", text:"Liegt eine schriftliche Digitalisierungsstrategie vor?", impulse:"Roadmap? Budget? Meilensteine?", pflicht:true, rollen:["PDL","stvPDL"], qpr:["QB3.1"], dimension:"digital", gewicht:2 },
  { id:"H2", block:"Zukunft", text:"Bestehen funktionierende externe Kooperationen?", impulse:"Ärzte? Apotheken? Netzwerke? Träger?", pflicht:false, rollen:["PDL","stvPDL","PFK_LG","PFK_ST"], qpr:["QB1.3"], dimension:"qualität", gewicht:1 },
  { id:"H3", block:"Zukunft", text:"Existiert eine langfristige Personalentwicklungsplanung?", impulse:"Nachfolge? Karrierepfade? Förderung?", pflicht:true, rollen:["PDL","stvPDL"], qpr:["QB5.3"], dimension:"ressource", gewicht:2 },
  { id:"H4", block:"Zukunft", text:"Welche konkreten Verbesserungsideen haben Sie?", impulse:"Sofort umsetzbar vs. langfristig? Priorisierung?", pflicht:true, rollen:["PDL","stvPDL","PFK_LG","PFK_ST","Ungelernt"], qpr:["QB3.1"], dimension:"qualität", gewicht:1 },
];


const BLOCKS = [...new Set(LEITFADEN.map(f => f.block))];
const DIMENSIONEN = ["prozess", "ressource", "qualität", "digital"];
const DIM_LABELS = { prozess: "Prozessstabilität", ressource: "Ressourcenlage", "qualität": "Qualitätsstruktur", digital: "Digitalisierungsgrad" };
const DIM_COLORS = { prozess: "#3b82f6", ressource: "#f59e0b", "qualität": "#10b981", digital: "#8b5cf6" };

/**
 * Selektiert exakt 20 Fragen für eine Rolle.
 * Priorisierung: 1) Pflichtfragen, 2) höheres Gewicht, 3) Dimensionsbalance
 * Bei < 20 verfügbaren Fragen: alle zurückgeben
 */
function getQuestionsForRole(role) {
  const available = LEITFADEN.filter(q => q.rollen.includes(role));
  if (available.length <= 20) return available;
  const sorted = [...available].sort((a, b) => {
    if (a.pflicht !== b.pflicht) return a.pflicht ? -1 : 1;
    return b.gewicht - a.gewicht;
  });
  return sorted.slice(0, 20);
}

// ============================================================================
// AUTO-PARSING ENGINE
// ============================================================================

function parseTextForCodes(text) {
  if (!text || text.length < 10) return [];
  const lowerText = text.toLowerCase();
  const suggestions = [];
  CODEBUCH.forEach(code => {
    if (!code.keywords) return;
    let matchScore = 0;
    const matchedKeywords = [];
    code.keywords.forEach(kw => {
      if (lowerText.includes(kw.toLowerCase())) { matchScore += 10; matchedKeywords.push(kw); }
    });
    if (matchScore > 0) {
      const mentions = matchedKeywords.reduce((sum, kw) => sum + (text.match(new RegExp(kw, 'gi')) || []).length, 0);
      matchScore += (mentions - matchedKeywords.length) * 5;
      suggestions.push({ ...code, matchScore, matchedKeywords,
        confidence: matchScore >= 20 ? 'Hoch' : matchScore >= 10 ? 'Mittel' : 'Niedrig',
        confidenceColor: matchScore >= 20 ? '#10b981' : matchScore >= 10 ? '#f59e0b' : '#9ca3af',
      });
    }
  });
  return suggestions.sort((a, b) => b.matchScore - a.matchScore);
}

// ============================================================================
// CORE ENGINES
// ============================================================================

function ampel(score) {
  if (score < 50) return { label: "Kritisch", color: "#ef4444", bg: "#fef2f2" };
  if (score < 75) return { label: "Stabil", color: "#f59e0b", bg: "#fffbeb" };
  return { label: "Stark", color: "#10b981", bg: "#ecfdf5" };
}

function calculateDimensionScores(answers) {
  const scores = {};
  const maxScores = {};
  DIMENSIONEN.forEach(d => { scores[d] = 0; maxScores[d] = 0; });
  
  LEITFADEN.forEach(q => {
    const val = answers[q.id] ?? 0;
    scores[q.dimension] += val * q.gewicht;
    maxScores[q.dimension] += 4 * q.gewicht;
  });
  
  DIMENSIONEN.forEach(d => {
    scores[d] = maxScores[d] > 0 ? Math.round((scores[d] / maxScores[d]) * 100) : 0;
  });
  return scores;
}

function calculateOrgScore(dimScores) {
  return Math.round(0.25 * (dimScores.prozess || 0) + 0.25 * (dimScores.ressource || 0) + 0.25 * (dimScores["qualität"] || 0) + 0.25 * (dimScores.digital || 0));
}

function calculateQPRScores(answers) {
  const scores = {};
  const maxS = {};
  QPR_ASPEKTE.forEach(a => { scores[a.id] = 0; maxS[a.id] = 0; });
  
  LEITFADEN.forEach(q => {
    const val = answers[q.id] ?? 0;
    q.qpr.forEach(aspekt => {
      if (scores[aspekt] !== undefined) {
        scores[aspekt] += val * q.gewicht;
        maxS[aspekt] += 4 * q.gewicht;
      }
    });
  });
  
  QPR_ASPEKTE.forEach(a => {
    scores[a.id] = maxS[a.id] > 0 ? Math.round((scores[a.id] / maxS[a.id]) * 100) : 0;
  });
  return scores;
}

function calculateEvidenceCoverage(codings) {
  const covered = new Set();
  codings.forEach(c => {
    const code = CODEBUCH.find(cb => cb.id === c.codeId);
    if (code) covered.add(code.qpr);
  });
  return Math.round((covered.size / QPR_ASPEKTE.length) * 100);
}

function calculateReadiness(coverage, riskScore, stability, orga) {
  const score = coverage * 0.3 + riskScore * 0.3 + stability * 0.2 + orga * 0.2;
  let label = "Kritisch";
  if (score >= 85) label = "Audit-Ready";
  else if (score >= 70) label = "Weitgehend bereit";
  else if (score >= 50) label = "Handlungsbedarf";
  return { score: Math.round(score), label };
}

function simulateScenario(baseDelay, reduction, cost) {
  const newDelay = Math.max(0, baseDelay - reduction);
  const benefit = (baseDelay - newDelay) * 100000;
  const roi = cost > 0 ? ((benefit - cost) / cost) * 100 : 0;
  return { newDelay, benefit, roi: Math.round(roi) };
}

function buildHeatmapData(codings) {
  const kategorien = [...new Set(CODEBUCH.map(c => c.ober))];
  const matrix = [];
  
  ROLLEN.forEach(rolle => {
    const row = [];
    kategorien.forEach(kat => {
      const count = codings.filter(c => {
        const code = CODEBUCH.find(cb => cb.id === c.codeId);
        return code && code.ober === kat && c.rolle === rolle;
      }).length;
      row.push(count);
    });
    matrix.push(row);
  });
  
  return { z: matrix, x: kategorien, y: ROLLEN };
}

// ============================================================================
// PERSISTENCE
// ============================================================================

const persist = (key, value) => { try { localStorage.setItem("vera_" + key, JSON.stringify(value)); } catch(e) {} };
const load = (key, fallback) => { try { const d = localStorage.getItem("vera_" + key); return d ? JSON.parse(d) : fallback; } catch(e) { return fallback; } };

// ============================================================================
// ICONS (SVG)
// ============================================================================

const Icon = ({ children, size = 20, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>{children}</svg>
);

const Icons = {
  Users: (p) => <Icon {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></Icon>,
  FileText: (p) => <Icon {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></Icon>,
  Code: (p) => <Icon {...p}><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></Icon>,
  Shield: (p) => <Icon {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></Icon>,
  Grid: (p) => <Icon {...p}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></Icon>,
  Activity: (p) => <Icon {...p}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></Icon>,
  BarChart: (p) => <Icon {...p}><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></Icon>,
  TrendingUp: (p) => <Icon {...p}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></Icon>,
  Zap: (p) => <Icon {...p}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></Icon>,
  Download: (p) => <Icon {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></Icon>,
  Upload: (p) => <Icon {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></Icon>,
  Settings: (p) => <Icon {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></Icon>,
  Home: (p) => <Icon {...p}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></Icon>,
  LogOut: (p) => <Icon {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></Icon>,
  Check: (p) => <Icon {...p}><polyline points="20 6 9 17 4 12"/></Icon>,
  AlertTriangle: (p) => <Icon {...p}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></Icon>,
  Building: (p) => <Icon {...p}><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="9" y1="6" x2="9" y2="6.01"/><line x1="15" y1="6" x2="15" y2="6.01"/><line x1="9" y1="10" x2="9" y2="10.01"/><line x1="15" y1="10" x2="15" y2="10.01"/><line x1="9" y1="14" x2="9" y2="14.01"/><line x1="15" y1="14" x2="15" y2="14.01"/><path d="M9 18h6"/></Icon>,
  ChevronRight: (p) => <Icon {...p}><polyline points="9 18 15 12 9 6"/></Icon>,
};

// ============================================================================
// WISSENSCHAFTLICHE ANALYSE – STATISTISCHE ENGINES
// ============================================================================

const Stats = {
  mean: (arr) => (!arr || arr.length === 0) ? 0 : arr.reduce((s, v) => s + v, 0) / arr.length,
  median: (arr) => {
    if (!arr || arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  },
  standardDeviation: (arr) => {
    if (!arr || arr.length < 2) return 0;
    const m = Stats.mean(arr);
    return Math.sqrt(arr.reduce((s, v) => s + Math.pow(v - m, 2), 0) / (arr.length - 1));
  },
  quantile: (arr, p) => {
    if (!arr || arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const idx = (sorted.length - 1) * p;
    const lower = Math.floor(idx), upper = Math.ceil(idx), w = idx % 1;
    return sorted[lower] * (1 - w) + sorted[upper] * w;
  },
  iqr: (arr) => ({ q25: Stats.quantile(arr, 0.25), q50: Stats.median(arr), q75: Stats.quantile(arr, 0.75), iqr: Stats.quantile(arr, 0.75) - Stats.quantile(arr, 0.25) }),
  skewness: (arr) => {
    if (!arr || arr.length < 3) return 0;
    const m = Stats.mean(arr), sd = Stats.standardDeviation(arr);
    if (sd === 0) return 0;
    const n = arr.length;
    return (n / ((n - 1) * (n - 2))) * arr.reduce((s, v) => s + Math.pow((v - m) / sd, 3), 0);
  },
};

function berechneBootstrapCI(answers, nBootstrap = 1000, alpha = 0.05) {
  const vals = Object.values(answers).filter(v => v > 0);
  if (vals.length < 3) return { lower: 0, upper: 0, se: 0, width: 0, interpretation: "Zu wenige Daten" };
  const scores = [];
  for (let i = 0; i < nBootstrap; i++) {
    const resample = Array.from({ length: vals.length }, () => vals[Math.floor(Math.random() * vals.length)]);
    const dimS = {};
    const dimMax = {};
    DIMENSIONEN.forEach(d => { dimS[d] = 0; dimMax[d] = 0; });
    LEITFADEN.forEach((q, idx) => {
      const v = idx < resample.length ? resample[idx] : (answers[q.id] ?? 0);
      dimS[q.dimension] += v * q.gewicht;
      dimMax[q.dimension] += 4 * q.gewicht;
    });
    DIMENSIONEN.forEach(d => { dimS[d] = dimMax[d] > 0 ? (dimS[d] / dimMax[d]) * 100 : 0; });
    scores.push(Math.round(0.25 * dimS.prozess + 0.25 * dimS.ressource + 0.25 * dimS["qualität"] + 0.25 * dimS.digital));
  }
  scores.sort((a, b) => a - b);
  const lo = Math.floor(nBootstrap * alpha / 2);
  const hi = Math.floor(nBootstrap * (1 - alpha / 2));
  const width = scores[hi] - scores[lo];
  return {
    lower: scores[lo], upper: scores[hi],
    se: Math.round(Stats.standardDeviation(scores) * 10) / 10,
    width,
    interpretation: width <= 10 ? "Sehr präzise Schätzung" : width <= 20 ? "Akzeptable Präzision" : width <= 30 ? "Moderate Unsicherheit" : "Hohe Unsicherheit – mehr Daten benötigt"
  };
}

function sensitivitaetsanalyse(answers, baseWeights = [0.25, 0.25, 0.25, 0.25], delta = 0.1) {
  const dimScoresLocal = calculateDimensionScores(answers);
  const dimArr = DIMENSIONEN.map(d => dimScoresLocal[d] || 0);
  const baseScore = Math.round(baseWeights.reduce((s, w, i) => s + w * dimArr[i], 0));
  const variations = [];
  for (let i = 0; i < 4; i++) {
    for (const mult of [1 - delta, 1 + delta]) {
      const nw = [...baseWeights];
      nw[i] *= mult;
      const sum = nw.reduce((a, b) => a + b, 0);
      const norm = nw.map(w => w / sum);
      const score = Math.round(norm.reduce((s, w, j) => s + w * dimArr[j], 0));
      variations.push({ dimension: DIM_LABELS[DIMENSIONEN[i]], delta: mult > 1 ? `+${Math.round(delta*100)}%` : `-${Math.round(delta*100)}%`, score, change: score - baseScore });
    }
  }
  const allScores = variations.map(v => v.score);
  const span = Math.max(...allScores) - Math.min(...allScores);
  return {
    baseline: baseScore, variations,
    range: { min: Math.min(...allScores), max: Math.max(...allScores), span },
    robustness: span <= 5 ? "Sehr robust – Gewichtung unproblematisch" : span <= 10 ? "Robust – akzeptable Variation" : span <= 15 ? "Moderat sensitiv – Gewichtung prüfen" : "Hoch sensitiv – empirische Kalibrierung empfohlen"
  };
}

function berechneDatenqualitaet(interviews, codings, answers) {
  let score = 0;
  const answeredCount = Object.values(answers).filter(v => v > 0).length;
  const answerRate = Math.min(1, answeredCount / LEITFADEN.length);
  score += answerRate * 35;
  const interviewScore = Math.min(1, interviews.length / 6);
  score += interviewScore * 25;
  const codingRate = Math.min(1, codings.length / Math.max(1, interviews.length * 5));
  score += codingRate * 20;
  const coverage = calculateEvidenceCoverage(codings);
  score += (coverage / 100) * 20;
  const s = Math.round(score);
  return {
    score: s,
    interpretation: s >= 90 ? "Exzellente Datenqualität" : s >= 75 ? "Gute Datenqualität" : s >= 60 ? "Akzeptable Datenqualität" : s >= 40 ? "Unzureichend – Nachbesserung erforderlich" : "Kritisch – systematische Verbesserung notwendig",
    components: { leitfragen: Math.round(answerRate * 35), interviews: Math.round(interviewScore * 25), codierungen: Math.round(codingRate * 20), evidenz: Math.round((coverage / 100) * 20) }
  };
}

function berechneCohenKappa(ratings1, ratings2) {
  if (!ratings1 || !ratings2 || ratings1.length !== ratings2.length || ratings1.length === 0) return { kappa: 0, interpretation: "Ungültige Daten" };
  const cats = [...new Set([...ratings1, ...ratings2])];
  const n = ratings1.length;
  const matrix = {};
  cats.forEach(c1 => { matrix[c1] = {}; cats.forEach(c2 => { matrix[c1][c2] = 0; }); });
  for (let i = 0; i < n; i++) { if (matrix[ratings1[i]]) matrix[ratings1[i]][ratings2[i]]++; }
  let po = 0;
  cats.forEach(c => { po += matrix[c][c]; });
  po /= n;
  let pe = 0;
  cats.forEach(c => {
    const rs = cats.reduce((s, c2) => s + matrix[c][c2], 0);
    const cs = cats.reduce((s, c1) => s + matrix[c1][c], 0);
    pe += (rs / n) * (cs / n);
  });
  const kappa = pe === 1 ? 1 : (po - pe) / (1 - pe);
  const k = Math.round(kappa * 1000) / 1000;
  return {
    kappa: k, observed: Math.round(po * 1000) / 1000, expected: Math.round(pe * 1000) / 1000,
    interpretation: k < 0 ? "Keine Übereinstimmung" : k < 0.20 ? "Geringe Übereinstimmung" : k < 0.40 ? "Ausreichende Übereinstimmung" : k < 0.60 ? "Mittlere Übereinstimmung" : k < 0.80 ? "Substanzielle Übereinstimmung" : "Nahezu perfekte Übereinstimmung",
    quality: k >= 0.70 ? "excellent" : k >= 0.60 ? "good" : k >= 0.40 ? "fair" : "poor"
  };
}

// ============================================================================
// PLOTLY CHART COMPONENT
// ============================================================================

const PlotlyChart = ({ data, layout, config, style = {} }) => {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current && data) {
      const defaultLayout = {
        paper_bgcolor: "transparent",
        plot_bgcolor: "transparent",
        font: { family: "'DM Sans', sans-serif", color: "#374151", size: 12 },
        margin: { l: 50, r: 30, t: 40, b: 50 },
        ...layout,
      };
      Plotly.newPlot(ref.current, data, defaultLayout, { responsive: true, displayModeBar: false, ...config });
    }
    return () => { if (ref.current) try { Plotly.purge(ref.current); } catch(e) {} };
  }, [data, layout, config]);
  return <div ref={ref} style={{ width: "100%", ...style }} />;
};

// ============================================================================
// MAIN APP
// ============================================================================

export default function VeRABI() {
  // --- State ---
  const [currentOrg, setCurrentOrg] = useState(() => load("currentOrg", null));
  const [currentUser, setCurrentUser] = useState(() => load("currentUser", null));
  const [orgs, setOrgs] = useState(() => load("orgs", []));
  const [users, setUsers] = useState(() => load("users", []));
  const [interviews, setInterviews] = useState(() => load("interviews", []));
  const [codings, setCodings] = useState(() => load("codings", []));
  const [answers, setAnswers] = useState(() => load("answers", {}));
  const [activeModule, setActiveModule] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Persist helpers
  const update = (setter, key) => (val) => { setter(val); persist(key, val); };
  const setOrgsP = update(setOrgs, "orgs");
  const setUsersP = update(setUsers, "users");
  const setInterviewsP = update(setInterviews, "interviews");
  const setCodingsP = update(setCodings, "codings");
  const setAnswersP = update(setAnswers, "answers");

  const login = (user, org) => {
    setCurrentUser(user); setCurrentOrg(org);
    persist("currentUser", user); persist("currentOrg", org);
  };

  const logout = () => {
    setCurrentUser(null); setCurrentOrg(null);
    persist("currentUser", null); persist("currentOrg", null);
  };

  // Derived
  const dimScores = useMemo(() => calculateDimensionScores(answers), [answers]);
  const orgScore = useMemo(() => calculateOrgScore(dimScores), [dimScores]);
  const qprScores = useMemo(() => calculateQPRScores(answers), [answers]);
  const evidenceCoverage = useMemo(() => calculateEvidenceCoverage(codings), [codings]);
  const orgAmpel = useMemo(() => ampel(orgScore), [orgScore]);

  // --- Auth Screen ---
  if (!currentUser || !currentOrg) {
    return <AuthScreen orgs={orgs} users={users} setOrgs={setOrgsP} setUsers={setUsersP} login={login} />;
  }

  const MODULES = [
    { id: "dashboard", label: "Dashboard", icon: Icons.Home },
    { id: "interviews", label: "Interviews", icon: Icons.Users },
    { id: "leitfaden", label: "Leitfaden-Engine", icon: Icons.FileText },
    { id: "coding", label: "Codierung", icon: Icons.Code },
    { id: "audit", label: "QPR Audit", icon: Icons.Shield },
    { id: "heatmap", label: "Problem-Heatmap", icon: Icons.Grid },
    { id: "prozess", label: "Prozessmetriken", icon: Icons.Activity },
    { id: "benchmark", label: "Benchmarks", icon: Icons.BarChart },
    { id: "simulation", label: "Simulation", icon: Icons.Zap },
    { id: "wissenschaft", label: "Wiss. Analyse", icon: Icons.TrendingUp },
    { id: "export", label: "Export / Import", icon: Icons.Download },
  ];

  return (
    <div style={{ display: "flex", height: "100vh", background: "#f8fafc", fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet"/>

      {/* Sidebar */}
      <aside style={{
        width: sidebarCollapsed ? 64 : 260, transition: "width 0.3s ease",
        background: "linear-gradient(195deg, #0f172a 0%, #1e293b 100%)",
        color: "#e2e8f0", display: "flex", flexDirection: "column", overflow: "hidden", flexShrink: 0,
      }}>
        <div style={{ padding: sidebarCollapsed ? "20px 12px" : "24px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          {!sidebarCollapsed && (
            <>
              <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.5px", color: "#fff" }}>VeRA-BI</div>
              <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2, textTransform: "uppercase", letterSpacing: "1.5px" }}>Research Edition</div>
            </>
          )}
          {sidebarCollapsed && <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", textAlign: "center" }}>V</div>}
        </div>

        <div style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
          {MODULES.map(m => {
            const active = activeModule === m.id;
            return (
              <button key={m.id} onClick={() => setActiveModule(m.id)} style={{
                display: "flex", alignItems: "center", gap: 12, width: "100%", padding: sidebarCollapsed ? "10px 0" : "10px 12px",
                justifyContent: sidebarCollapsed ? "center" : "flex-start",
                background: active ? "rgba(59,130,246,0.15)" : "transparent",
                border: "none", borderRadius: 8, color: active ? "#60a5fa" : "#94a3b8",
                cursor: "pointer", fontSize: 13, fontWeight: active ? 600 : 400, transition: "all 0.2s",
                marginBottom: 2,
              }}>
                <m.icon size={18} />
                {!sidebarCollapsed && <span>{m.label}</span>}
              </button>
            );
          })}
        </div>

        <div style={{ padding: "12px 8px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          {!sidebarCollapsed && (
            <div style={{ padding: "8px 12px", fontSize: 11, color: "#64748b" }}>
              <div style={{ fontWeight: 600, color: "#94a3b8" }}>{currentUser.name}</div>
              <div>{currentOrg.name}</div>
            </div>
          )}
          <button onClick={logout} style={{
            display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 12px",
            background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", borderRadius: 6, fontSize: 12,
            justifyContent: sidebarCollapsed ? "center" : "flex-start",
          }}>
            <Icons.LogOut size={16} />
            {!sidebarCollapsed && "Abmelden"}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, overflowY: "auto", padding: "32px 40px" }}>
        {activeModule === "dashboard" && <DashboardModule dimScores={dimScores} orgScore={orgScore} orgAmpel={orgAmpel} qprScores={qprScores} answers={answers} interviews={interviews} codings={codings} evidenceCoverage={evidenceCoverage} />}
        {activeModule === "interviews" && <InterviewModule interviews={interviews} setInterviews={setInterviewsP} answers={answers} setAnswers={setAnswersP} />}
        {activeModule === "leitfaden" && <LeitfadenEngine answers={answers} setAnswers={setAnswersP} />}
        {activeModule === "coding" && <CodingModule interviews={interviews} codings={codings} setCodings={setCodingsP} />}
        {activeModule === "audit" && <AuditModule qprScores={qprScores} evidenceCoverage={evidenceCoverage} codings={codings} dimScores={dimScores} orgScore={orgScore} />}
        {activeModule === "heatmap" && <HeatmapModule codings={codings} answers={answers} qprScores={qprScores} />}
        {activeModule === "prozess" && <ProzessModule answers={answers} dimScores={dimScores} />}
        {activeModule === "benchmark" && <BenchmarkModule orgScore={orgScore} dimScores={dimScores} />}
        {activeModule === "simulation" && <SimulationModule dimScores={dimScores} />}
        {activeModule === "wissenschaft" && <WissenschaftModule answers={answers} interviews={interviews} codings={codings} dimScores={dimScores} orgScore={orgScore} evidenceCoverage={evidenceCoverage} />}
        {activeModule === "export" && <ExportModule data={{ interviews, codings, answers, orgs, users }} onImport={(d) => {
          if (d.interviews) setInterviewsP(d.interviews);
          if (d.codings) setCodingsP(d.codings);
          if (d.answers) setAnswersP(d.answers);
        }} />}
      </main>
    </div>
  );
}

// ============================================================================
// UI COMPONENTS
// ============================================================================

const Card = ({ children, style = {} }) => (
  <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", ...style }}>{children}</div>
);

const CardHeader = ({ title, subtitle, icon: IconComp, action }) => (
  <div style={{ padding: "18px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      {IconComp && <IconComp size={18} style={{ color: "#6366f1" }} />}
      <div>
        <div style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{subtitle}</div>}
      </div>
    </div>
    {action}
  </div>
);

const CardBody = ({ children, style = {} }) => <div style={{ padding: "20px 24px", ...style }}>{children}</div>;

const Badge = ({ label, color, bg }) => (
  <span style={{ display: "inline-block", padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, color, background: bg }}>{label}</span>
);

const StatCard = ({ label, value, sub, color = "#3b82f6" }) => (
  <Card style={{ minWidth: 160 }}>
    <CardBody>
      <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 700, color, marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>{sub}</div>}
    </CardBody>
  </Card>
);

const Btn = ({ children, onClick, variant = "primary", style = {}, disabled = false }) => {
  const styles = {
    primary: { background: "#3b82f6", color: "#fff", border: "none" },
    secondary: { background: "#f1f5f9", color: "#374151", border: "1px solid #e5e7eb" },
    danger: { background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca" },
    success: { background: "#ecfdf5", color: "#059669", border: "1px solid #a7f3d0" },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
      display: "inline-flex", alignItems: "center", gap: 6, opacity: disabled ? 0.5 : 1, transition: "all 0.2s",
      ...styles[variant], ...style,
    }}>{children}</button>
  );
};

const Input = ({ label, ...props }) => (
  <div style={{ marginBottom: 12 }}>
    {label && <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#6b7280", marginBottom: 4 }}>{label}</label>}
    <input {...props} style={{
      width: "100%", padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: 8,
      fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit",
      ...props.style,
    }} />
  </div>
);

const Select = ({ label, options, ...props }) => (
  <div style={{ marginBottom: 12 }}>
    {label && <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#6b7280", marginBottom: 4 }}>{label}</label>}
    <select {...props} style={{
      width: "100%", padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: 8,
      fontSize: 14, background: "#fff", outline: "none", fontFamily: "inherit", ...props.style,
    }}>
      {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
    </select>
  </div>
);

const PageTitle = ({ title, subtitle }) => (
  <div style={{ marginBottom: 28 }}>
    <h1 style={{ fontSize: 24, fontWeight: 700, color: "#111827", margin: 0 }}>{title}</h1>
    {subtitle && <p style={{ fontSize: 14, color: "#9ca3af", margin: "4px 0 0" }}>{subtitle}</p>}
  </div>
);

// ============================================================================
// AUTH SCREEN
// ============================================================================

function AuthScreen({ orgs, users, setOrgs, setUsers, login }) {
  const [step, setStep] = useState(orgs.length > 0 ? "login" : "setup");
  const [orgName, setOrgName] = useState("");
  const [userName, setUserName] = useState("");
  const [selectedOrg, setSelectedOrg] = useState(orgs[0]?.id || "");

  const createOrg = () => {
    if (!orgName.trim()) return;
    const org = { id: crypto.randomUUID(), name: orgName.trim() };
    const updated = [...orgs, org];
    setOrgs(updated);
    setSelectedOrg(org.id);
    setOrgName("");
    setStep("addUser");
  };

  const createUser = () => {
    if (!userName.trim() || !selectedOrg) return;
    const user = { id: crypto.randomUUID(), name: userName.trim(), role: "admin", organizationId: selectedOrg };
    const updated = [...users, user];
    setUsers(updated);
    const org = orgs.find(o => o.id === selectedOrg);
    login(user, org);
  };

  const orgUsers = users.filter(u => u.organizationId === selectedOrg);

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet"/>
      <div style={{ width: 420, background: "#fff", borderRadius: 16, padding: 40, boxShadow: "0 25px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#111827" }}>VeRA-BI</div>
          <div style={{ fontSize: 11, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 2, marginTop: 4 }}>Research Edition 1.0</div>
        </div>

        {step === "setup" && (
          <>
            <div style={{ fontSize: 14, color: "#6b7280", marginBottom: 20, textAlign: "center" }}>Erstellen Sie zunächst eine Organisation</div>
            <Input label="Organisationsname" value={orgName} onChange={e => setOrgName(e.target.value)} placeholder="z.B. Diakonie Ruhr Pflege" />
            <Btn onClick={createOrg} style={{ width: "100%", justifyContent: "center", marginTop: 8 }}><Icons.Building size={16} /> Organisation erstellen</Btn>
          </>
        )}

        {step === "addUser" && (
          <>
            <div style={{ fontSize: 14, color: "#6b7280", marginBottom: 20, textAlign: "center" }}>Erstellen Sie Ihren Benutzer</div>
            <Input label="Name" value={userName} onChange={e => setUserName(e.target.value)} placeholder="Ihr Name" />
            <Btn onClick={createUser} style={{ width: "100%", justifyContent: "center", marginTop: 8 }}><Icons.Users size={16} /> Benutzer erstellen & einloggen</Btn>
          </>
        )}

        {step === "login" && (
          <>
            {orgs.length > 1 && (
              <Select label="Organisation" value={selectedOrg} onChange={e => setSelectedOrg(e.target.value)}
                options={orgs.map(o => ({ value: o.id, label: o.name }))} />
            )}
            {orgUsers.length > 0 ? (
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#6b7280", marginBottom: 10 }}>Benutzer auswählen</div>
                {orgUsers.map(u => (
                  <button key={u.id} onClick={() => login(u, orgs.find(o => o.id === selectedOrg))} style={{
                    display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "14px 16px",
                    background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 10, cursor: "pointer",
                    fontSize: 14, fontWeight: 500, color: "#111827", marginBottom: 8, transition: "all 0.2s",
                  }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#3b82f6", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>
                      {u.name[0]}
                    </div>
                    {u.name}
                    <Icons.ChevronRight size={16} style={{ marginLeft: "auto", color: "#9ca3af" }} />
                  </button>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 13, color: "#9ca3af", textAlign: "center" }}>Noch keine Benutzer. Erstellen Sie einen.</div>
            )}
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <Btn variant="secondary" onClick={() => setStep("setup")} style={{ flex: 1, justifyContent: "center" }}>Neue Organisation</Btn>
              <Btn variant="secondary" onClick={() => setStep("addUser")} style={{ flex: 1, justifyContent: "center" }}>Neuer Benutzer</Btn>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// DASHBOARD MODULE
// ============================================================================

function DashboardModule({ dimScores, orgScore, orgAmpel, qprScores, answers, interviews, codings, evidenceCoverage }) {
  const answeredCount = Object.values(answers).filter(v => v > 0).length;

  return (
    <>
      <PageTitle title="Organisations-Dashboard" subtitle="Gesamtübersicht aller Bewertungsdimensionen" />

      {/* KPI Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 24 }}>
        <StatCard label="Org-Score" value={`${orgScore}%`} sub={orgAmpel.label} color={orgAmpel.color} />
        <StatCard label="Interviews" value={interviews.length} sub="durchgeführt" />
        <StatCard label="Codierungen" value={codings.length} sub="erfasst" />
        <StatCard label="Leitfragen" value={`${answeredCount}/${LEITFADEN.length}`} sub="beantwortet" />
        <StatCard label="QPR-Evidenz" value={`${evidenceCoverage}%`} sub="Abdeckung" color={ampel(evidenceCoverage).color} />
      </div>

      {/* Dimension Scores */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        <Card>
          <CardHeader title="Dimensionsanalyse" subtitle="Gewichtete Bewertung nach Dimension" icon={Icons.BarChart} />
          <CardBody>
            <PlotlyChart data={[{
              x: DIMENSIONEN.map(d => DIM_LABELS[d]),
              y: DIMENSIONEN.map(d => dimScores[d] || 0),
              type: "bar",
              marker: { color: DIMENSIONEN.map(d => DIM_COLORS[d]), borderRadius: 6 },
            }]} layout={{ height: 300, yaxis: { range: [0, 100], title: "Score %" } }} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="QPR-Aspekte" subtitle="Bewertung je Qualitätsbereich" icon={Icons.Shield} />
          <CardBody>
            <PlotlyChart data={[{
              type: "scatterpolar",
              r: QPR_ASPEKTE.map(a => qprScores[a.id] || 0),
              theta: QPR_ASPEKTE.map(a => a.id),
              fill: "toself",
              fillcolor: "rgba(99,102,241,0.15)",
              line: { color: "#6366f1" },
            }]} layout={{ height: 300, polar: { radialaxis: { visible: true, range: [0, 100] } } }} />
          </CardBody>
        </Card>
      </div>

      {/* Ampel Overview */}
      <Card>
        <CardHeader title="Ampelbewertung" subtitle="Schwellenwerte: < 50% Kritisch, 50–74% Stabil, ≥ 75% Stark" icon={Icons.AlertTriangle} />
        <CardBody>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {DIMENSIONEN.map(d => {
              const s = dimScores[d] || 0;
              const a = ampel(s);
              return (
                <div key={d} style={{ padding: 16, borderRadius: 10, background: a.bg, textAlign: "center" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: 1 }}>{DIM_LABELS[d]}</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: a.color, fontFamily: "'JetBrains Mono', monospace", margin: "8px 0 4px" }}>{s}%</div>
                  <Badge label={a.label} color={a.color} bg="rgba(255,255,255,0.7)" />
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>
    </>
  );
}

// ============================================================================
// INTERVIEW MODULE
// ============================================================================

function InterviewModule({ interviews, setInterviews, answers, setAnswers }) {
  const [mode, setMode] = useState("list"); // list | new | conduct
  const [role, setRole] = useState("PDL");
  const [interviewName, setInterviewName] = useState("");
  const [activeInterviewId, setActiveInterviewId] = useState(null);
  const [currentQIdx, setCurrentQIdx] = useState(0);

  const activeInterview = interviews.find(i => i.id === activeInterviewId);
  const activeQuestions = useMemo(() => activeInterview ? getQuestionsForRole(activeInterview.role) : [], [activeInterviewId, interviews]);

  const createInterview = () => {
    if (!interviewName.trim()) return;
    const newInt = {
      id: crypto.randomUUID(), role, name: interviewName.trim(),
      antworten: {}, date: new Date().toISOString(), completed: false,
    };
    setInterviews([...interviews, newInt]);
    setActiveInterviewId(newInt.id);
    setCurrentQIdx(0);
    setInterviewName("");
    setMode("conduct");
  };

  const saveFreitext = (frageId, text) => {
    setInterviews(interviews.map(i => i.id === activeInterviewId
      ? { ...i, antworten: { ...i.antworten, [frageId]: text } }
      : i
    ));
  };

  const saveLikert = (frageId, val) => {
    setAnswers({ ...answers, [frageId]: val });
  };

  const completeInterview = () => {
    setInterviews(interviews.map(i => i.id === activeInterviewId ? { ...i, completed: true } : i));
    setMode("list");
    setActiveInterviewId(null);
  };

  const removeInterview = (id) => {
    setInterviews(interviews.filter(i => i.id !== id));
  };

  const openInterview = (id) => {
    setActiveInterviewId(id);
    setCurrentQIdx(0);
    setMode("conduct");
  };

  // ─── LIST VIEW ───
  if (mode === "list") {
    const completed = interviews.filter(i => i.completed).length;
    return (
      <>
        <PageTitle title="Interviews" subtitle={`${interviews.length} angelegt · ${completed} abgeschlossen · Rollenbasiert je 20 Fragen`} />
        <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
          <Btn onClick={() => setMode("new")}><Icons.Users size={16} /> Neues Interview anlegen</Btn>
        </div>

        {interviews.length === 0 && (
          <Card><CardBody>
            <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>
              <Icons.Users size={48} style={{ marginBottom: 12, opacity: 0.3 }} />
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Noch keine Interviews</div>
              <div style={{ fontSize: 13 }}>Legen Sie ein Interview an. Pro Rolle werden automatisch 20 passende Fragen generiert.</div>
            </div>
          </CardBody></Card>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {interviews.map(i => {
            const qs = getQuestionsForRole(i.role);
            const textAnswered = qs.filter(q => i.antworten?.[q.id]?.trim()).length;
            const likertAnswered = qs.filter(q => (answers[q.id] || 0) > 0).length;
            const pct = qs.length > 0 ? Math.round((Math.min(textAnswered, likertAnswered) / qs.length) * 100) : 0;
            return (
              <Card key={i.id}>
                <CardBody>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>{i.name}</div>
                      <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{new Date(i.date).toLocaleDateString("de-DE")}</div>
                    </div>
                    <div style={{ display: "flex", gap: 4 }}>
                      <Badge label={i.role} color="#3b82f6" bg="#eff6ff" />
                      {i.completed && <Badge label="✓" color="#059669" bg="#ecfdf5" />}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>Text: {textAnswered}/{qs.length} · Likert: {likertAnswered}/{qs.length}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <div style={{ flex: 1, height: 6, background: "#f1f5f9", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: i.completed ? "#10b981" : "#3b82f6", borderRadius: 3, transition: "width 0.3s" }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#6b7280" }}>{pct}%</span>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Btn variant="secondary" onClick={() => openInterview(i.id)} style={{ flex: 1, justifyContent: "center" }}>{i.completed ? "Ansehen/Bearbeiten" : "Fortsetzen"}</Btn>
                    <Btn variant="danger" onClick={() => removeInterview(i.id)}>✕</Btn>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      </>
    );
  }

  // ─── NEW INTERVIEW ───
  if (mode === "new") {
    const previewQs = getQuestionsForRole(role);
    return (
      <>
        <PageTitle title="Neues Interview anlegen" subtitle="Rolle wählen → 20 Fragen werden automatisch zugewiesen" />
        <Card style={{ maxWidth: 520 }}>
          <CardBody>
            <Input label="Bezeichnung" value={interviewName} onChange={e => setInterviewName(e.target.value)} placeholder="z.B. PDL Standort Bochum-Mitte" />
            <Select label="Rolle" value={role} onChange={e => setRole(e.target.value)} options={ROLLEN} />
            <div style={{ padding: 12, background: "#f8fafc", borderRadius: 8, marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>{previewQs.length} Fragen für Rolle „{role}"</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {DIMENSIONEN.map(d => {
                  const count = previewQs.filter(q => q.dimension === d).length;
                  return count > 0 ? <Badge key={d} label={`${DIM_LABELS[d]}: ${count}`} color={DIM_COLORS[d]} bg="#f8fafc" /> : null;
                })}
              </div>
              <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 6 }}>{previewQs.filter(q => q.pflicht).length} Pflicht, {previewQs.filter(q => !q.pflicht).length} optional</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn onClick={createInterview} disabled={!interviewName.trim()}>Interview starten</Btn>
              <Btn variant="secondary" onClick={() => setMode("list")}>Abbrechen</Btn>
            </div>
          </CardBody>
        </Card>
      </>
    );
  }

  // ─── CONDUCT INTERVIEW ───
  if (mode === "conduct" && activeInterview && activeQuestions.length > 0) {
    const q = activeQuestions[currentQIdx];
    const freitext = activeInterview.antworten?.[q.id] || "";
    const likert = answers[q.id] || 0;
    const totalComplete = activeQuestions.filter(qq => (activeInterview.antworten?.[qq.id]?.trim()) && (answers[qq.id] || 0) > 0).length;
    const progress = Math.round((totalComplete / activeQuestions.length) * 100);
    const qAmpel = ampel(likert * 25);

    return (
      <>
        <PageTitle title={activeInterview.name} subtitle={`${activeInterview.role} · Frage ${currentQIdx + 1}/${activeQuestions.length}`} />

        {/* Progress */}
        <Card style={{ marginBottom: 16 }}>
          <CardBody style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 24px" }}>
            <Badge label={activeInterview.role} color="#3b82f6" bg="#eff6ff" />
            <div style={{ flex: 1 }}>
              <div style={{ height: 8, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${progress}%`, background: progress === 100 ? "#10b981" : "#3b82f6", borderRadius: 4, transition: "width 0.3s" }} />
              </div>
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#6b7280" }}>{totalComplete}/{activeQuestions.length}</span>
          </CardBody>
        </Card>

        {/* Question navigation dots */}
        <div style={{ display: "flex", gap: 4, marginBottom: 16, flexWrap: "wrap" }}>
          {activeQuestions.map((qq, idx) => {
            const hasText = !!activeInterview.antworten?.[qq.id]?.trim();
            const hasLikert = (answers[qq.id] || 0) > 0;
            const complete = hasText && hasLikert;
            return (
              <button key={qq.id} onClick={() => setCurrentQIdx(idx)} style={{
                width: 32, height: 32, borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer",
                background: idx === currentQIdx ? "#3b82f6" : complete ? "#10b981" : hasText || hasLikert ? "#fbbf24" : "#f1f5f9",
                color: idx === currentQIdx || complete || hasText || hasLikert ? "#fff" : "#9ca3af",
                border: "none", transition: "all 0.15s",
              }}>{idx + 1}</button>
            );
          })}
        </div>

        {/* Question card */}
        <Card>
          <CardHeader
            title={`${q.id} – ${q.block}`}
            subtitle={q.pflicht ? "Pflichtfrage" : "Optional"}
            icon={Icons.FileText}
            action={<div style={{ display: "flex", gap: 4 }}>
              {q.qpr.map(qp => <Badge key={qp} label={qp} color="#6366f1" bg="#eef2ff" />)}
              <Badge label={DIM_LABELS[q.dimension]} color={DIM_COLORS[q.dimension]} bg="#f8fafc" />
            </div>}
          />
          <CardBody>
            {/* Question text */}
            <div style={{ fontSize: 16, fontWeight: 600, color: "#111827", marginBottom: 4, lineHeight: 1.5 }}>{q.text}</div>
            {q.impulse && <div style={{ fontSize: 13, color: "#6b7280", fontStyle: "italic", marginBottom: 16 }}>💡 {q.impulse}</div>}

            {/* Freitext answer */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#6b7280", marginBottom: 4 }}>Interviewantwort (Freitext)</label>
              <textarea
                value={freitext}
                onChange={e => saveFreitext(q.id, e.target.value)}
                rows={5}
                placeholder="Antwort des Interviewpartners hier eintragen..."
                style={{ width: "100%", padding: "12px 14px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, resize: "vertical", fontFamily: "inherit", boxSizing: "border-box", lineHeight: 1.5 }}
              />
            </div>

            {/* Likert rating (Forced Choice 1-4) */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#6b7280", marginBottom: 8 }}>Bewertung – Forced-Choice-Skala 1–4</label>
              <div style={{ display: "flex", gap: 8 }}>
                {[
                  { v: 1, label: "1 – trifft nicht zu", col: "#ef4444" },
                  { v: 2, label: "2 – trifft kaum zu", col: "#f59e0b" },
                  { v: 3, label: "3 – überwiegend", col: "#3b82f6" },
                  { v: 4, label: "4 – trifft voll zu", col: "#10b981" },
                ].map(opt => (
                  <button key={opt.v} onClick={() => saveLikert(q.id, opt.v)} style={{
                    flex: 1, padding: "10px 4px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
                    background: likert === opt.v ? opt.col : "#f8fafc",
                    color: likert === opt.v ? "#fff" : "#6b7280",
                    border: likert === opt.v ? "none" : "1px solid #e5e7eb",
                    transition: "all 0.15s",
                  }}>{opt.label}</button>
                ))}
              </div>
            </div>

            {/* Navigation */}
            <div style={{ display: "flex", gap: 8, justifyContent: "space-between", borderTop: "1px solid #f1f5f9", paddingTop: 16 }}>
              <Btn variant="secondary" onClick={() => setCurrentQIdx(Math.max(0, currentQIdx - 1))} disabled={currentQIdx === 0}>← Zurück</Btn>
              <Btn variant="secondary" onClick={() => { setMode("list"); setActiveInterviewId(null); }}>Später fortsetzen</Btn>
              {currentQIdx < activeQuestions.length - 1
                ? <Btn onClick={() => setCurrentQIdx(currentQIdx + 1)}>Weiter →</Btn>
                : <Btn variant="success" onClick={completeInterview}>✓ Abschließen</Btn>
              }
            </div>
          </CardBody>
        </Card>
      </>
    );
  }

  return null;
}


// ============================================================================
// LEITFADEN ENGINE
// ============================================================================

function LeitfadenEngine({ answers, setAnswers }) {
  const [role, setRole] = useState("PDL");
  const [activeBlock, setActiveBlock] = useState(BLOCKS[0]);

  const filtered = LEITFADEN.filter(q => q.rollen.includes(role) && q.block === activeBlock);
  const allForRole = LEITFADEN.filter(q => q.rollen.includes(role));
  const answeredForRole = allForRole.filter(q => (answers[q.id] ?? 0) > 0).length;
  const progress = allForRole.length > 0 ? Math.round((answeredForRole / allForRole.length) * 100) : 0;

  const saveAnswer = (id, val) => setAnswers({ ...answers, [id]: val });

  return (
    <>
      <PageTitle title="Leitfragen-Übersicht" subtitle={`${LEITFADEN.length} Fragen · Likert-Bewertungen aus Interviews · Korrektur möglich`} />

      <Card style={{ marginBottom: 20 }}>
        <CardBody style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <Select label="Rolle" value={role} onChange={e => setRole(e.target.value)} options={ROLLEN} style={{ marginBottom: 0, width: 160 }} />
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#6b7280", marginBottom: 4 }}>
              <span>Fortschritt</span>
              <span style={{ fontWeight: 600 }}>{answeredForRole}/{allForRole.length} ({progress}%)</span>
            </div>
            <div style={{ height: 8, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progress}%`, background: progress === 100 ? "#10b981" : "#3b82f6", borderRadius: 4, transition: "width 0.3s" }} />
            </div>
          </div>
        </CardBody>
      </Card>

      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {BLOCKS.map(b => {
          const blockQs = LEITFADEN.filter(q => q.block === b && q.rollen.includes(role));
          const blockAnswered = blockQs.filter(q => (answers[q.id] ?? 0) > 0).length;
          const done = blockQs.length > 0 && blockAnswered === blockQs.length;
          return (
            <button key={b} onClick={() => setActiveBlock(b)} style={{
              padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
              background: activeBlock === b ? "#3b82f6" : done ? "#ecfdf5" : "#f8fafc",
              color: activeBlock === b ? "#fff" : done ? "#059669" : "#6b7280",
              border: activeBlock === b ? "none" : `1px solid ${done ? "#a7f3d0" : "#e5e7eb"}`,
            }}>
              {b} {done && "✓"} ({blockAnswered}/{blockQs.length})
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filtered.map((q, i) => {
          const val = answers[q.id] ?? 0;
          const a = ampel(val * 25);
          return (
            <Card key={q.id}>
              <CardBody style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: a.bg, color: a.color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, fontFamily: "'JetBrains Mono'" }}>
                  {q.id}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <div style={{ fontSize: 14, color: "#111827", fontWeight: 500, lineHeight: 1.5, flex: 1 }}>{q.text}</div>
                    {q.pflicht && <Badge label="Pflicht" color="#92400e" bg="#fef3c7" />}
                  </div>
                  {q.impulse && <div style={{ fontSize: 12, color: "#6b7280", fontStyle: "italic", marginBottom: 8 }}>💡 {q.impulse}</div>}
                  <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", gap: 4 }}>
                      {[1,2,3,4].map(v => (
                        <button key={v} onClick={() => saveAnswer(q.id, v)} style={{
                          width: 36, height: 36, borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.2s",
                          background: val === v ? "#3b82f6" : "#f8fafc", color: val === v ? "#fff" : "#6b7280",
                          border: val === v ? "none" : "1px solid #e5e7eb",
                        }}>{v}</button>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: 6, fontSize: 10, color: "#9ca3af" }}>
                      {q.qpr.map(qp => <Badge key={qp} label={qp} color="#6366f1" bg="#eef2ff" />)}
                      <Badge label={DIM_LABELS[q.dimension]} color={DIM_COLORS[q.dimension]} bg="#f8fafc" />
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <Card><CardBody><div style={{ color: "#9ca3af", textAlign: "center" }}>Keine Fragen für diese Rolle in diesem Block.</div></CardBody></Card>
        )}
      </div>
    </>
  );
}

// ============================================================================
// CODING MODULE
// ============================================================================

function CodingModule({ interviews, codings, setCodings }) {
  const [selInterview, setSelInterview] = useState("");
  const [selRolle, setSelRolle] = useState("PDL");
  const [autoSuggestions, setAutoSuggestions] = useState([]);
  const [showTexts, setShowTexts] = useState(false);

  const selInt = interviews.find(i => i.id === selInterview);

  // Auto-parse ALL Freitext answers from selected interview
  useEffect(() => {
    if (selInt && selInt.antworten) {
      const allText = Object.values(selInt.antworten).filter(t => t && t.trim()).join(" ");
      const suggestions = parseTextForCodes(allText);
      setAutoSuggestions(suggestions);
      setSelRolle(selInt.role || "PDL");
    } else {
      setAutoSuggestions([]);
    }
  }, [selInterview, interviews]);

  const addCoding = (codeId, frageId) => {
    setCodings([...codings, {
      id: crypto.randomUUID(), interviewId: selInterview,
      codeId, rolle: selRolle, frageId: frageId || null,
      date: new Date().toISOString(),
    }]);
  };

  const removeCoding = (id) => setCodings(codings.filter(c => c.id !== id));

  const codeFreq = {};
  codings.forEach(c => { codeFreq[c.codeId] = (codeFreq[c.codeId] || 0) + 1; });

  const kategorien = [...new Set(CODEBUCH.map(c => c.ober))];

  // Get answered questions for selected interview
  const interviewQuestions = useMemo(() => {
    if (!selInt) return [];
    const qs = getQuestionsForRole(selInt.role);
    return qs.filter(q => selInt.antworten?.[q.id]?.trim());
  }, [selInt, interviews]);

  return (
    <>
      <PageTitle title="Codierung" subtitle={`Deduktive Codierung · ${CODEBUCH.length} Codes · Auto-Parsing`} />
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
        <div>
          {/* Interview-Auswahl */}
          <Card style={{ marginBottom: 16 }}>
            <CardBody>
              <Select label="Interview wählen" value={selInterview} onChange={e => setSelInterview(e.target.value)}
                options={[
                  { value: "", label: "— Bitte wählen —" },
                  ...interviews.map(i => ({
                    value: i.id,
                    label: `${i.role}: ${i.name || "Interview"} ${i.completed ? "✓" : "(offen)"}`,
                  }))
                ]} />
            </CardBody>
          </Card>

          {/* Interview-Antworten Preview */}
          {selInt && interviewQuestions.length > 0 && (
            <Card style={{ marginBottom: 16 }}>
              <CardHeader
                title={`Antworten aus „${selInt.name}" (${interviewQuestions.length} beantwortet)`}
                icon={Icons.FileText}
                action={<button onClick={() => setShowTexts(!showTexts)} style={{ background: "none", border: "none", color: "#3b82f6", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>{showTexts ? "Einklappen" : "Anzeigen"}</button>}
              />
              {showTexts && (
                <CardBody style={{ maxHeight: 400, overflowY: "auto" }}>
                  {interviewQuestions.map(q => (
                    <div key={q.id} style={{ marginBottom: 12, padding: 10, background: "#f8fafc", borderRadius: 6, borderLeft: "3px solid #3b82f6" }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "#6366f1", marginBottom: 2 }}>{q.id} – {q.text}</div>
                      <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{selInt.antworten[q.id]}</div>
                    </div>
                  ))}
                </CardBody>
              )}
            </Card>
          )}

          {/* Auto-Parse Suggestions */}
          {autoSuggestions.length > 0 && (
            <Card style={{ marginBottom: 16, border: "2px solid #6366f1" }}>
              <CardHeader title="⚡ Auto-Vorschläge" subtitle={`${autoSuggestions.length} Codes per Keyword-Matching erkannt`} icon={Icons.Zap} />
              <CardBody>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {autoSuggestions.slice(0, 15).map(sugg => (
                    <button key={sugg.id} onClick={() => addCoding(sugg.id)}
                      style={{
                        padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
                        background: "#eef2ff", border: `1px solid ${sugg.confidenceColor}`, color: "#374151", transition: "all 0.2s",
                      }}>
                      <span style={{ color: "#6366f1", marginRight: 4 }}>{sugg.id}</span> {sugg.label}
                      <span style={{ marginLeft: 6, fontSize: 10, color: sugg.confidenceColor, fontWeight: 700 }}>{sugg.confidence}</span>
                      {sugg.matchedKeywords.length > 0 && (
                        <span style={{ marginLeft: 4, fontSize: 9, color: "#9ca3af" }}>({sugg.matchedKeywords.join(", ")})</span>
                      )}
                      {codeFreq[sugg.id] && <span style={{ marginLeft: 6, background: "#3b82f6", color: "#fff", borderRadius: 4, padding: "1px 5px", fontSize: 10 }}>{codeFreq[sugg.id]}</span>}
                    </button>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Code-Katalog */}
          {kategorien.map(kat => (
            <Card key={kat} style={{ marginBottom: 12 }}>
              <CardHeader title={kat} subtitle={`${CODEBUCH.filter(c => c.ober === kat).length} Codes`} />
              <CardBody>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {CODEBUCH.filter(c => c.ober === kat).map(code => (
                    <button key={code.id} onClick={() => addCoding(code.id)} disabled={!selInterview}
                      style={{
                        padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: selInterview ? "pointer" : "not-allowed",
                        background: "#f8fafc", border: "1px solid #e5e7eb", color: "#374151", transition: "all 0.2s",
                        opacity: selInterview ? 1 : 0.4,
                      }}>
                      <span style={{ color: "#6366f1", marginRight: 4 }}>{code.id}</span> {code.label}
                      {codeFreq[code.id] && <span style={{ marginLeft: 6, background: "#3b82f6", color: "#fff", borderRadius: 4, padding: "1px 5px", fontSize: 10 }}>{codeFreq[code.id]}</span>}
                    </button>
                  ))}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        {/* Rechte Spalte: Codierungsliste */}
        <Card>
          <CardHeader title={`Codierungen (${codings.length})`} icon={Icons.Code} />
          <CardBody style={{ maxHeight: 600, overflowY: "auto" }}>
            {codings.length === 0 && <div style={{ color: "#9ca3af", fontSize: 13 }}>Noch keine Codierungen. Wählen Sie ein Interview und klicken Sie auf einen Code.</div>}
            {[...codings].reverse().map(c => {
              const code = CODEBUCH.find(cb => cb.id === c.codeId);
              const intName = interviews.find(i => i.id === c.interviewId)?.name || c.interviewId?.slice(0, 8);
              return (
                <div key={c.id} style={{ padding: "10px 12px", background: "#f8fafc", borderRadius: 8, marginBottom: 6, fontSize: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <Badge label={c.rolle} color="#3b82f6" bg="#eff6ff" />
                    <span style={{ marginLeft: 8, fontWeight: 600, color: "#6366f1" }}>{c.codeId}</span>
                    <span style={{ marginLeft: 6, color: "#6b7280" }}>{code?.label}</span>
                    <span style={{ marginLeft: 6, fontSize: 10, color: "#9ca3af" }}>({intName})</span>
                  </div>
                  <button onClick={() => removeCoding(c.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 11 }}>✕</button>
                </div>
              );
            })}
          </CardBody>
        </Card>
      </div>
    </>
  );
}

// ============================================================================
// AUDIT MODULE
// ============================================================================

function AuditModule({ qprScores, evidenceCoverage, codings, dimScores, orgScore }) {
  const stability = Math.round((dimScores.prozess + dimScores.ressource) / 2);
  const readiness = calculateReadiness(evidenceCoverage, 100 - (dimScores["qualität"] > 0 ? 100 - dimScores["qualität"] : 50), stability, orgScore);
  const readinessAmpel = ampel(readiness.score);

  return (
    <>
      <PageTitle title="QPR Audit-Readiness" subtitle="Evidenzbasierte Bewertung der Audit-Bereitschaft" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        <StatCard label="Readiness-Score" value={`${readiness.score}%`} sub={readiness.label} color={readinessAmpel.color} />
        <StatCard label="Evidenzabdeckung" value={`${evidenceCoverage}%`} sub={`${codings.length} Codierungen`} color={ampel(evidenceCoverage).color} />
        <StatCard label="Prozessstabilität" value={`${stability}%`} color={ampel(stability).color} />
      </div>

      <Card style={{ marginBottom: 24 }}>
        <CardHeader title="QPR-Aspekte Bewertung" subtitle="Score je Qualitätsbereich basierend auf Leitfragen" icon={Icons.Shield} />
        <CardBody>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 12, color: "#6b7280", fontWeight: 600 }}>Aspekt</th>
                <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 12, color: "#6b7280", fontWeight: 600 }}>Bereich</th>
                <th style={{ padding: "10px 12px", textAlign: "center", fontSize: 12, color: "#6b7280", fontWeight: 600 }}>Score</th>
                <th style={{ padding: "10px 12px", textAlign: "center", fontSize: 12, color: "#6b7280", fontWeight: 600 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {QPR_ASPEKTE.map(a => {
                const score = qprScores[a.id] || 0;
                const am = ampel(score);
                return (
                  <tr key={a.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px", fontSize: 13, fontWeight: 600 }}>{a.id}</td>
                    <td style={{ padding: "12px", fontSize: 13, color: "#6b7280" }}>{a.label}</td>
                    <td style={{ padding: "12px", textAlign: "center" }}>
                      <span style={{ fontFamily: "'JetBrains Mono'", fontWeight: 700, color: am.color }}>{score}%</span>
                    </td>
                    <td style={{ padding: "12px", textAlign: "center" }}><Badge label={am.label} color={am.color} bg={am.bg} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Readiness-Modell" subtitle="R = 0.3·Evidenz + 0.3·Risiko + 0.2·Stabilität + 0.2·OrgScore" icon={Icons.Activity} />
        <CardBody>
          <PlotlyChart data={[{
            type: "indicator",
            mode: "gauge+number",
            value: readiness.score,
            gauge: {
              axis: { range: [0, 100] },
              bar: { color: readinessAmpel.color },
              steps: [
                { range: [0, 50], color: "#fef2f2" },
                { range: [50, 75], color: "#fffbeb" },
                { range: [75, 100], color: "#ecfdf5" },
              ],
            },
            title: { text: "Audit-Readiness" },
          }]} layout={{ height: 300 }} />
        </CardBody>
      </Card>
    </>
  );
}

// ============================================================================
// HEATMAP MODULE
// ============================================================================

function HeatmapModule({ codings, answers, qprScores }) {
  const heatData = buildHeatmapData(codings);
  const qprValues = QPR_ASPEKTE.map(a => qprScores[a.id] || 0);

  return (
    <>
      <PageTitle title="Problem-Heatmap" subtitle="Visualisierung der Problemverteilung nach Rolle und Kategorie" />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <Card>
          <CardHeader title="Codierungs-Heatmap" subtitle="Häufigkeit nach Rolle × Kategorie" icon={Icons.Grid} />
          <CardBody>
            {codings.length > 0 ? (
              <PlotlyChart data={[{
                z: heatData.z, x: heatData.x, y: heatData.y,
                type: "heatmap", colorscale: "Reds", showscale: true,
              }]} layout={{ height: 350, xaxis: { title: "Kategorie" }, yaxis: { title: "Rolle" } }} />
            ) : (
              <div style={{ color: "#9ca3af", textAlign: "center", padding: 40, fontSize: 13 }}>Noch keine Codierungen vorhanden. Bitte zuerst Interviews codieren.</div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="QPR-Heatmap" subtitle="Bewertung je Qualitätsbereich aus Leitfragen" icon={Icons.Shield} />
          <CardBody>
            <PlotlyChart data={[{
              z: [qprValues],
              x: QPR_ASPEKTE.map(a => a.id),
              y: ["Score"],
              type: "heatmap",
              colorscale: [[0, "#ef4444"], [0.5, "#fbbf24"], [1, "#10b981"]],
              showscale: true,
              text: [qprValues.map(v => `${v}%`)],
              texttemplate: "%{text}",
            }]} layout={{ height: 200, yaxis: { visible: false } }} />
          </CardBody>
        </Card>
      </div>

      {codings.length > 0 && (
        <Card style={{ marginTop: 24 }}>
          <CardHeader title="Top-5 Problembereiche" subtitle="Häufigste Codes über alle Rollen" icon={Icons.AlertTriangle} />
          <CardBody>
            {(() => {
              const freq = {};
              codings.forEach(c => { freq[c.codeId] = (freq[c.codeId] || 0) + 1; });
              const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 5);
              return sorted.map(([codeId, count], i) => {
                const code = CODEBUCH.find(c => c.id === codeId);
                const maxCount = sorted[0][1];
                return (
                  <div key={codeId} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                    <span style={{ width: 24, height: 24, borderRadius: 6, background: "#fef2f2", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>{i + 1}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                        <span style={{ fontWeight: 600 }}>{code?.label || codeId}</span>
                        <span style={{ color: "#6b7280", fontFamily: "'JetBrains Mono'" }}>{count}×</span>
                      </div>
                      <div style={{ height: 6, background: "#f1f5f9", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${(count / maxCount) * 100}%`, background: "#ef4444", borderRadius: 3 }} />
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </CardBody>
        </Card>
      )}
    </>
  );
}

// ============================================================================
// PROZESS MODULE
// ============================================================================

function ProzessModule({ answers, dimScores }) {
  const blockScores = {};
  BLOCKS.forEach(b => {
    const qs = LEITFADEN.filter(q => q.block === b);
    let score = 0, max = 0;
    qs.forEach(q => { score += (answers[q.id] ?? 0) * q.gewicht; max += 4 * q.gewicht; });
    blockScores[b] = max > 0 ? Math.round((score / max) * 100) : 0;
  });

  return (
    <>
      <PageTitle title="Prozessmetriken" subtitle="Analyse der Prozessstabilität und Blockbewertung" />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
        <Card>
          <CardHeader title="Blockbewertung" subtitle="Score je Themenblock aus Leitfragen" icon={Icons.Activity} />
          <CardBody>
            <PlotlyChart data={[{
              x: BLOCKS,
              y: BLOCKS.map(b => blockScores[b]),
              type: "bar",
              marker: { color: BLOCKS.map(b => ampel(blockScores[b]).color) },
            }]} layout={{ height: 350, yaxis: { range: [0, 100], title: "Score %" } }} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Dimensionsprofil" subtitle="Radar-Darstellung der 4 Dimensionen" icon={Icons.TrendingUp} />
          <CardBody>
            <PlotlyChart data={[{
              type: "scatterpolar",
              r: DIMENSIONEN.map(d => dimScores[d] || 0),
              theta: DIMENSIONEN.map(d => DIM_LABELS[d]),
              fill: "toself",
              fillcolor: "rgba(59,130,246,0.12)",
              line: { color: "#3b82f6", width: 2 },
            }]} layout={{ height: 350, polar: { radialaxis: { visible: true, range: [0, 100] } } }} />
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Detailübersicht" icon={Icons.BarChart} />
        <CardBody>
          {BLOCKS.map(b => {
            const s = blockScores[b];
            const a = ampel(s);
            return (
              <div key={b} style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
                <div style={{ width: 100, fontSize: 13, fontWeight: 600 }}>{b}</div>
                <div style={{ flex: 1, height: 10, background: "#f1f5f9", borderRadius: 5, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${s}%`, background: a.color, borderRadius: 5, transition: "width 0.5s" }} />
                </div>
                <div style={{ width: 50, textAlign: "right", fontFamily: "'JetBrains Mono'", fontSize: 13, fontWeight: 700, color: a.color }}>{s}%</div>
                <Badge label={a.label} color={a.color} bg={a.bg} />
              </div>
            );
          })}
        </CardBody>
      </Card>
    </>
  );
}

// ============================================================================
// BENCHMARK MODULE
// ============================================================================

function BenchmarkModule({ orgScore, dimScores }) {
  const benchmarks = {
    prozess: { branche: 62, top: 85 },
    ressource: { branche: 55, top: 78 },
    "qualität": { branche: 68, top: 90 },
    digital: { branche: 45, top: 75 },
  };

  return (
    <>
      <PageTitle title="Benchmark-Vergleich" subtitle="Einordnung im Branchenvergleich (ambulante Pflege)" />

      <Card style={{ marginBottom: 24 }}>
        <CardHeader title="Dimensionsvergleich" subtitle="Eigener Score vs. Branche vs. Top-Performer" icon={Icons.BarChart} />
        <CardBody>
          <PlotlyChart data={[
            { x: DIMENSIONEN.map(d => DIM_LABELS[d]), y: DIMENSIONEN.map(d => dimScores[d] || 0), type: "bar", name: "Eigener Score", marker: { color: "#3b82f6" } },
            { x: DIMENSIONEN.map(d => DIM_LABELS[d]), y: DIMENSIONEN.map(d => benchmarks[d].branche), type: "bar", name: "Branchenschnitt", marker: { color: "#94a3b8" } },
            { x: DIMENSIONEN.map(d => DIM_LABELS[d]), y: DIMENSIONEN.map(d => benchmarks[d].top), type: "bar", name: "Top-Performer", marker: { color: "#10b981" } },
          ]} layout={{ height: 400, barmode: "group", yaxis: { range: [0, 100], title: "Score %" }, legend: { orientation: "h", y: 1.12 } }} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Positionierung" icon={Icons.TrendingUp} />
        <CardBody>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 12, color: "#6b7280" }}>Dimension</th>
                <th style={{ padding: "10px 12px", textAlign: "center", fontSize: 12, color: "#6b7280" }}>Eigener Score</th>
                <th style={{ padding: "10px 12px", textAlign: "center", fontSize: 12, color: "#6b7280" }}>Branche</th>
                <th style={{ padding: "10px 12px", textAlign: "center", fontSize: 12, color: "#6b7280" }}>Δ Branche</th>
                <th style={{ padding: "10px 12px", textAlign: "center", fontSize: 12, color: "#6b7280" }}>Top</th>
                <th style={{ padding: "10px 12px", textAlign: "center", fontSize: 12, color: "#6b7280" }}>Gap zu Top</th>
              </tr>
            </thead>
            <tbody>
              {DIMENSIONEN.map(d => {
                const own = dimScores[d] || 0;
                const br = benchmarks[d].branche;
                const top = benchmarks[d].top;
                const delta = own - br;
                return (
                  <tr key={d} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: 12, fontSize: 13, fontWeight: 600 }}>{DIM_LABELS[d]}</td>
                    <td style={{ padding: 12, textAlign: "center", fontFamily: "'JetBrains Mono'", fontWeight: 700, color: ampel(own).color }}>{own}%</td>
                    <td style={{ padding: 12, textAlign: "center", fontFamily: "'JetBrains Mono'", color: "#6b7280" }}>{br}%</td>
                    <td style={{ padding: 12, textAlign: "center", fontFamily: "'JetBrains Mono'", fontWeight: 700, color: delta >= 0 ? "#10b981" : "#ef4444" }}>{delta >= 0 ? "+" : ""}{delta}%</td>
                    <td style={{ padding: 12, textAlign: "center", fontFamily: "'JetBrains Mono'", color: "#10b981" }}>{top}%</td>
                    <td style={{ padding: 12, textAlign: "center", fontFamily: "'JetBrains Mono'", color: "#f59e0b" }}>{top - own}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </>
  );
}

// ============================================================================
// SIMULATION MODULE
// ============================================================================

function SimulationModule({ dimScores }) {
  const [reduction, setReduction] = useState(10);
  const [cost, setCost] = useState(50000);
  const [targetDim, setTargetDim] = useState("prozess");

  const baseDelay = 100 - (dimScores[targetDim] || 50);
  const sim = simulateScenario(baseDelay, reduction, cost);
  const newScore = Math.min(100, (dimScores[targetDim] || 0) + reduction);

  return (
    <>
      <PageTitle title="Szenario-Simulation" subtitle="What-If Analyse für Interventionsplanung" />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <Card>
          <CardHeader title="Parameter" icon={Icons.Settings} />
          <CardBody>
            <Select label="Zieldimension" value={targetDim} onChange={e => setTargetDim(e.target.value)}
              options={DIMENSIONEN.map(d => ({ value: d, label: DIM_LABELS[d] }))} />
            <Input label={`Verbesserung (Prozentpunkte): ${reduction}`} type="range" min={0} max={40} value={reduction} onChange={e => setReduction(Number(e.target.value))} />
            <Input label={`Investitionskosten (€): ${cost.toLocaleString("de-DE")}`} type="range" min={0} max={200000} step={5000} value={cost} onChange={e => setCost(Number(e.target.value))} />

            <div style={{ marginTop: 16, padding: 16, background: "#f8fafc", borderRadius: 10, border: "1px solid #e5e7eb" }}>
              <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Aktueller Score</div>
              <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "'JetBrains Mono'", color: ampel(dimScores[targetDim] || 0).color }}>{dimScores[targetDim] || 0}%</div>
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 8 }}>Simulierter Score</div>
              <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "'JetBrains Mono'", color: ampel(newScore).color }}>{newScore}%</div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Ergebnis" icon={Icons.Zap} />
          <CardBody>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              <div style={{ padding: 16, background: "#ecfdf5", borderRadius: 10, textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "#059669", fontWeight: 600 }}>ROI</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: sim.roi >= 0 ? "#059669" : "#ef4444", fontFamily: "'JetBrains Mono'" }}>{sim.roi}%</div>
              </div>
              <div style={{ padding: 16, background: "#eff6ff", borderRadius: 10, textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "#3b82f6", fontWeight: 600 }}>Nutzenwert</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: "#3b82f6", fontFamily: "'JetBrains Mono'" }}>{(sim.benefit / 1000).toFixed(0)}k€</div>
              </div>
            </div>

            <PlotlyChart data={[
              { x: ["Aktuell", "Simuliert"], y: [dimScores[targetDim] || 0, newScore], type: "bar", marker: { color: ["#94a3b8", "#3b82f6"] } },
            ]} layout={{ height: 280, yaxis: { range: [0, 100], title: "Score %" }, title: { text: DIM_LABELS[targetDim] } }} />
          </CardBody>
        </Card>
      </div>
    </>
  );
}

// ============================================================================
// WISSENSCHAFTLICHE ANALYSE MODULE
// ============================================================================

function WissenschaftModule({ answers, interviews, codings, dimScores, orgScore, evidenceCoverage }) {
  const [showReport, setShowReport] = useState(false);

  const ci = useMemo(() => berechneBootstrapCI(answers), [answers]);
  const sensitivity = useMemo(() => sensitivitaetsanalyse(answers), [answers]);
  const quality = useMemo(() => berechneDatenqualitaet(interviews, codings, answers), [interviews, codings, answers]);

  const answeredCount = Object.values(answers).filter(v => v > 0).length;
  const missingRate = Math.round(((40 - answeredCount) / 40) * 100);

  // Verteilung der Antworten
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0 };
  Object.values(answers).forEach(v => { if (v >= 1 && v <= 4) distribution[v]++; });

  // Deskriptive Statistik der Antworten
  const answerVals = Object.values(answers).filter(v => v > 0);
  const descStats = answerVals.length > 0 ? {
    mean: Stats.mean(answerVals).toFixed(2),
    median: Stats.median(answerVals),
    sd: Stats.standardDeviation(answerVals).toFixed(2),
    skewness: Stats.skewness(answerVals).toFixed(3),
    iqr: Stats.iqr(answerVals),
    n: answerVals.length,
  } : null;

  const generateReport = () => {
    setShowReport(!showReport);
  };

  const downloadReport = () => {
    const report = `VeRA-BI WISSENSCHAFTLICHER ANALYSEBERICHT
==========================================
Erstellt: ${new Date().toLocaleString('de-DE')}
Version: Research Edition 1.0

1. STICHPROBENBESCHREIBUNG
---------------------------
Interviews:           ${interviews.length}
Codierungen:          ${codings.length}
Beantwortete Fragen:  ${answeredCount} / 40 (${100 - missingRate}%)
Missing Rate:         ${missingRate}%

2. DESKRIPTIVE STATISTIK (Leitfragen-Antworten)
-------------------------------------------------
n:                    ${descStats?.n || 0}
Mittelwert:           ${descStats?.mean || '-'}
Median:               ${descStats?.median || '-'}
Standardabweichung:   ${descStats?.sd || '-'}
Schiefe:              ${descStats?.skewness || '-'}
IQR:                  ${descStats ? `${descStats.iqr.q25} – ${descStats.iqr.q75}` : '-'}

Verteilung:
  1 (trifft nicht zu):     ${distribution[1]}x (${answeredCount > 0 ? Math.round(distribution[1]/answeredCount*100) : 0}%)
  2 (trifft kaum zu):      ${distribution[2]}x (${answeredCount > 0 ? Math.round(distribution[2]/answeredCount*100) : 0}%)
  3 (trifft überwiegend zu): ${distribution[3]}x (${answeredCount > 0 ? Math.round(distribution[3]/answeredCount*100) : 0}%)
  4 (trifft voll zu):      ${distribution[4]}x (${answeredCount > 0 ? Math.round(distribution[4]/answeredCount*100) : 0}%)

3. ORGANISATIONS-SCORE (mit Unsicherheitsmaßen)
-------------------------------------------------
Gesamtscore:          ${orgScore}%
95% Konfidenzintervall: [${ci.lower}%, ${ci.upper}%]
Standardfehler:       ±${ci.se}%
KI-Breite:            ${ci.width} Prozentpunkte
Interpretation:       ${ci.interpretation}

Dimensionsscores:
  Prozessstabilität:    ${dimScores.prozess}%
  Ressourcenlage:       ${dimScores.ressource}%
  Qualitätsstruktur:    ${dimScores["qualität"]}%
  Digitalisierung:      ${dimScores.digital}%

4. SENSITIVITÄTSANALYSE
------------------------
Baseline-Score:       ${sensitivity.baseline}%
Score-Range:          ${sensitivity.range.min}% – ${sensitivity.range.max}%
Variationsbreite:     ±${Math.round(sensitivity.range.span / 2)} Prozentpunkte
Robustheit:           ${sensitivity.robustness}

Detaillierte Variationen:
${sensitivity.variations.map(v => `  ${v.dimension} (${v.delta}): ${v.score}% (Δ ${v.change >= 0 ? '+' : ''}${v.change}%)`).join('\n')}

5. DATENQUALITÄT
-----------------
Gesamtscore:          ${quality.score}/100
Bewertung:            ${quality.interpretation}

Komponenten:
  Leitfragen:           ${quality.components.leitfragen}/35
  Interviews:           ${quality.components.interviews}/25
  Codierungen:          ${quality.components.codierungen}/20
  Evidenzabdeckung:     ${quality.components.evidenz}/20

6. EVIDENZABDECKUNG (QPR)
--------------------------
Abdeckungsquote:      ${evidenceCoverage}%

7. METHODISCHE LIMITATIONEN
-----------------------------
- Gewichtungen nicht empirisch kalibriert (AHP empfohlen)
- Keine externe Validierung gegen QPR-Prüfergebnis
- Querschnittsdaten (keine Test-Retest-Reliabilität)
- Forced-Choice-Skala (1–4) vermeidet Tendenz zur Mitte
- Bootstrap-KI basiert auf Resampling der vorhandenen Daten

8. EMPFEHLUNGEN
----------------
${quality.score < 60 ? '🔴 PRIORITÄT: Datenqualität verbessern – mehr Leitfragen beantworten\n' : ''}${ci.width > 20 ? '🔴 Hohe Unsicherheit – mehr Datenquellen einbeziehen\n' : ''}${missingRate > 30 ? '🟡 Hohe Missing Rate – Interview-Prozess überprüfen\n' : ''}${quality.score >= 75 ? '✓ Datenqualität ist gut – Fokus auf Validierung legen\n' : ''}
==========================================
Ende des wissenschaftlichen Berichts`;

    const blob = new Blob([report], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `VeRA-BI_Wissenschaftlicher_Bericht_${new Date().toISOString().slice(0,10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <PageTitle title="Wissenschaftliche Analyse" subtitle="Statistische Robustheit, Konfidenzintervalle & Datenqualität" />

      {/* Datenqualität Banner */}
      <Card style={{ marginBottom: 20, background: quality.score >= 75 ? "#ecfdf5" : quality.score >= 60 ? "#fffbeb" : "#fef2f2" }}>
        <CardBody style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: 1 }}>Datenqualität</div>
            <div style={{ fontSize: 36, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: ampel(quality.score).color, marginTop: 4 }}>{quality.score}/100</div>
            <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>{quality.interpretation}</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12 }}>
            {Object.entries(quality.components).map(([key, val]) => (
              <div key={key} style={{ padding: "6px 12px", background: "rgba(255,255,255,0.7)", borderRadius: 6 }}>
                <span style={{ color: "#6b7280" }}>{key}: </span>
                <span style={{ fontWeight: 700 }}>{val}</span>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {/* Konfidenzintervall */}
        <Card>
          <CardHeader title="Org-Score (mit 95% KI)" subtitle="Bootstrap-Konfidenzintervall" icon={Icons.Shield} />
          <CardBody>
            <div style={{ fontSize: 42, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: "#111827" }}>{orgScore}%</div>
            <div style={{ fontSize: 14, color: "#6b7280", margin: "8px 0" }}>
              95% KI: <span style={{ fontWeight: 700, color: "#111827" }}>[{ci.lower}%, {ci.upper}%]</span>
            </div>
            <div style={{ fontSize: 12, color: "#9ca3af" }}>Standardfehler: ±{ci.se}% · {ci.interpretation}</div>
            <div style={{ marginTop: 16, padding: 14, background: "#f8fafc", borderRadius: 10, fontSize: 13, lineHeight: 1.6, color: "#374151" }}>
              Mit 95% Wahrscheinlichkeit liegt der wahre Organisations-Score zwischen {ci.lower}% und {ci.upper}%.
              {ci.width > 20 && " Die breite Streuung deutet auf hohe Unsicherheit – mehr Daten empfohlen."}
            </div>
            <PlotlyChart data={[
              { x: ["Score"], y: [orgScore], error_y: { type: "data", symmetric: false, array: [ci.upper - orgScore], arrayminus: [orgScore - ci.lower], color: "#6366f1" }, type: "bar", marker: { color: "#3b82f6" }, width: [0.4] },
            ]} layout={{ height: 200, yaxis: { range: [0, 100], title: "%" }, showlegend: false }} />
          </CardBody>
        </Card>

        {/* Sensitivitätsanalyse */}
        <Card>
          <CardHeader title="Sensitivitätsanalyse" subtitle="±10% Gewichtungsvariation" icon={Icons.Activity} />
          <CardBody>
            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>Score-Range bei Gewichtungsvariation:</div>
            <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: "#111827" }}>
              {sensitivity.range.min}% – {sensitivity.range.max}%
            </div>
            <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>Variationsbreite: ±{Math.round(sensitivity.range.span / 2)}%</div>
            <Badge label={sensitivity.robustness} color={sensitivity.range.span <= 10 ? "#059669" : "#f59e0b"} bg={sensitivity.range.span <= 10 ? "#ecfdf5" : "#fffbeb"} />

            <div style={{ marginTop: 16 }}>
              {sensitivity.variations.map((v, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #f1f5f9", fontSize: 12 }}>
                  <span style={{ color: "#6b7280" }}>{v.dimension} ({v.delta})</span>
                  <div>
                    <span style={{ fontFamily: "'JetBrains Mono'", fontWeight: 700 }}>{v.score}%</span>
                    <span style={{ marginLeft: 8, fontWeight: 600, color: v.change >= 0 ? "#10b981" : "#ef4444" }}>
                      {v.change >= 0 ? "+" : ""}{v.change}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Deskriptive Statistik */}
      {descStats && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
          <Card>
            <CardHeader title="Deskriptive Statistik" subtitle="Leitfragen-Antworten (Forced-Choice 1–4)" icon={Icons.BarChart} />
            <CardBody>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
                {[
                  { l: "Mittelwert", v: descStats.mean },
                  { l: "Median", v: descStats.median },
                  { l: "Std.-Abw.", v: descStats.sd },
                  { l: "Schiefe", v: descStats.skewness },
                  { l: "Q25", v: descStats.iqr.q25 },
                  { l: "Q75", v: descStats.iqr.q75 },
                ].map(s => (
                  <div key={s.l} style={{ padding: 10, background: "#f8fafc", borderRadius: 8, textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase" }}>{s.l}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "'JetBrains Mono'", color: "#111827", marginTop: 2 }}>{s.v}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.6, padding: 12, background: "#f8fafc", borderRadius: 8 }}>
                {parseFloat(descStats.skewness) < -0.5 ? "Linksschiefe Verteilung: Tendenz zu höheren Werten (positive Organisationsbewertung)." :
                 parseFloat(descStats.skewness) > 0.5 ? "Rechtsschiefe Verteilung: Tendenz zu niedrigeren Werten (kritische Bewertung)." :
                 "Annähernd symmetrische Verteilung der Antworten."}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Antwortverteilung" subtitle="Häufigkeit der Skalenwerte" icon={Icons.BarChart} />
            <CardBody>
              <PlotlyChart data={[{
                x: ["1 – trifft nicht zu", "2 – trifft kaum zu", "3 – überwiegend", "4 – trifft voll zu"],
                y: [distribution[1], distribution[2], distribution[3], distribution[4]],
                type: "bar",
                marker: { color: ["#ef4444", "#f59e0b", "#3b82f6", "#10b981"] },
              }]} layout={{ height: 250, yaxis: { title: "Anzahl" } }} />
            </CardBody>
          </Card>
        </div>
      )}

      {/* Missing Data */}
      <Card style={{ marginBottom: 20 }}>
        <CardHeader title="Missing Data Analyse" icon={Icons.AlertTriangle} />
        <CardBody>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, textTransform: "uppercase" }}>Leitfragen</div>
              <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "'JetBrains Mono'", color: ampel(100 - missingRate).color }}>{100 - missingRate}%</div>
              <div style={{ fontSize: 11, color: "#9ca3af" }}>{answeredCount} / 40 beantwortet</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, textTransform: "uppercase" }}>Interviews</div>
              <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "'JetBrains Mono'", color: "#111827" }}>{interviews.length}</div>
              <div style={{ fontSize: 11, color: "#9ca3af" }}>durchgeführt</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, textTransform: "uppercase" }}>Codierungen</div>
              <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "'JetBrains Mono'", color: "#111827" }}>{codings.length}</div>
              <div style={{ fontSize: 11, color: "#9ca3af" }}>erfasst</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, textTransform: "uppercase" }}>QPR-Evidenz</div>
              <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "'JetBrains Mono'", color: ampel(evidenceCoverage).color }}>{evidenceCoverage}%</div>
              <div style={{ fontSize: 11, color: "#9ca3af" }}>Abdeckung</div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Bericht generieren */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <Btn onClick={generateReport}><Icons.FileText size={16} /> {showReport ? "Bericht ausblenden" : "Wissenschaftlichen Bericht anzeigen"}</Btn>
        <Btn variant="secondary" onClick={downloadReport}><Icons.Download size={16} /> Bericht herunterladen (.txt)</Btn>
      </div>

      {showReport && (
        <Card>
          <CardHeader title="Wissenschaftlicher Bericht" subtitle="Generiert für Bachelorarbeit / Methodik-Kapitel" icon={Icons.FileText} />
          <CardBody>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, lineHeight: 1.7, color: "#374151", whiteSpace: "pre-wrap", background: "#f8fafc", padding: 20, borderRadius: 10, maxHeight: 500, overflowY: "auto" }}>
{`STICHPROBE: ${interviews.length} Interviews, ${codings.length} Codierungen, ${answeredCount}/${LEITFADEN.length} Leitfragen
ORGANISATIONS-SCORE: ${orgScore}% [95%-KI: ${ci.lower}%–${ci.upper}%], SE=±${ci.se}%
DIMENSIONEN: Prozess ${dimScores.prozess}% | Ressource ${dimScores.ressource}% | Qualität ${dimScores["qualität"]}% | Digital ${dimScores.digital}%
SENSITIVITÄT: Range ${sensitivity.range.min}%–${sensitivity.range.max}% (±${Math.round(sensitivity.range.span/2)}%) → ${sensitivity.robustness}
DATENQUALITÄT: ${quality.score}/100 → ${quality.interpretation}
QPR-EVIDENZ: ${evidenceCoverage}% Abdeckung
${descStats ? `DESKRIPTIV: M=${descStats.mean}, Mdn=${descStats.median}, SD=${descStats.sd}, Skew=${descStats.skewness}` : ''}

METHODISCHE ANMERKUNGEN:
• Forced-Choice-Skala (1–4) vermeidet Tendenz zur Mitte
• Gewichtung: gleichgewichtetes 4-Dimensionen-Modell (je 25%)
• Bootstrap-KI: n=1000 Resamples, Perzentil-Methode
• Sensitivitätsanalyse: ±10% Gewichtungsvariation mit Renormalisierung`}
            </div>
          </CardBody>
        </Card>
      )}
    </>
  );
}

// ============================================================================
// EXPORT MODULE
// ============================================================================

function ExportModule({ data, onImport }) {
  const download = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vera-bi-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target.result);
        onImport(imported);
      } catch (err) {
        alert("Fehler beim Import: Ungültige JSON-Datei");
      }
    };
    reader.readAsText(file);
  };

  const resetAll = () => {
    if (confirm("Alle lokalen Daten wirklich löschen? Dies kann nicht rückgängig gemacht werden.")) {
      Object.keys(localStorage).filter(k => k.startsWith("vera_")).forEach(k => localStorage.removeItem(k));
      window.location.reload();
    }
  };

  const stats = {
    interviews: data.interviews?.length || 0,
    codings: data.codings?.length || 0,
    answers: Object.keys(data.answers || {}).length,
  };

  return (
    <>
      <PageTitle title="Export / Import" subtitle="Datenmanagement und Backup" />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 24 }}>
        <StatCard label="Interviews" value={stats.interviews} />
        <StatCard label="Codierungen" value={stats.codings} />
        <StatCard label="Leitfragen beantwortet" value={stats.answers} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <Card>
          <CardHeader title="Export" icon={Icons.Download} />
          <CardBody>
            <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>Alle erfassten Daten als JSON- oder CSV-Datei herunterladen.</p>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn onClick={download}><Icons.Download size={16} /> JSON exportieren</Btn>
              <Btn variant="secondary" onClick={() => {
                const headers = ["ID", "InterviewID", "CodeID", "Rolle", "Datum"];
                const rows = (data.codings || []).map(c => [c.id, c.interviewId, c.codeId, c.rolle, c.date]);
                const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
                const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url; a.download = `vera-codings-${new Date().toISOString().slice(0,10)}.csv`; a.click();
                URL.revokeObjectURL(url);
              }}><Icons.Download size={16} /> CSV (Codierungen)</Btn>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Import" icon={Icons.Upload} />
          <CardBody>
            <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>Zuvor exportierte JSON-Datei importieren. Vorhandene Daten werden überschrieben.</p>
            <input type="file" accept=".json" onChange={importFile} id="import-file" style={{ display: "none" }} />
            <label htmlFor="import-file" style={{
              display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8,
              fontSize: 13, fontWeight: 600, cursor: "pointer", background: "#f1f5f9", color: "#374151", border: "1px solid #e5e7eb",
            }}>
              <Icons.Upload size={16} /> JSON importieren
            </label>
          </CardBody>
        </Card>
      </div>

      <Card style={{ marginTop: 24 }}>
        <CardHeader title="Daten zurücksetzen" />
        <CardBody>
          <p style={{ fontSize: 13, color: "#ef4444", marginBottom: 16 }}>Alle lokalen Daten unwiderruflich löschen. Erstellen Sie vorher ein Backup über den Export.</p>
          <Btn variant="danger" onClick={resetAll}><Icons.AlertTriangle size={16} /> Alle Daten löschen</Btn>
        </CardBody>
      </Card>
    </>
  );
}
