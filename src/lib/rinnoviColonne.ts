import type { Foglio } from './stabili';

export interface ColonneRinnovi {
  intestazione: number;
  amministrazione: string;
  via: string;
  civico: string;
  cap?: string;
  comune?: string;
  attivita?: string;
  /** la colonna SCADENZA che contiene le date (nell'elenco ce ne sono due: la prima raggruppa, come "SCADUTI") */
  scadenza: string;
  nop?: string;
  pin?: string;
  note?: string;
}

/** Trova la riga di intestazione e la lettera di ogni colonna. */
export function colonneRinnovi(f: Foglio): ColonneRinnovi | null {
  for (const [n, riga] of f.righe) {
    const voci = [...riga.entries()].map(([c, t]) => [c, t.trim().toLowerCase()] as const);
    const trova = (re: RegExp) => voci.find(([, t]) => re.test(t))?.[0];
    const amministrazione = trova(/^amministrator/);
    const via = trova(/^via/);
    const civico = trova(/^civ/);
    if (!amministrazione || !via || !civico) continue;
    const scadenze = voci.filter(([, t]) => /^scadenza/.test(t)).map(([c]) => c);
    if (!scadenze.length) continue;
    // la colonna delle date è quella i cui valori sono numeri di serie (o date); se non si capisce, l'ultima
    const conDate = scadenze.filter((c) => [...f.righe.entries()].filter(([r]) => r > n).some(([, r]) => /^\d{5}(\.\d+)?$/.test(r.get(c) ?? '') || /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(r.get(c) ?? '')));
    return {
      intestazione: n,
      amministrazione,
      via,
      civico,
      cap: trova(/^c\.?a\.?p/),
      comune: trova(/^citt/),
      attivita: trova(/^attivit/),
      scadenza: conDate.at(-1) ?? scadenze.at(-1)!,
      nop: trova(/^nop/),
      pin: trova(/^pin/),
      note: trova(/^note/),
    };
  }
  return null;
}
