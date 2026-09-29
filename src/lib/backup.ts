import { STUDIO } from '../config/studio';
import { base64ToBytes, bytesToBase64 } from './base64';
import {
  db,
  elencaStabili,
  importaStabiliDb,
  leggiCommesseImportate,
  leggiFileStabili,
  leggiRinnoviImportati,
  leggiRubricaAmministratori,
  leggiTecnico,
  salvaCommesseImportate,
  salvaRinnoviImportati,
  salvaFileStabili,
  salvaTecnico,
  unisciRubricaAmministratori,
  type CommesseImportate,
} from './db';
import type { RinnoviImportati } from './rinnovi';
import type { Stabile } from './stabili';
import type { FotoRecord, Sopralluogo, Tecnico } from './types';

interface FotoBackup extends Omit<FotoRecord, 'blob'> {
  data: string; // base64
}

export interface Backup {
  formato: 'roa-backup';
  versione: 1;
  esportato: string;
  sopralluoghi: Sopralluogo[];
  foto: FotoBackup[];
  tecnico?: Tecnico;
  /** dati importati: elenchi stabili con il loro Excel, elenco lavori, rubrica (solo nei backup completi) */
  dati?: {
    stabili: { origine: string; stabili: Stabile[]; excel?: string }[];
    commesse?: CommesseImportate;
    rinnovi?: RinnoviImportati;
    amministratori?: Record<string, unknown>;
  };
}

export interface EsitoImport {
  importati: number;
  saltati: number;
  foto: number;
}

/** Crea il backup (.json con foto in base64) di tutti i sopralluoghi o solo di quelli indicati. */
export async function creaBackup(ids?: string[]): Promise<Backup> {
  const d = await db();
  let sopralluoghi = await d.getAll('sopralluoghi');
  if (ids) sopralluoghi = sopralluoghi.filter((s) => ids.includes(s.id));
  const foto: FotoBackup[] = [];
  for (const s of sopralluoghi) {
    for (const f of await d.getAllFromIndex('foto', 'sopralluogoId', s.id)) {
      const { blob, ...resto } = f;
      foto.push({ ...resto, data: bytesToBase64(new Uint8Array(await blob.arrayBuffer())) });
    }
  }
  const tecnico = await leggiTecnico();
  const backup: Backup = { formato: 'roa-backup', versione: 1, esportato: new Date().toISOString(), sopralluoghi, foto, tecnico };
  if (!ids) {
    const perOrigine = new Map<string, Stabile[]>();
    for (const st of await elencaStabili()) perOrigine.set(st.origine, [...(perOrigine.get(st.origine) ?? []), st]);
    const stabili = [];
    for (const [origine, l] of perOrigine) {
      const x = await leggiFileStabili(origine);
      stabili.push({ origine, stabili: l, excel: x ? bytesToBase64(new Uint8Array(await x.arrayBuffer())) : undefined });
    }
    backup.dati = { stabili, commesse: await leggiCommesseImportate(), rinnovi: await leggiRinnoviImportati(), amministratori: await leggiRubricaAmministratori() };
  }
  return backup;
}

export async function esportaBackup(ids?: string[]): Promise<Blob> {
  return new Blob([JSON.stringify(await creaBackup(ids))], { type: 'application/json' });
}

/**
 * Importa un backup. Se sul dispositivo esiste già lo stesso sopralluogo ed è più recente
 * (o uguale), viene mantenuto quello del dispositivo.
 */
export async function importaBackup(testo: string): Promise<EsitoImport> {
  let b: Backup;
  try {
    b = JSON.parse(testo);
  } catch {
    throw new Error('Il file non è un JSON valido.');
  }
  if (b?.formato !== 'roa-backup' || !Array.isArray(b.sopralluoghi)) {
    throw new Error(`Il file non è un backup di ${STUDIO.prodotto}.`);
  }
  const d = await db();
  const esito: EsitoImport = { importati: 0, saltati: 0, foto: 0 };
  // dati del tecnico: importati solo se su questo dispositivo non sono ancora stati compilati
  if (b.tecnico && !(await leggiTecnico()).firma.trim()) await salvaTecnico({ ...(await leggiTecnico()), ...b.tecnico });
  // dati importati: si aggiunge solo ciò che manca su questo dispositivo, senza sovrascrivere
  if (b.dati) {
    const presenti = new Set((await elencaStabili()).map((x) => x.origine));
    for (const e of b.dati.stabili ?? []) {
      if (presenti.has(e.origine) || !Array.isArray(e.stabili)) continue;
      await importaStabiliDb(e.stabili, e.origine);
      if (e.excel) await salvaFileStabili(e.origine, new Blob([base64ToBytes(e.excel) as BlobPart]));
    }
    if (b.dati.commesse && !(await leggiCommesseImportate())) await salvaCommesseImportate(b.dati.commesse);
    if (b.dati.rinnovi && !(await leggiRinnoviImportati())) await salvaRinnoviImportati(b.dati.rinnovi);
    if (b.dati.amministratori) await unisciRubricaAmministratori(b.dati.amministratori as never, false);
  }
  for (const s of b.sopralluoghi) {
    if (!s?.id || !Array.isArray(s.voci)) continue;
    const presente = await d.get('sopralluoghi', s.id);
    if (presente && presente.modificato >= s.modificato) {
      esito.saltati++;
      continue;
    }
    const foto = (b.foto || []).filter((f) => f.sopralluogoId === s.id);
    const tx = d.transaction(['sopralluoghi', 'foto'], 'readwrite');
    const storeFoto = tx.objectStore('foto');
    for await (const cur of storeFoto.index('sopralluogoId').iterate(s.id)) await cur.delete();
    for (const f of foto) {
      const { data, ...resto } = f;
      await storeFoto.put({ ...resto, blob: new Blob([base64ToBytes(data) as BlobPart], { type: f.type }) });
      esito.foto++;
    }
    await tx.objectStore('sopralluoghi').put(s);
    await tx.done;
    esito.importati++;
  }
  return esito;
}
