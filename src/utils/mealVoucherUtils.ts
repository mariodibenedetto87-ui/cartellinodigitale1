import { TimeEntry } from '../types';

/**
 * Calcola se un giorno ha diritto al buono pasto in base alle timbrature
 * 
 * Regole:
 * 1. Almeno 7 ore continuative (senza pause)
 * 2. Oppure: almeno 6h lavorate + pausa max 2h + altre ore lavorate
 * 3. Massimo 1 buono al giorno
 * 
 * @param entries - Array di timbrature (verranno ordinate automaticamente)
 * @returns true se il giorno matura un buono pasto
 */
export function calculateMealVoucherEligibility(entries: TimeEntry[]): boolean {
  if (entries.length < 2) return false;

  // IMPORTANTE: Ordina le timbrature per timestamp
  const sortedEntries = [...entries].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Raggruppa le timbrature in coppie IN/OUT
  const workSessions: Array<{ start: Date; end: Date; durationMs: number }> = [];
  
  let currentIn: Date | null = null;
  
  for (const entry of sortedEntries) {
    if (entry.type === 'in' && currentIn === null) {
      currentIn = new Date(entry.timestamp);
    } else if (entry.type === 'out' && currentIn !== null) {
      const end = new Date(entry.timestamp);
      const durationMs = end.getTime() - currentIn.getTime();
      
      workSessions.push({ start: currentIn, end, durationMs });
      currentIn = null;
    }
  }

  if (workSessions.length === 0) return false;

  const SEVEN_HOURS_MS = 7 * 60 * 60 * 1000;
  const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

  // Regola 1: Verifica se c'è una sessione singola di 7h continuative
  const hasContinuousSeven = workSessions.some(session => session.durationMs >= SEVEN_HOURS_MS);
  if (hasContinuousSeven) {
    return true;
  }

  // Regola 2: Verifica somma di sessioni con pause <= 2h che raggiungono 7h
  let cumulativeMs = 0;
  let lastEndTime: number | null = null;
  
  for (const session of workSessions) {
    if (lastEndTime === null) {
      // Prima sessione
      cumulativeMs = session.durationMs;
      lastEndTime = session.end.getTime();
    } else {
      // Calcola la pausa dalla fine dell'ultima sessione
      const breakMs = session.start.getTime() - lastEndTime;
      
      if (breakMs <= TWO_HOURS_MS) {
        // Pausa accettabile, aggiungi alla somma
        cumulativeMs += session.durationMs;
        lastEndTime = session.end.getTime();
      } else {
        // Pausa troppo lunga, ricomincia da questa sessione
        cumulativeMs = session.durationMs;
        lastEndTime = session.end.getTime();
      }
    }
    
    // Se abbiamo raggiunto 7h, matura il buono
    if (cumulativeMs >= SEVEN_HOURS_MS) {
      return true;
    }
  }

  return false;
}

/**
 * Calcola il totale ore lavorate in un giorno
 */
export function calculateTotalWorkedHours(entries: TimeEntry[]): number {
  if (entries.length < 2) return 0;

  // Ordina per timestamp
  const sortedEntries = [...entries].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  
  let totalMs = 0;
  let currentIn: Date | null = null;
  
  for (const entry of sortedEntries) {
    if (entry.type === 'in' && currentIn === null) {
      currentIn = new Date(entry.timestamp);
    } else if (entry.type === 'out' && currentIn !== null) {
      const durationMs = new Date(entry.timestamp).getTime() - currentIn.getTime();
      totalMs += durationMs;
      currentIn = null;
    }
  }
  
  return totalMs / (1000 * 60 * 60); // Converti in ore
}

/**
 * Ottiene info dettagliate sulle sessioni di lavoro del giorno
 * Utile per debug e UI
 */
export function getWorkSessionsInfo(entries: TimeEntry[]): {
  sessions: Array<{ start: string; end: string; hours: number; breakAfter?: number }>;
  totalHours: number;
  eligible: boolean;
} {
  if (entries.length < 2) {
    return { sessions: [], totalHours: 0, eligible: false };
  }

  // ORDINA le timbrature per timestamp
  const sortedEntries = [...entries].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const sessions: Array<{ start: string; end: string; hours: number; breakAfter?: number }> = [];
  let currentIn: Date | null = null;
  const workSessions: Array<{ start: Date; end: Date }> = [];
  
  for (const entry of sortedEntries) {
    if (entry.type === 'in' && currentIn === null) {
      currentIn = new Date(entry.timestamp);
    } else if (entry.type === 'out' && currentIn !== null) {
      const end = new Date(entry.timestamp);
      workSessions.push({ start: currentIn, end });
      currentIn = null;
    }
  }
  
  // Crea l'output formattato
  for (let i = 0; i < workSessions.length; i++) {
    const session = workSessions[i];
    const durationMs = session.end.getTime() - session.start.getTime();
    const hours = durationMs / (1000 * 60 * 60);
    
    const sessionInfo: any = {
      start: session.start.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
      end: session.end.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
      hours: parseFloat(hours.toFixed(2))
    };
    
    // Calcola pausa dopo questa sessione (se esiste una sessione successiva)
    if (i < workSessions.length - 1) {
      const nextSession = workSessions[i + 1];
      const breakMs = nextSession.start.getTime() - session.end.getTime();
      sessionInfo.breakAfter = parseFloat((breakMs / (1000 * 60 * 60)).toFixed(2));
    }
    
    sessions.push(sessionInfo);
  }
  
  const totalHours = calculateTotalWorkedHours(sortedEntries);
  const eligible = calculateMealVoucherEligibility(sortedEntries);
  
  return { sessions, totalHours, eligible };
}
