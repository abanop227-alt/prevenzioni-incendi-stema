// Cerca nell'archivio (E:\ARCHIVIO 2026) i moduli VV.F. già compilati per uno stabile:
// <amministratore>\01_LAVORI\CPI\<VIA>, <CIVICO>_<PRATICA>\…  (anche 01_CPI, o senza 01_LAVORI).
// Si leggono solo i nomi delle cartelle e un file: le cartelle delle foto non vengono attraversate.
import { leggiModuloCompilato, type DatiLetti } from './moduliEsistenti';
import { dividiIndirizzo } from './moduliVvf';
import { chiaveIndirizzo } from './stabiliAggiornati';

type Voce = FileSystemHandle & { kind: 'file' | 'directory' };
const voci = (d: FileSystemDirectoryHandle) => (d as unknown as { values: () => AsyncIterable<Voce> }).values();

const PIN_PRINCIPALE = /PIN[.\s_]*(2|3)(?!\.\d|_\d{1,2}(?!\d))/i;

/** "PIN 3", "PIN. 3", "PIN 2", "PIN_3_…" sì; "PIN 3.1", "PIN 2.1", "PIN_2_2_…" no. */
export const èModuloPrincipale = (nome: string) => /\.docx$/i.test(nome) && !nome.startsWith('~$') && PIN_PRINCIPALE.test(nome);

/** Chiavi di confronto dall'indirizzo: due per un intervallo di civici ("PARRI,23-29" vale sia 23 sia 29), una negli altri casi. */
export function chiaviIndirizzo(testo: string): string[] {
  const { indirizzo, civico } = dividiIndirizzo(testo);
  const r = /^(\d+[A-Za-z]?)\s*-\s*(\d+[A-Za-z]?)$/.exec(civico.trim());
  return (r ? [r[1], r[2]] : [civico]).map((c) => chiaveIndirizzo(indirizzo, c));
}

/** Chiavi dell'indirizzo dal nome di una cartella pratica: "VIA NAGO 22_ROA", "CONI ZUGNA , 21_SCIA", "PARRI,23-29_SCIA…". */
export const chiaviDaCartella = (nome: string) => chiaviIndirizzo(nome.split('_')[0]);

/** Prima chiave della cartella (per compatibilità). */
export const chiaveDaCartella = (nome: string) => chiaviDaCartella(nome)[0];

const CARTELLE_DA_SALTARE = /foto|_aggiornamenti/i;

async function sotto(d: FileSystemDirectoryHandle, nome: string): Promise<FileSystemDirectoryHandle | undefined> {
  for await (const v of voci(d)) if (v.kind === 'directory' && v.name.toLowerCase() === nome.toLowerCase()) return v as FileSystemDirectoryHandle;
  return undefined;
}

/** Cartella "CPI" (o "01_CPI") dentro quella dell'amministratore, con o senza "01_LAVORI" davanti. */
async function cartellaCpi(amm: FileSystemDirectoryHandle): Promise<FileSystemDirectoryHandle | undefined> {
  const lavori = (await sotto(amm, '01_LAVORI')) ?? amm;
  return (await sotto(lavori, 'CPI')) ?? (await sotto(lavori, '01_CPI'));
}

interface Trovati {
  docx: File[];
  /** moduli PIN 2/3 solo in .doc o PDF (non leggibili) */
  altri: number;
}

async function moduliInCartella(d: FileSystemDirectoryHandle, t: Trovati, profondita = 4): Promise<void> {
  for await (const v of voci(d)) {
    if (v.kind === 'file') {
      if (èModuloPrincipale(v.name)) t.docx.push(await (v as FileSystemFileHandle).getFile());
      else if (/\.(doc|pdf)$/i.test(v.name) && PIN_PRINCIPALE.test(v.name)) t.altri++;
    } else if (profondita > 0 && !CARTELLE_DA_SALTARE.test(v.name)) {
      await moduliInCartella(v as FileSystemDirectoryHandle, t, profondita - 1);
    }
  }
}

export interface EsitoRicerca {
  letti?: DatiLetti;
  /** cartelle pratica trovate per l'indirizzo */
  cartelle: number;
  /** moduli .docx trovati */
  docx: number;
  /** moduli trovati solo in .doc o PDF, che non si possono leggere */
  altri: number;
}

/** Il modulo compilato più recente per lo stabile all'indirizzo dato, letto dall'archivio. */
export async function datiDaArchivio(radice: FileSystemDirectoryHandle, indirizzo: string): Promise<EsitoRicerca> {
  const esito: EsitoRicerca = { cartelle: 0, docx: 0, altri: 0 };
  if (!dividiIndirizzo(indirizzo).indirizzo) return esito;
  const chiavi = new Set(chiaviIndirizzo(indirizzo));
  const t: Trovati = { docx: [], altri: 0 };
  for await (const amm of voci(radice)) {
    if (amm.kind !== 'directory') continue;
    const cpi = await cartellaCpi(amm as FileSystemDirectoryHandle).catch(() => undefined);
    if (!cpi) continue;
    for await (const pratica of voci(cpi)) {
      if (pratica.kind === 'directory' && chiaviDaCartella(pratica.name).some((k) => chiavi.has(k))) {
        esito.cartelle++;
        await moduliInCartella(pratica as FileSystemDirectoryHandle, t);
      }
    }
  }
  esito.docx = t.docx.length;
  esito.altri = t.altri;
  // dal più recente: il primo che si legge senza errori
  for (const f of t.docx.sort((a, b) => b.lastModified - a.lastModified)) {
    try {
      esito.letti = await leggiModuloCompilato(f, f.name);
      break;
    } catch {
      /* file non leggibile o di altro tipo: si prova il successivo */
    }
  }
  return esito;
}

export interface AmministratoreLetto {
  /** nome della cartella dell'amministratore nell'archivio */
  amministrazione: string;
  titolare: DatiLetti['titolare'];
  file: string;
}

/**
 * Per ogni cartella di amministratore, il titolare scritto nel MOD. PIN 2/3 .docx più recente che si legge.
 * Serve a riempire la rubrica una volta sola, invece di aspettare che ogni amministrazione venga usata nell'app.
 */
export async function amministratoriDaArchivio(radice: FileSystemDirectoryHandle, avanzamento?: (nome: string) => void): Promise<AmministratoreLetto[]> {
  const out: AmministratoreLetto[] = [];
  for await (const amm of voci(radice)) {
    if (amm.kind !== 'directory' || CARTELLE_DA_SALTARE.test(amm.name)) continue;
    const cpi = await cartellaCpi(amm as FileSystemDirectoryHandle).catch(() => undefined);
    if (!cpi) continue;
    avanzamento?.(amm.name);
    const t: Trovati = { docx: [], altri: 0 };
    await moduliInCartella(cpi, t, 5).catch(() => undefined);
    for (const f of t.docx.sort((a, b) => b.lastModified - a.lastModified).slice(0, 8)) {
      try {
        const l = await leggiModuloCompilato(f, f.name);
        if (!l.titolare.cognome.trim() || !l.titolare.nome.trim()) continue;
        out.push({ amministrazione: amm.name, titolare: l.titolare, file: f.name });
        break;
      } catch {
        /* si prova il file successivo */
      }
    }
  }
  return out;
}

// ---------------- indice dei moduli di tutto l'archivio ----------------

export interface IndiceVoce {
  /** file .docx da cui vengono i dati */
  file: string;
  /** data di ultima modifica di quel file (ms): serve per rileggerlo solo se cambia */
  modificato: number;
  /** cartella dell'amministratore */
  amministrazione: string;
  letti: DatiLetti;
}

export interface IndiceModuli {
  /** quando è stato costruito (ms): decide quale copia vince nella sincronizzazione */
  aggiornato: number;
  /** chiave dell'indirizzo (via + civico) → dati del modulo più recente di quello stabile */
  voci: Record<string, IndiceVoce>;
}

/**
 * Legge tutto l'archivio una volta e ricorda, per ogni stabile, i dati del MOD. PIN 2/3 .docx più recente (anche le copie
 * convertite da .doc in _AGGIORNAMENTI\Moduli convertiti). L'indice si sincronizza con gli altri dispositivi, così anche il
 * telefono, che non vede la cartella, compila da solo. Rilegge solo i file cambiati dall'ultima volta.
 */
export async function costruisciIndice(radice: FileSystemDirectoryHandle, precedente?: IndiceModuli, avanzamento?: (testo: string) => void): Promise<IndiceModuli> {
  const voceDi = new Map<string, IndiceVoce>();
  const convertiti = await sotto(radice, '_AGGIORNAMENTI').then((a) => (a ? sotto(a, 'Moduli convertiti') : undefined)).catch(() => undefined);
  let pratiche = 0;
  for await (const amm of voci(radice)) {
    if (amm.kind !== 'directory' || amm.name.startsWith('_')) continue;
    const cpi = await cartellaCpi(amm as FileSystemDirectoryHandle).catch(() => undefined);
    if (!cpi) continue;
    avanzamento?.(`Leggo l’archivio: ${amm.name}…`);
    const convAmm = convertiti ? await sotto(convertiti, amm.name).catch(() => undefined) : undefined;
    for await (const pratica of voci(cpi)) {
      if (pratica.kind !== 'directory') continue;
      const chiavi = chiaviDaCartella(pratica.name);
      if (!chiavi.length) continue;
      const t: Trovati = { docx: [], altri: 0 };
      await moduliInCartella(pratica as FileSystemDirectoryHandle, t).catch(() => undefined);
      const convertita = convAmm ? await sotto(convAmm, pratica.name).catch(() => undefined) : undefined;
      if (convertita) await moduliInCartella(convertita, t).catch(() => undefined);
      pratiche++;
      let voce: IndiceVoce | undefined;
      for (const f of t.docx.sort((a, b) => b.lastModified - a.lastModified)) {
        const prima = chiavi.map((k) => precedente?.voci[k]).find((v) => v && v.file === f.name && v.modificato === f.lastModified);
        if (prima) {
          voce = prima;
          break;
        }
        try {
          const letti = await leggiModuloCompilato(f, f.name);
          if (!letti.titolare.cognome.trim()) continue;
          voce = { file: f.name, modificato: f.lastModified, amministrazione: amm.name, letti };
          break;
        } catch {
          /* non leggibile: si prova il successivo */
        }
      }
      if (!voce) continue;
      for (const k of chiavi) {
        const esistente = voceDi.get(k);
        if (!esistente || esistente.modificato < voce.modificato) voceDi.set(k, voce);
      }
    }
  }
  avanzamento?.(`Archivio letto: ${voceDi.size} stabili con moduli (${pratiche} cartelle).`);
  return { aggiornato: Date.now(), voci: Object.fromEntries(voceDi) };
}

/** I dati del modulo più recente per quell'indirizzo, dall'indice. */
export function cercaInIndice(indice: IndiceModuli | undefined, indirizzo: string): IndiceVoce | undefined {
  if (!indice) return undefined;
  return chiaviIndirizzo(indirizzo).map((k) => indice.voci[k]).find(Boolean);
}

/** Titolare più recente di ogni amministratore, dall'indice: riempie la rubrica. */
export function amministratoriDaIndice(indice: IndiceModuli): AmministratoreLetto[] {
  const per = new Map<string, IndiceVoce>();
  for (const v of Object.values(indice.voci)) {
    const p = per.get(v.amministrazione);
    if (!p || p.modificato < v.modificato) per.set(v.amministrazione, v);
  }
  return [...per.values()]
    .filter((v) => v.letti.titolare.cognome.trim() && v.letti.titolare.nome.trim())
    .map((v) => ({ amministrazione: v.amministrazione, titolare: v.letti.titolare, file: v.file }));
}
