// "ELENCO RINNOVI.xlsx": l'elenco dello studio con la scadenza del rinnovo di ogni attività, il numero di pratica VV.F. (NOP) e le note.
// Colonne riconosciute dall'intestazione: AMMINISTRATORI, VIA/V.LE/P.ZZA/P.LE, CIVICO, CAP, CITTA', ATTIVITA', SCADENZA (la colonna con le date),
// NOP, PIN, NOTE. Si importa una volta e si sincronizza con gli altri dispositivi.
import { colonneRinnovi } from './rinnoviColonne';
import { leggiFogli, seriale } from './stabili';

export interface VoceRinnovo {
  amministrazione: string;
  via: string;
  civico: string;
  cap: string;
  comune: string;
  /** codici attività, come scritti nell'elenco (es. "74.3.C - (77.1.A non inclusa)") */
  attivita: string;
  /** yyyy-mm-dd; vuota se nell'elenco non c'è una data leggibile */
  scadenza: string;
  /** numero di pratica VV.F. */
  nop: string;
  pin: string;
  note: string;
}

export interface RinnoviImportati {
  righe: VoceRinnovo[];
  file: string;
  importato: number;
}

const norm = (t: string) => t.replace(/\s+/g, ' ').trim();

export async function leggiElencoRinnovi(dati: ArrayBuffer | Uint8Array | Blob): Promise<VoceRinnovo[]> {
  const fogli = await leggiFogli(dati);
  for (const f of fogli) {
    const c = colonneRinnovi(f);
    if (!c) continue;
    const out: VoceRinnovo[] = [];
    for (const [n, r] of [...f.righe.entries()].sort((a, b) => a[0] - b[0])) {
      if (n <= c.intestazione) continue;
      const g = (k: string | undefined) => (k ? (r.get(k) ?? '') : '');
      const via = norm(g(c.via));
      const civico = norm(g(c.civico));
      if (!via || !civico) continue; // righe di sezione o vuote
      const data = norm(g(c.scadenza));
      out.push({
        amministrazione: norm(g(c.amministrazione)).toUpperCase(),
        via: via.toUpperCase(),
        civico,
        cap: norm(g(c.cap)),
        comune: norm(g(c.comune)).toUpperCase(),
        attivita: norm(g(c.attivita)),
        scadenza: seriale(data) ?? (/^\d{4}-\d{2}-\d{2}$/.test(data) ? data : /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.test(data) ? data.replace(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, (_m, d, m, a) => `${a}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`) : ''),
        nop: norm(g(c.nop)),
        pin: norm(g(c.pin)),
        note: norm(g(c.note)),
      });
    }
    return out;
  }
  throw new Error('Non riconosco l’elenco rinnovi: cerco le colonne “AMMINISTRATORI”, “VIA…”, “CIVICO” e “SCADENZA”.');
}
