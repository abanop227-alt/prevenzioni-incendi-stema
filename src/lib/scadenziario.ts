// Scadenziario dei rinnovi periodici: unisce le scadenze scritte negli elenchi stabili (spesso solo l'anno) e quelle calcolate
// dai rinnovi presentati con l'app (data precisa). Per lo stesso stabile vale la pratica dell'app, che è più recente.
import { dividiIndirizzo } from './moduliVvf';
import { clienteDa } from './commesse';
import { giorniAllaScadenza, praticaDi, scadenzaRinnovo } from './pratiche';
import type { VoceRinnovo } from './rinnovi';
import { indirizzoStabile, type Stabile } from './stabili';
import { chiaveIndirizzo } from './stabiliAggiornati';
import type { Sopralluogo } from './types';
import { oggiISO } from './util';

export interface VoceScadenza {
  indirizzo: string;
  amministrazione: string;
  attivita: string;
  /** yyyy-mm-dd, oppure solo l'anno (yyyy) quando l'elenco non indica il giorno */
  scadenza: string;
  /** false se è solo un anno */
  precisa: boolean;
  fonte: 'pratica' | 'elenco' | 'rinnovi';
  /** note e numero di pratica VV.F. dall'elenco rinnovi */
  note?: string;
  nop?: string;
  /** giorni da oggi (per un anno solo: fino al 31 dicembre); negativo = scaduta */
  giorni: number;
}

export type Fascia = 'scadute' | 'entro3' | 'entro12' | 'oltre';

export const FASCE: { id: Fascia; titolo: string }[] = [
  { id: 'scadute', titolo: 'Scadute' },
  { id: 'entro3', titolo: 'Prossimi 3 mesi' },
  { id: 'entro12', titolo: 'Prossimi 12 mesi' },
  { id: 'oltre', titolo: 'Oltre 12 mesi' },
];

/** La voce rientra nel periodo? "Prossimi 12 mesi" comprende anche i primi 3. */
export function nellaFascia(v: Pick<VoceScadenza, 'giorni'>, f: Fascia): boolean {
  const g = v.giorni;
  return f === 'scadute' ? g < 0 : f === 'entro3' ? g >= 0 && g <= 92 : f === 'entro12' ? g >= 0 && g <= 366 : g > 366;
}

const fineAnno = (anno: string) => `${anno}-12-31`;

export function scadenziario(stabili: Stabile[], sopralluoghi: Sopralluogo[], oggi = oggiISO(), rinnovi: VoceRinnovo[] = []): VoceScadenza[] {
  const voci = new Map<string, VoceScadenza>();
  for (const s of stabili) {
    const t = s.scadenza.trim();
    const precisa = /^\d{4}-\d{2}-\d{2}$/.test(t);
    if (!precisa && !/^\d{4}$/.test(t)) continue;
    voci.set(chiaveIndirizzo(s.via, s.civico), {
      indirizzo: indirizzoStabile(s),
      amministrazione: s.amministrazione,
      attivita: s.attivita.join(', '),
      scadenza: t,
      precisa,
      fonte: 'elenco',
      giorni: giorniAllaScadenza(precisa ? t : fineAnno(t), oggi),
    });
  }
  // elenco rinnovi dello studio: per gli stabili che ci sono prende il posto della scadenza dell'elenco stabili (una voce per attività)
  const dagliRinnovi = new Map<string, VoceScadenza[]>();
  for (const r of rinnovi) {
    if (!r.scadenza) continue;
    const k = chiaveIndirizzo(r.via, r.civico);
    const lista = dagliRinnovi.get(k) ?? [];
    lista.push({
      indirizzo: `${r.via}, ${r.civico}`,
      amministrazione: r.amministrazione,
      attivita: r.attivita,
      scadenza: r.scadenza,
      precisa: true,
      fonte: 'rinnovi',
      note: r.note,
      nop: r.nop,
      giorni: giorniAllaScadenza(r.scadenza, oggi),
    });
    dagliRinnovi.set(k, lista);
  }
  for (const [k, lista] of dagliRinnovi) {
    voci.delete(k);
    lista.forEach((v, i) => voci.set(`${k}#${i}`, v));
  }

  // rinnovi presentati con l'app: per ogni stabile il più recente
  const recenti = new Map<string, Sopralluogo>();
  for (const s of sopralluoghi) {
    const p = praticaDi(s);
    if (p.tipo !== 'rinnovo' || p.stato !== 'presentata' || !p.dataPresentazione) continue;
    const { indirizzo, civico } = dividiIndirizzo(s.condominio.indirizzo);
    const k = chiaveIndirizzo(indirizzo, civico);
    const prec = recenti.get(k);
    if (!prec || praticaDi(prec).dataPresentazione < p.dataPresentazione) recenti.set(k, s);
  }
  for (const [k, s] of recenti) {
    const p = praticaDi(s);
    const codici = s.attivita.map((a) => a.codice);
    const sc = scadenzaRinnovo(codici, p.dataPresentazione, !!p.indipendenti);
    if (!sc) continue;
    // la pratica dell'app è più recente di ogni elenco: sostituisce le voci dello stesso stabile
    for (const chiave of [...voci.keys()]) if (chiave === k || chiave.startsWith(`${k}#`)) voci.delete(chiave);
    voci.set(k, {
      indirizzo: s.condominio.indirizzo,
      amministrazione: clienteDa(s.condominio.pressoAmministrazione) || '',
      attivita: codici.join(', '),
      scadenza: sc,
      precisa: true,
      fonte: 'pratica',
      giorni: giorniAllaScadenza(sc, oggi),
    });
  }
  return [...voci.values()].sort((a, b) => a.giorni - b.giorni || a.indirizzo.localeCompare(b.indirizzo));
}
