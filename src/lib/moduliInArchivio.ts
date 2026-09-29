// Cerca nell'archivio (E:\ARCHIVIO 2026) i moduli VV.F. già compilati per uno stabile: cartelle <amministratore>\01_LAVORI\CPI\<VIA CIVICO>_<PRATICA>.
// Si legge solo ciò che serve (i nomi delle cartelle e un file): nessuna scansione delle foto.
import { leggiModuloCompilato, type DatiLetti } from './moduliEsistenti';
import { dividiIndirizzo } from './moduliVvf';
import { chiaveIndirizzo } from './stabiliAggiornati';

type Voce = FileSystemHandle & { kind: 'file' | 'directory' };
const voci = (d: FileSystemDirectoryHandle) => (d as unknown as { values: () => AsyncIterable<Voce> }).values();

/** "PIN 3", "PIN 2", "PIN_3_…" sì; "PIN 3.1", "PIN 2.1", "PIN_2_2_…" no. */
export const èModuloPrincipale = (nome: string) => /\.docx$/i.test(nome) && !nome.startsWith('~$') && /PIN[\s_]*(2|3)(?!\.\d|_\d{1,2}(?!\d))/i.test(nome);

/** Chiave dell'indirizzo dal nome di una cartella pratica: "VIA NAGO 22_ROA" → chiave di "Via Nago, 22". */
export function chiaveDaCartella(nome: string): string {
  const { indirizzo, civico } = dividiIndirizzo(nome.split('_')[0]);
  return chiaveIndirizzo(indirizzo, civico);
}

async function sotto(d: FileSystemDirectoryHandle, nome: string): Promise<FileSystemDirectoryHandle | undefined> {
  for await (const v of voci(d)) if (v.kind === 'directory' && v.name.toLowerCase() === nome.toLowerCase()) return v as FileSystemDirectoryHandle;
  return undefined;
}

async function moduliInCartella(d: FileSystemDirectoryHandle, profondita = 2): Promise<File[]> {
  const out: File[] = [];
  for await (const v of voci(d)) {
    if (v.kind === 'file' && èModuloPrincipale(v.name)) out.push(await (v as FileSystemFileHandle).getFile());
    else if (v.kind === 'directory' && profondita > 0) out.push(...(await moduliInCartella(v as FileSystemDirectoryHandle, profondita - 1)));
  }
  return out;
}

/** Il modulo compilato più recente per lo stabile all'indirizzo dato, letto dall'archivio; undefined se non ce n'è. */
export async function datiDaArchivio(radice: FileSystemDirectoryHandle, indirizzo: string): Promise<DatiLetti | undefined> {
  const { indirizzo: via, civico } = dividiIndirizzo(indirizzo);
  if (!via) return undefined;
  const chiave = chiaveIndirizzo(via, civico);
  const candidati: File[] = [];
  for await (const amm of voci(radice)) {
    if (amm.kind !== 'directory') continue;
    const cpi = await sotto((await sotto(amm as FileSystemDirectoryHandle, '01_LAVORI')) ?? (amm as FileSystemDirectoryHandle), 'CPI').catch(() => undefined);
    if (!cpi) continue;
    for await (const pratica of voci(cpi)) {
      if (pratica.kind === 'directory' && chiaveDaCartella(pratica.name) === chiave) candidati.push(...(await moduliInCartella(pratica as FileSystemDirectoryHandle)));
    }
  }
  // dal più recente: il primo che si legge senza errori
  for (const f of candidati.sort((a, b) => b.lastModified - a.lastModified)) {
    try {
      return await leggiModuloCompilato(f, f.name);
    } catch {
      /* file non leggibile o di altro tipo: si prova il successivo */
    }
  }
  return undefined;
}
