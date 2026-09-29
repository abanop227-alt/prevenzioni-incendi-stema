// Sincronizzazione dei dati importati (oltre ai sopralluoghi): elenchi stabili con il loro Excel originale, elenco lavori importato
// e rubrica degli amministratori. Stesso repository privato dei sopralluoghi:
//   dati/stabili/<nome>-<hash>.json   { tipo: 'stabili', origine, modificato, stabili } oppure { eliminato: true }
//   dati/excel/<nome>-<hash>.xlsx     il file Excel originale dell'elenco stabili
//   dati/commesse.json                l'elenco lavori importato
//   dati/amministratori.json          la rubrica (titolari dei moduli VV.F.)
// Regola: vince la versione con "modificato" più recente; la rubrica si unisce voce per voce, così nessuna voce va persa.
import {
  elencaStabili,
  eliminaFileStabili,
  eliminaStabiliDi,
  importaStabiliDb,
  leggiCommesseImportate,
  leggiFileStabili,
  leggiIndiceModuli,
  leggiRinnoviImportati,
  leggiModificheDati,
  leggiRubricaAmministratori,
  salvaCommesseImportate,
  salvaIndiceModuli,
  salvaRinnoviImportati,
  salvaFileStabili,
  segnaModificaDati,
  unisciRubricaAmministratori,
  type CommesseImportate,
} from './db';
import type { IndiceModuli } from './moduliInArchivio';
import type { RinnoviImportati } from './rinnovi';
import type { Stabile } from './stabili';
import type { DatiModuli } from './types';

type Titolare = DatiModuli['titolare'];

/** Parte del client GitHub di sync.ts che serve qui. */
export interface ClientDati {
  blob(sha: string): Promise<Uint8Array>;
  scrivi(percorso: string, dati: Uint8Array, messaggio: string, ramo: string, sha?: string): Promise<string>;
}

export interface StatoDati {
  sha: Record<string, string>;
  versioni: Record<string, number>;
}

interface Documento {
  formato: 'pi-dati';
  tipo: 'stabili' | 'commesse' | 'amministratori' | 'indice' | 'rinnovi';
  modificato: number;
  eliminato?: boolean;
  origine?: string;
  stabili?: Stabile[];
  commesse?: CommesseImportate;
  rubrica?: Record<string, Titolare>;
  indice?: IndiceModuli;
  rinnovi?: RinnoviImportati;
  autore?: string;
}

const testo = new TextEncoder();
const leggi = new TextDecoder();

function impronta(t: string): string {
  let h = 5381;
  for (const c of t) h = ((h * 33) ^ c.charCodeAt(0)) >>> 0;
  return h.toString(16).padStart(8, '0');
}

/** Nome di file sicuro per GitHub, distinto per ogni nome originale. */
export const percorsoStabili = (origine: string) => `dati/stabili/${origine.replace(/\.xlsx$/i, '').replace(/[^A-Za-z0-9]+/g, '_').slice(0, 40)}-${impronta(origine)}.json`;
export const percorsoExcel = (origine: string) => `dati/excel/${origine.replace(/\.xlsx$/i, '').replace(/[^A-Za-z0-9]+/g, '_').slice(0, 40)}-${impronta(origine)}.xlsx`;
const P_COMMESSE = 'dati/commesse.json';
const P_AMMINISTRATORI = 'dati/amministratori.json';
const P_INDICE = 'dati/indice-moduli.json';
const P_RINNOVI = 'dati/rinnovi.json';

const stessa = (a: object, b: object) => JSON.stringify(Object.entries(a).sort()) === JSON.stringify(Object.entries(b).sort());

export interface EsitoDati {
  inviati: number;
  ricevuti: number;
}

export async function sincronizzaDati(gh: ClientDati, ramo: string, remoto: Map<string, string>, stato: StatoDati, firma: string): Promise<EsitoDati> {
  const esito: EsitoDati = { inviati: 0, ricevuti: 0 };
  const scarica = async (p: string): Promise<Documento | undefined> => {
    const sha = remoto.get(p);
    if (!sha || stato.sha[p] === sha) return undefined;
    const d = JSON.parse(leggi.decode(await gh.blob(sha))) as Documento;
    return d?.formato === 'pi-dati' ? d : undefined;
  };
  const invia = async (p: string, d: Documento, messaggio: string) => {
    stato.sha[p] = await gh.scrivi(p, testo.encode(JSON.stringify({ ...d, autore: firma })), `${messaggio} (${firma})`, ramo, remoto.get(p) ?? stato.sha[p]);
    esito.inviati++;
  };

  // ---- elenchi stabili ----
  const mod = await leggiModificheDati();
  const perOrigine = new Map<string, Stabile[]>();
  for (const s of await elencaStabili()) perOrigine.set(s.origine, [...(perOrigine.get(s.origine) ?? []), s]);
  const origini = new Set<string>([...perOrigine.keys(), ...Object.keys(mod).filter((k) => k.startsWith('stabili:')).map((k) => k.slice(8))]);
  // elenchi presenti solo nel repository: l'origine si legge dal file
  const note = new Set([...origini].map(percorsoStabili));
  const soloRemoti = new Map<string, Documento>();
  for (const p of remoto.keys()) {
    if (!p.startsWith('dati/stabili/') || note.has(p)) continue;
    const d = await scarica(p);
    if (d?.origine) {
      soloRemoti.set(d.origine, d);
      origini.add(d.origine);
    }
  }

  for (const origine of origini) {
    const chiave = `stabili:${origine}`;
    const p = percorsoStabili(origine);
    const locali = perOrigine.get(origine) ?? [];
    const remotoDoc = soloRemoti.get(origine) ?? (await scarica(p));
    let L = mod[chiave] ?? 0;
    if (remotoDoc && remotoDoc.modificato > L) {
      if (remotoDoc.eliminato) {
        await eliminaStabiliDi(origine);
        await eliminaFileStabili(origine);
      } else {
        await importaStabiliDb(remotoDoc.stabili ?? [], origine);
        const shaExcel = remoto.get(percorsoExcel(origine));
        if (shaExcel) await salvaFileStabili(origine, new Blob([(await gh.blob(shaExcel)) as BlobPart]));
      }
      await segnaModificaDati(chiave, remotoDoc.modificato);
      stato.sha[p] = remoto.get(p)!;
      stato.versioni[`dati:${chiave}`] = remotoDoc.modificato;
      esito.ricevuti++;
      continue;
    }
    if (remotoDoc) stato.sha[p] = remoto.get(p)!;
    if (!locali.length && !L) continue; // niente qui e niente da annunciare
    if (locali.length && !L) {
      L = Date.now();
      await segnaModificaDati(chiave, L);
    }
    if (stato.versioni[`dati:${chiave}`] === L && remoto.has(p)) continue; // già allineato
    if (!locali.length) {
      // importati e poi tolti qui: la cancellazione raggiunge gli altri dispositivi
      await invia(p, { formato: 'pi-dati', tipo: 'stabili', origine, modificato: L, eliminato: true }, `Elenco stabili tolto: ${origine}`);
    } else {
      const excel = await leggiFileStabili(origine);
      if (excel) {
        const pe = percorsoExcel(origine);
        stato.sha[pe] = await gh.scrivi(pe, new Uint8Array(await excel.arrayBuffer()), `Excel ${origine} (${firma})`, ramo, remoto.get(pe) ?? stato.sha[pe]);
      }
      await invia(p, { formato: 'pi-dati', tipo: 'stabili', origine, modificato: L, stabili: locali }, `Stabili ${origine}`);
    }
    stato.versioni[`dati:${chiave}`] = L;
  }

  // ---- elenco lavori importato ----
  {
    const remotoDoc = await scarica(P_COMMESSE);
    const locale = await leggiCommesseImportate();
    let L = mod.commesse ?? 0;
    if (remotoDoc && remotoDoc.modificato > L) {
      await salvaCommesseImportate(remotoDoc.eliminato ? null : (remotoDoc.commesse ?? null));
      await segnaModificaDati('commesse', remotoDoc.modificato);
      stato.sha[P_COMMESSE] = remoto.get(P_COMMESSE)!;
      stato.versioni['dati:commesse'] = remotoDoc.modificato;
      esito.ricevuti++;
    } else {
      if (remotoDoc) stato.sha[P_COMMESSE] = remoto.get(P_COMMESSE)!;
      if (locale && !L) {
        L = Date.now();
        await segnaModificaDati('commesse', L);
      }
      if ((locale || L) && !(stato.versioni['dati:commesse'] === L && remoto.has(P_COMMESSE))) {
        await invia(P_COMMESSE, locale ? { formato: 'pi-dati', tipo: 'commesse', modificato: L, commesse: locale } : { formato: 'pi-dati', tipo: 'commesse', modificato: L, eliminato: true }, 'Elenco lavori');
        stato.versioni['dati:commesse'] = L;
      }
    }
  }

  // ---- elenco rinnovi importato ----
  {
    const remotoDoc = await scarica(P_RINNOVI);
    const locale = await leggiRinnoviImportati();
    let L = mod.rinnovi ?? 0;
    if (remotoDoc && remotoDoc.modificato > L) {
      await salvaRinnoviImportati(remotoDoc.eliminato ? null : (remotoDoc.rinnovi ?? null));
      await segnaModificaDati('rinnovi', remotoDoc.modificato);
      stato.sha[P_RINNOVI] = remoto.get(P_RINNOVI)!;
      stato.versioni['dati:rinnovi'] = remotoDoc.modificato;
      esito.ricevuti++;
    } else {
      if (remotoDoc) stato.sha[P_RINNOVI] = remoto.get(P_RINNOVI)!;
      if (locale && !L) {
        L = locale.importato;
        await segnaModificaDati('rinnovi', L);
      }
      if ((locale || L) && !(stato.versioni['dati:rinnovi'] === L && remoto.has(P_RINNOVI))) {
        await invia(P_RINNOVI, locale ? { formato: 'pi-dati', tipo: 'rinnovi', modificato: L, rinnovi: locale } : { formato: 'pi-dati', tipo: 'rinnovi', modificato: L, eliminato: true }, 'Elenco rinnovi');
        stato.versioni['dati:rinnovi'] = L;
      }
    }
  }

  // ---- indice dei moduli dell'archivio (costruito sul computer, letto anche dal telefono) ----
  {
    const remotoDoc = await scarica(P_INDICE);
    const locale = await leggiIndiceModuli();
    let L = mod.indice ?? 0;
    if (remotoDoc && remotoDoc.modificato > L && remotoDoc.indice) {
      await salvaIndiceModuli(remotoDoc.indice);
      await segnaModificaDati('indice', remotoDoc.modificato);
      stato.sha[P_INDICE] = remoto.get(P_INDICE)!;
      stato.versioni['dati:indice'] = remotoDoc.modificato;
      esito.ricevuti++;
    } else {
      if (remotoDoc) stato.sha[P_INDICE] = remoto.get(P_INDICE)!;
      if (locale && !L) {
        L = locale.aggiornato;
        await segnaModificaDati('indice', L);
      }
      if (locale && L && !(stato.versioni['dati:indice'] === L && remoto.has(P_INDICE))) {
        await invia(P_INDICE, { formato: 'pi-dati', tipo: 'indice', modificato: L, indice: locale }, 'Indice moduli');
        stato.versioni['dati:indice'] = L;
      }
    }
  }

  // ---- rubrica degli amministratori (unione voce per voce) ----
  {
    const remotoDoc = await scarica(P_AMMINISTRATORI);
    let L = mod.amministratori ?? 0;
    if (remotoDoc?.rubrica) {
      const piuRecenteRemoto = remotoDoc.modificato > L;
      await unisciRubricaAmministratori(remotoDoc.rubrica, piuRecenteRemoto);
      stato.sha[P_AMMINISTRATORI] = remoto.get(P_AMMINISTRATORI)!;
      if (piuRecenteRemoto) {
        await segnaModificaDati('amministratori', remotoDoc.modificato);
        L = remotoDoc.modificato;
        esito.ricevuti++;
      }
    }
    const unita = await leggiRubricaAmministratori();
    if (Object.keys(unita).length) {
      if (!L) {
        L = Date.now();
        await segnaModificaDati('amministratori', L);
      }
      const uguale = remotoDoc?.rubrica ? stessa(unita, remotoDoc.rubrica) : remoto.has(P_AMMINISTRATORI) && stato.versioni['dati:amministratori'] === L;
      if (!uguale) await invia(P_AMMINISTRATORI, { formato: 'pi-dati', tipo: 'amministratori', modificato: L, rubrica: unita }, 'Rubrica amministratori');
      stato.versioni['dati:amministratori'] = L;
    }
  }
  return esito;
}
