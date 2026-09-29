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
