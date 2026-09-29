// Lettura dei moduli VV.F. già compilati (MOD. PIN 3 e PIN 2 in .docx) presenti nell'archivio dello studio, per precompilare i
// moduli di una nuova pratica sullo stesso stabile. Si legge il Word con la stessa logica con cui i modelli vengono compilati:
// il valore sta nel riquadro sopra l'etichetta. I file restano sul computer: nulla viene inviato o copiato altrove.
import JSZip from 'jszip';
import type { DatiModuli } from './types';

interface Nodo {
  tag: string;
  attrs: string;
  figli: Nodo[];
  testo: string;
  padre: Nodo | null;
}

const decodifica = (t: string) => t.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');

/** Albero minimo di document.xml: solo ciò che serve (tabelle, righe, celle, paragrafi, testo). */
export function alberoXml(xml: string): Nodo {
  const radice: Nodo = { tag: '#radice', attrs: '', figli: [], testo: '', padre: null };
  let corrente = radice;
  const re = /<(\/?)([\w:]+)([^>]*?)(\/?)>|([^<]+)/g;
  for (const m of xml.matchAll(re)) {
    if (m[5] !== undefined) {
      if (corrente.tag === 'w:t') corrente.testo += decodifica(m[5]);
      continue;
    }
    const [, chiude, tag, attrs, autochiuso] = m;
    if (chiude) {
      if (corrente.padre && corrente.tag === tag) corrente = corrente.padre;
      continue;
    }
    if (tag.startsWith('?') || tag.startsWith('!')) continue;
    const n: Nodo = { tag, attrs, figli: [], testo: '', padre: corrente };
    corrente.figli.push(n);
    if (!autochiuso) corrente = n;
  }
  return radice;
}

const discendenti = (n: Nodo, tag: string): Nodo[] => n.figli.flatMap((f) => (f.tag === tag ? [f] : discendenti(f, tag)));
const norm = (t: string) => t.replace(/[\s ]+/g, ' ').trim();
const testoDi = (n: Nodo): string => norm(discendenti(n, 'w:t').map((t) => t.testo).join(''));
const span = (tc: Nodo) => {
  const g = tc.figli.find((f) => f.tag === 'w:tcPr')?.figli.find((f) => f.tag === 'w:gridSpan');
  return g ? Number(/w:val="(\d+)"/.exec(g.attrs)?.[1] ?? 1) : 1;
};
const celle = (tr: Nodo) => tr.figli.filter((f) => f.tag === 'w:tc');

function posizioni(tr: Nodo): { da: number; a: number; tc: Nodo }[] {
  let x = 0;
  return celle(tr).map((tc) => {
    const s = span(tc);
    const r = { da: x, a: x + s, tc };
    x += s;
    return r;
  });
}

export class ModuloLetto {
  private readonly paragrafi: Nodo[];
  constructor(xml: string) {
    this.paragrafi = discendenti(alberoXml(xml), 'w:p');
  }

  /** Celle della riga precedente che stanno sopra la cella dell'etichetta. */
  private sopra(tc: Nodo): Nodo[] {
    const tr = tc.padre!;
    const righe = tr.padre?.figli.filter((f) => f.tag === 'w:tr') ?? [];
    const prec = righe[righe.indexOf(tr) - 1];
    if (!prec) return [];
    const mia = posizioni(tr).find((p) => p.tc === tc)!;
    return posizioni(prec)
      .filter((p) => p.da < mia.a && p.a > mia.da)
      .map((p) => p.tc);
  }

  private etichette(testo: string): Nodo[] {
    return this.paragrafi.filter((p) => p.padre?.tag === 'w:tc' && testoDi(p) === testo);
  }

  /** Valore scritto nel riquadro sopra la n-esima etichetta `testo` (una sola alternativa per volta). */
  campo(etichette: string | string[], n = 0): string {
    for (const e of Array.isArray(etichette) ? etichette : [etichette]) {
      const trovate = this.etichette(e);
      if (trovate.length <= n) continue;
      const cand = this.sopra(trovate[n].padre!);
      if (cand.length === 1) return testoDi(cand[0]);
    }
    return '';
  }

  codiceFiscale(): string {
    const e = this.etichette('codice fiscale della persona fisica')[0];
    if (!e) return '';
    let cand = this.sopra(e.padre!).map(testoDi);
    if (cand.length === 17 && cand[0] === '') cand = cand.slice(1);
    cand = cand.filter((t) => t !== 'C.F.');
    return cand.length === 16 ? cand.join('').toUpperCase() : '';
  }

  /** Paragrafo che segue un'etichetta (es. "Rif. Pratica VV.F. n."): il riquadro è il primo non vuoto dei successivi. */
  dopoRiga(testo: string): string {
    const i = this.paragrafi.findIndex((p) => testoDi(p) === testo);
    if (i < 0) return '';
    for (let j = i + 1; j <= i + 3; j++) {
      const t = testoDi(this.paragrafi[j] ?? this.paragrafi[i]);
      const pulito = t.replace(/[_;.\s]/g, '');
      if (pulito) return t.replace(/^[_\s]+|[_\s]+$/g, '');
    }
    return '';
  }
}

export interface DatiLetti {
  /** nome del file da cui vengono i dati */
  file: string;
  rifPratica: string;
  comando: string;
  titolare: DatiModuli['titolare'];
  ragione: string;
  sede: DatiModuli['sede'];
  attivita: Pick<DatiModuli['attivita'], 'tipo' | 'indirizzo' | 'civico' | 'cap' | 'comune' | 'provincia' | 'telefono'>;
}

const QUALIFICA = ['qualifica rivestita (titolare, legale rappresentante, amministratore, etc.)', 'qualifica rivestita (titolare, legale rappresentante,amministratore,etc.)'];

/** Dati anagrafici da un MOD. PIN 3 (rinnovo) o MOD. PIN 2 (SCIA) compilato, in .docx. */
export async function leggiModuloCompilato(dati: ArrayBuffer | Uint8Array | Blob, nomeFile = ''): Promise<DatiLetti> {
  const zip = await JSZip.loadAsync(dati);
  const xml = await zip.file('word/document.xml')?.async('string');
  if (!xml) throw new Error('Il file non è un documento Word valido.');
  const m = new ModuloLetto(xml);
  const cognome = m.campo('Cognome', 0);
  if (!cognome && !m.campo('Nome', 0)) throw new Error('Non riconosco il modulo (cerco “Cognome” e “Nome” del titolare).');
  return {
    file: nomeFile,
    rifPratica: m.dopoRiga('Rif. Pratica VV.F. n.'),
    comando: m.dopoRiga('AL COMANDO DEI VIGILI DEL FUOCO DI'),
    titolare: {
      cognome,
      nome: m.campo('Nome', 0),
      indirizzo: m.campo('indirizzo', 0),
      civico: m.campo('n. civico', 0),
      cap: m.campo('c.a.p.', 0),
      comune: m.campo('comune', 0),
      provincia: m.campo('provincia', 0),
      telefono: m.campo('telefono', 0),
      codiceFiscale: m.codiceFiscale(),
      qualifica: m.campo(QUALIFICA, 0),
      email: m.campo('indirizzo di posta elettronica', 0),
      pec: m.campo('indirizzo di posta elettronica certificata', 0),
    },
    ragione: m.campo('ragione sociale ditta, impresa, ente, società, associazione, etc.', 0),
    sede: {
      indirizzo: m.campo('indirizzo', 1),
      civico: m.campo('n. civico', 1),
      cap: m.campo('c.a.p.', 1),
      comune: m.campo('comune', 1),
      provincia: m.campo('provincia', 1),
      telefono: m.campo('telefono', 1),
    },
    attivita: {
      tipo: m.campo(['tipo di attività (albergo, scuola, centrale termica, etc.)', 'tipo di attività (albergo, scuola, etc.) – in caso di SCIA parziale indicare i riferimenti pertinenti']),
      indirizzo: m.campo('Indirizzo', 0),
      civico: m.campo('n. civico', 2),
      cap: m.campo('c.a.p.', 2),
      comune: m.campo('Comune', 0),
      provincia: m.campo('provincia', 2),
      telefono: m.campo('telefono', 2),
    },
  };
}

/** Completa i dati dei moduli con quelli letti dall'archivio, solo dove mancano: ciò che l'utente ha già scritto non si tocca. */
export function completaConLetti(m: DatiModuli, l: DatiLetti): DatiModuli {
  const vuoto = (t: string | undefined) => !t || !t.trim();
  const riempi = <T extends object>(attuale: T, nuovo: Partial<Record<keyof T, string>>): T => {
    const out = { ...attuale } as Record<string, unknown>;
    for (const [k, v] of Object.entries(nuovo) as [string, string | undefined][]) if (vuoto(out[k] as string) && v && v.trim()) out[k] = v.trim();
    return out as T;
  };
  return {
    ...m,
    comando: vuoto(m.comando) ? l.comando || m.comando : m.comando,
    titolare: riempi(m.titolare, l.titolare),
    ragione: vuoto(m.ragione) ? l.ragione : m.ragione,
    sede: riempi(m.sede, l.sede),
    attivita: riempi(m.attivita, l.attivita),
  };
}

/** Riempie i campi di testo vuoti di `attuale` con quelli di `nuovo` (anche negli oggetti annidati); il resto resta com'è. */
export function riempiVuoti<T>(attuale: T, nuovo: T): T {
  if (typeof attuale === 'string') return ((attuale.trim() ? attuale : (nuovo ?? attuale)) as unknown) as T;
  if (attuale && typeof attuale === 'object' && !Array.isArray(attuale) && nuovo && typeof nuovo === 'object') {
    const out: Record<string, unknown> = { ...(attuale as Record<string, unknown>) };
    for (const [k, v] of Object.entries(nuovo as Record<string, unknown>)) out[k] = k in out ? riempiVuoti(out[k], v) : v;
    return out as T;
  }
  return attuale;
}

/**
 * Dati dei moduli completati. Per ogni campo vuoto vale, in ordine: la rubrica dell'amministrazione, il modulo già in archivio,
 * i dati di condominio e attività (`predefiniti`). Ciò che l'utente ha già scritto in `attuali` non si tocca mai.
 */
export function moduliCompletati(attuali: DatiModuli | undefined, predefiniti: DatiModuli, letti?: DatiLetti, noto?: DatiModuli['titolare']): DatiModuli {
  const daArchivio = letti ? { comando: letti.comando, titolare: letti.titolare, ragione: letti.ragione, sede: letti.sede, attivita: letti.attivita } : {};
  const priorita = riempiVuoti(riempiVuoti((noto ? { titolare: noto } : {}) as Partial<DatiModuli>, daArchivio as Partial<DatiModuli>), predefiniti) as DatiModuli;
  return attuali ? riempiVuoti(attuali, priorita) : priorita;
}
