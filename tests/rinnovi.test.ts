import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { leggiElencoRinnovi } from '../src/lib/rinnovi';
import { scadenziario } from '../src/lib/scadenziario';
import type { Stabile } from '../src/lib/stabili';

type Cella = [string, string | number];

async function xlsx(righe: Record<number, Cella[]>): Promise<Uint8Array> {
  const cond: string[] = [];
  const idx = (t: string) => (cond.includes(t) ? cond.indexOf(t) : cond.push(t) - 1);
  const sheet = Object.entries(righe)
    .map(([n, celle]) => `<row r="${n}">${celle.map(([c, v]) => (typeof v === 'number' ? `<c r="${c}${n}"><v>${v}</v></c>` : `<c r="${c}${n}" t="s"><v>${idx(v)}</v></c>`)).join('')}</row>`)
    .join('');
  const zip = new JSZip();
  zip.file('xl/worksheets/sheet1.xml', `<worksheet><sheetData>${sheet}</sheetData></worksheet>`);
  zip.file('xl/sharedStrings.xml', `<sst>${cond.map((t) => `<si><t>${t}</t></si>`).join('')}</sst>`);
  zip.file('xl/workbook.xml', '<workbook><sheets><sheet name="Foglio1" sheetId="1" r:id="rId1"/></sheets></workbook>');
  zip.file('xl/_rels/workbook.xml.rels', '<Relationships><Relationship Id="rId1" Type="x" Target="worksheets/sheet1.xml"/></Relationships>');
  return zip.generateAsync({ type: 'uint8array' });
}

const INTEST: Cella[] = [['A', 'SCADENZA'], ['B', 'AMMINISTRATORI'], ['C', 'VIA/V.LE/P.ZZA/P.LE'], ['D', 'CIVICO'], ['E', 'CAP'], ['F', "CITTA'"], ['G', "ATTIVITA'"], ['H', 'SCADENZA'], ['I', 'NOP'], ['J', 'PIN'], ['K', 'NOTE']];

const file = () =>
  xlsx({
    1: INTEST,
    2: [['A', 'SCADUTI'], ['B', 'BONAFFINI'], ['C', 'FACCIOLI'], ['D', '4'], ['E', '20152'], ['F', 'MILANO'], ['G', '75.1.A'], ['H', 36664], ['I', '310822'], ['J', '30338']],
    3: [['B', 'PASQUALI'], ['C', 'PARRI'], ['D', '35/111'], ['G', '75.4.C'], ['H', 46500], ['I', '311335'], ['K', 'IN CORSO']],
    4: [['B', 'GUIDO'], ['G', 'riga senza via']],
    5: [['B', 'GUIDO'], ['C', 'BIANCOSPINI'], ['D', '8'], ['G', '77.1.A'], ['H', 'da definire']],
  });

describe('elenco rinnovi', () => {
  it('legge le colonne, la colonna SCADENZA con le date e salta le righe senza indirizzo', async () => {
    const r = await leggiElencoRinnovi(await file());
    expect(r).toHaveLength(3);
    expect(r[0]).toMatchObject({ amministrazione: 'BONAFFINI', via: 'FACCIOLI', civico: '4', cap: '20152', comune: 'MILANO', attivita: '75.1.A', scadenza: '2000-05-18', nop: '310822', pin: '30338' });
    expect(r[1]).toMatchObject({ civico: '35/111', nop: '311335', note: 'IN CORSO', scadenza: '2027-04-23' });
    expect(r[2].scadenza).toBe(''); // data non leggibile
  });

  it('file che non è un elenco rinnovi: errore chiaro', async () => {
    await expect(leggiElencoRinnovi(await xlsx({ 1: [['A', 'niente']] }))).rejects.toThrow('rinnovi');
  });

  it('nello scadenziario le voci dell’elenco rinnovi sostituiscono quelle dell’elenco stabili e portano NOP e note', async () => {
    const stabile = { id: 'a', nome: 'P', tipoVia: 'VIA', via: 'PARRI', civico: '35/111', cap: '', comune: '', contatto: '', telefono: '', nop: '', kw: '', attivita: ['75.4.C'], progetto: '', scadenza: '2040', codiceFiscale: '', note: '', amministrazione: 'PASQUALI', origine: 'x.xlsx' } as Stabile;
    const v = scadenziario([stabile], [], '2026-09-29', await leggiElencoRinnovi(await file()));
    const parri = v.filter((x) => x.indirizzo.includes('PARRI'));
    expect(parri).toHaveLength(1);
    expect(parri[0]).toMatchObject({ fonte: 'rinnovi', scadenza: '2027-04-23', nop: '311335', note: 'IN CORSO', precisa: true });
    expect(v.find((x) => x.indirizzo.includes('FACCIOLI'))?.giorni).toBeLessThan(0); // scaduto da anni
    expect(v.find((x) => x.indirizzo.includes('BIANCOSPINI'))).toBeUndefined(); // senza data non è una scadenza
  });
});
