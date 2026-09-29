// Aggiornamento diretto dei file dell'archivio (E:\ARCHIVIO 2026): gli elenchi stabili e l'elenco lavori vengono riscritti sul
// posto, con le sole celle cambiate; i resoconti vanno in _AGGIORNAMENTI/Resoconti. Si parte sempre dal file che c'è sul disco
// in quel momento (non da una copia salvata nell'app), così le modifiche fatte a mano in Excel non vanno perse.
import { CARTELLA_AGGIORNAMENTI, generaResoconti, type EsitoVista } from './aggiornamenti';
import { scriviNellArchivio } from './archivio';
import { elencoLavori, type Commessa } from './commesse';
import { aggiornaElencoLavoriXlsx } from './elencoLavoriAggiornato';
import { leggiFogli, leggiStabiliXlsx, type Stabile } from './stabili';
import { applicaModifiche, modifichePerFile, type Modifica } from './stabiliAggiornati';
import type { Sopralluogo, Tecnico } from './types';

export interface FileTrovato {
  handle: FileSystemFileHandle;
  percorso: string[];
}

const DA_SALTARE = /^(01_|_aggiornamenti|\$|\.)/i;

/** Cerca file nella cartella (e nelle sottocartelle fino a `profondita`), saltando le cartelle dei lavori con le foto. */
export async function trovaFile(radice: FileSystemDirectoryHandle, cerca: (nome: string) => boolean, profondita = 2, percorso: string[] = []): Promise<FileTrovato[]> {
  const out: FileTrovato[] = [];
  const voci = (radice as unknown as { values: () => AsyncIterable<FileSystemHandle> }).values();
  for await (const v of voci) {
    if (v.kind === 'file') {
      if (!v.name.startsWith('~$') && cerca(v.name)) out.push({ handle: v as FileSystemFileHandle, percorso: [...percorso, v.name] });
    } else if (profondita > 0 && !DA_SALTARE.test(v.name)) {
      out.push(...(await trovaFile(v as FileSystemDirectoryHandle, cerca, profondita - 1, [...percorso, v.name])));
    }
  }
  return out;
}

export const èElencoStabili = (n: string) => /stabili/i.test(n) && /\.xlsx$/i.test(n);
export const èElencoLavori = (n: string) => /^elenco lavori.*\.xlsx$/i.test(n);

type Scrivibile = FileSystemFileHandle & { createWritable: () => Promise<FileSystemWritableFileStream> };

/** Riscrive il file sul posto; la scrittura è completa solo alla chiusura, quindi un errore lascia intatto l'originale. */
async function sovrascrivi(h: FileSystemFileHandle, blob: Blob): Promise<void> {
  await leggiFogli(blob); // il file nuovo deve essere un Excel leggibile, altrimenti non si tocca l'originale
  const w = await (h as Scrivibile).createWritable();
  try {
    await w.write(blob);
    await w.close();
  } catch (e) {
    await w.abort().catch(() => {});
    throw e;
  }
}

export interface EsitoSulPosto extends EsitoVista {
  /** elenco lavori come è ora sul disco, per aggiornare la copia dell'app */
  commesse?: { file: string; righe: Commessa[] };
  /** elenchi stabili riscritti sul disco, per aggiornare anche la copia dell'app */
  stabiliAggiornati: { origine: string; stabili: Stabile[]; blob: Blob }[];
}

export interface DatiSulPosto {
  sopralluoghi: Sopralluogo[];
  tecnico: Tecnico;
  mese?: string;
  /** usati solo se nella cartella non si trova l'elenco lavori / gli elenchi stabili */
  commesseImportate: Commessa[];
  stabili: Stabile[];
}

export async function aggiornaSulPosto(radice: FileSystemDirectoryHandle, d: DatiSulPosto): Promise<EsitoSulPosto> {
  const file: EsitoSulPosto['file'] = [];
  const modifiche: Record<string, Modifica[]> = {};
  const avvisi: string[] = [];
  const nome = (p: string[]) => p.join('/');
  let commesse: Commessa[] = elencoLavori(d.commesseImportate, d.sopralluoghi);
  let commesseDaDisco: EsitoSulPosto['commesse'];

  // 1. elenco lavori
  const elenchi = await trovaFile(radice, èElencoLavori, 1);
  if (!elenchi.length) avvisi.push('ELENCO LAVORI non trovato nella cartella scelta: scegli la cartella principale dell’archivio.');
  if (elenchi.length > 1) avvisi.push(`Trovati ${elenchi.length} file “ELENCO LAVORI”: uso ${nome(elenchi[0].percorso)}.`);
  if (elenchi[0]) {
    const f = elenchi[0];
    try {
      const attuale = await f.handle.getFile();
      const e = await aggiornaElencoLavoriXlsx(attuale, d.sopralluoghi);
      if (e.blob) {
        await sovrascrivi(f.handle, e.blob);
        file.push({ cartella: f.percorso.slice(0, -1), nome: f.handle.name, descrizione: `${e.righeAggiornate} righe aggiornate, ${e.righeAggiunte} aggiunte` });
      } else file.push({ cartella: f.percorso.slice(0, -1), nome: f.handle.name, descrizione: 'già aggiornato' });
      commesse = e.commesse;
      commesseDaDisco = { file: f.handle.name, righe: e.commesse.map((c) => ({ ...c, origine: 'excel' as const })) };
    } catch (err) {
      avvisi.push(`${f.handle.name}: non aggiornato (${(err as Error).message}). Se è aperto in Excel, chiudilo e riprova.`);
    }
  }

  // 2. elenchi stabili di ogni amministrazione
  let stabili: Stabile[] = [];
  const stabiliAggiornati: EsitoSulPosto['stabiliAggiornati'] = [];
  const elenchiStabili = await trovaFile(radice, èElencoStabili, 2);
  if (!elenchiStabili.length) avvisi.push('Nessun file “Stabili …” trovato nelle cartelle degli amministratori.');
  for (const f of elenchiStabili) {
    try {
      const attuale = await f.handle.getFile();
      const daFile = await leggiStabiliXlsx(attuale, f.handle.name);
      const m = await modifichePerFile(attuale, daFile, d.sopralluoghi);
      modifiche[f.handle.name] = m;
      let letti = daFile;
      if (m.length) {
        const nuovo = await applicaModifiche(attuale, m);
        await sovrascrivi(f.handle, nuovo);
        letti = await leggiStabiliXlsx(nuovo, f.handle.name);
        stabiliAggiornati.push({ origine: f.handle.name, stabili: letti, blob: nuovo });
      }
      stabili.push(...letti);
      file.push({ cartella: f.percorso.slice(0, -1), nome: f.handle.name, descrizione: m.length ? `${m.length} celle aggiornate` : 'nessuna modifica' });
    } catch (err) {
      avvisi.push(`${nome(f.percorso)}: non aggiornato (${(err as Error).message}). Se è aperto in Excel, chiudilo e riprova.`);
    }
  }
  if (!stabili.length) stabili = d.stabili;

  // 3. resoconti del mese
  const resoconti = await generaResoconti({ commesse, sopralluoghi: d.sopralluoghi, stabili, tecnico: d.tecnico, mese: d.mese });
  if (resoconti.length) {
    await scriviNellArchivio(radice, resoconti);
    file.push({ cartella: [CARTELLA_AGGIORNAMENTI, 'Resoconti'], nome: `${resoconti.length} file`, descrizione: 'resoconti del mese' });
  }
  return { file, modifiche, avvisi, commesse: commesseDaDisco, stabiliAggiornati };
}
