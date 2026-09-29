// Aggiorna sul posto "ELENCO LAVORI 2026.xlsx": cambia solo le celle STATO, DATA FINE, DATA CONSEGNA e REFERENTE delle righe
// che corrispondono a una pratica dell'app, e aggiunge in fondo le commesse nuove. Tutto il resto (formattazione, altri fogli
// come STM, formule) resta com'è perché si modifica solo l'XML delle celle interessate.
import JSZip from 'jszip';
import { colonneCommesse, elencoLavori, leggiCommesseXlsx, type Commessa } from './commesse';
import { percorsiFogli, scriviValore, stileColonna } from './stabiliAggiornati';
import { leggiFogli } from './stabili';
import type { Sopralluogo } from './types';
import { dataItaliana } from './util';

export interface EsitoElencoLavori {
  /** file aggiornato; null se non c'era nulla da cambiare */
  blob: Blob | null;
  righeAggiornate: number;
  righeAggiunte: number;
  celle: number;
  /** elenco completo dopo l'aggiornamento */
  commesse: Commessa[];
}

const seriale = (iso: string): number | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? Math.round(Date.UTC(+m[1], +m[2] - 1, +m[3]) / 86_400_000) + 25569 : null;
};

/** Gli stili (indice s) le cui celle mostrano una data. */
async function stiliData(zip: JSZip): Promise<Set<string>> {
  const xml = (await zip.file('xl/styles.xml')?.async('string')) ?? '';
  const personalizzati = new Map<string, string>();
  for (const m of xml.matchAll(/<numFmt\b[^>]*numFmtId="(\d+)"[^>]*formatCode="([^"]*)"/g)) personalizzati.set(m[1], m[2]);
  const blocco = /<cellXfs\b[^>]*>([\s\S]*?)<\/cellXfs>/.exec(xml)?.[1] ?? '';
  const out = new Set<string>();
  [...blocco.matchAll(/<xf\b([^>]*?)(?:\/>|>)/g)].forEach((m, i) => {
    const id = /numFmtId="(\d+)"/.exec(m[1])?.[1] ?? '0';
    const n = Number(id);
    const codice = (personalizzati.get(id) ?? '').replace(/"[^"]*"|\[[^\]]*\]|\\./g, '');
    if ((n >= 14 && n <= 22) || (n >= 45 && n <= 47) || (personalizzati.has(id) && /[dmy]/i.test(codice))) out.add(String(i));
  });
  return out;
}

export async function aggiornaElencoLavoriXlsx(originale: Blob | ArrayBuffer | Uint8Array, sopralluoghi: Sopralluogo[]): Promise<EsitoElencoLavori> {
  const fresche = await leggiCommesseXlsx(originale);
  const commesse = elencoLavori(fresche, sopralluoghi);
  const fogli = await leggiFogli(originale);
  const foglio = fogli.find((f) => colonneCommesse(f))!;
  const col = colonneCommesse(foglio)!;
  const primaRiga = new Map(fresche.filter((f) => f.riga).map((f) => [f.riga!, f]));

  const zip = await JSZip.loadAsync(originale);
  const file = (await percorsiFogli(zip)).get(foglio.nome);
  if (!file || !zip.file(file)) throw new Error('Non trovo il foglio delle commesse nel file Excel.');
  let xml = await zip.file(file)!.async('string');
  const date = await stiliData(zip);
  const ultimaDati = Math.max(...foglio.righe.keys());

  const scrivi = (lettera: string, riga: number, testo: string, comeData: boolean) => {
    const stile = new RegExp(`<c\\b[^>]*\\br="${lettera}${riga}"[^>]*>`).exec(xml)?.[0].match(/\bs="(\d+)"/)?.[1] ?? stileColonna(xml, lettera, ultimaDati, col.intestazione);
    const n = comeData ? seriale(testo) : null;
    xml = scriviValore(xml, lettera, riga, n !== null && stile && date.has(stile) ? n : comeData ? dataItaliana(testo) : testo, stile);
  };

  let celle = 0;
  let righeAggiornate = 0;
  let righeAggiunte = 0;
  const campi: [keyof Commessa, string | undefined, boolean][] = [
    ['stato', col.stato, false],
    ['dataFine', col.dataFine, true],
    ['dataConsegna', col.dataConsegna, true],
    ['referente', col.referente, false],
  ];
  for (const c of commesse) {
    if (c.origine !== 'app') continue;
    const prima = c.riga ? primaRiga.get(c.riga) : undefined;
    if (prima && c.riga) {
      let toccata = false;
      for (const [k, lettera, comeData] of campi) {
        const nuovo = String(c[k] ?? '');
        if (!lettera || !nuovo || nuovo === String(prima[k] ?? '')) continue;
        scrivi(lettera, c.riga, nuovo, comeData);
        celle++;
        toccata = true;
      }
      if (toccata) righeAggiornate++;
    } else if (!c.riga) {
      const riga = ultimaDati + 1 + righeAggiunte;
      const valori: [string | undefined, string | number, boolean][] = [
        [col.numero, c.numero ?? c.numeroTesto, false],
        [col.cliente, c.cliente, false],
        [col.tipoVia, c.tipoVia, false],
        [col.via, c.via, false],
        [col.civico, c.civico, false],
        [col.cap, c.cap, false],
        [col.comune, c.comune, false],
        [col.pratica, c.pratica, false],
        [col.referente, c.referente, false],
        [col.stato, c.stato, false],
        [col.dataFine, c.dataFine, true],
        [col.dataConsegna, c.dataConsegna, true],
        [col.note, c.note, false],
      ];
      for (const [lettera, v, comeData] of valori) {
        if (!lettera || v === '') continue;
        if (typeof v === 'number') xml = scriviValore(xml, lettera, riga, v, stileColonna(xml, lettera, ultimaDati, col.intestazione));
        else scrivi(lettera, riga, v, comeData);
        celle++;
      }
      righeAggiunte++;
    }
  }
  if (!celle) return { blob: null, righeAggiornate: 0, righeAggiunte: 0, celle: 0, commesse };

  if (righeAggiunte) {
    xml = xml.replace(/(<dimension\s+ref="[A-Z]+\d+:[A-Z]+)(\d+)("\s*\/>)/, (_t, a, b, c) => `${a}${Math.max(Number(b), ultimaDati + righeAggiunte)}${c}`);
  }
  zip.file(file, xml);
  const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  return { blob, righeAggiornate, righeAggiunte, celle, commesse };
}
