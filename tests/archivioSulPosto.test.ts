import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { aggiornaSulPosto } from '../src/lib/archivioSulPosto';
import { leggiCommesseXlsx } from '../src/lib/commesse';
import { aggiornaElencoLavoriXlsx } from '../src/lib/elencoLavoriAggiornato';
import { conStato } from '../src/lib/pratiche';
import { leggiFogli, leggiStabiliXlsx } from '../src/lib/stabili';
import { scriviValore } from '../src/lib/stabiliAggiornati';
import { sopralluogoCon } from './aiuti';

type Cella = [string, string | number, number?];

/** Excel minimo con più fogli e stili (0 normale, 1 = data gg/mm/aaaa, 2 = grassetto). */
async function xlsx(fogli: { nome: string; righe: Record<number, Cella[]> }[], extra = ''): Promise<Uint8Array> {
  const cond: string[] = [];
  const idx = (t: string) => (cond.includes(t) ? cond.indexOf(t) : cond.push(t) - 1);
  const zip = new JSZip();
  fogli.forEach((f, i) => {
    const sheet = Object.entries(f.righe)
      .map(([n, celle]) => `<row r="${n}" spans="1:32">${celle.map(([c, v, st]) => `<c r="${c}${n}"${st ? ` s="${st}"` : ''}${typeof v === 'number' ? '' : ' t="s"'}><v>${typeof v === 'number' ? v : idx(v)}</v></c>`).join('')}</row>`)
      .join('');
    zip.file(`xl/worksheets/sheet${i + 1}.xml`, `<worksheet><dimension ref="A1:M9"/><sheetData>${sheet}</sheetData>${extra}</worksheet>`);
  });
  zip.file('xl/sharedStrings.xml', `<sst>${cond.map((t) => `<si><t>${t}</t></si>`).join('')}</sst>`);
  zip.file('xl/workbook.xml', `<workbook><sheets>${fogli.map((f, i) => `<sheet name="${f.nome}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets></workbook>`);
  zip.file('xl/_rels/workbook.xml.rels', `<Relationships>${fogli.map((_, i) => `<Relationship Id="rId${i + 1}" Type="x" Target="worksheets/sheet${i + 1}.xml"/>`).join('')}</Relationships>`);
  zip.file('xl/styles.xml', '<styleSheet><cellXfs count="3"><xf numFmtId="0"/><xf numFmtId="14"/><xf numFmtId="0" fontId="1"/></cellXfs></styleSheet>');
  return zip.generateAsync({ type: 'uint8array' });
}

const INTEST: Cella[] = [['A', 'COMM.'], ['C', 'VIA'], ['D', 'INDIRIZZO'], ['E', 'CIV'], ['F', 'CAP'], ['G', "CITTA'"], ['H', 'PRATICA'], ['I', 'REFERENTE INTERNO'], ['J', 'STATO'], ['K', 'DATA FINE'], ['L', 'DATA CONSEGNA'], ['M', 'NOTE']];

const elencoLavori = () =>
  xlsx([
    {
      nome: 'STEMA',
      righe: {
        1: [['A', 'STEMA - COMMESSE 2026', 2]],
        2: INTEST,
        3: [['A', '18', 2], ['B', 'PASQUALI'], ['C', 'VIA'], ['D', 'LINATI'], ['E', '8'], ['H', 'ROA'], ['I', 'ABA'], ['K', 46000, 1]],
        4: [['A', '19'], ['B', 'PASQUALI'], ['C', 'VIA'], ['D', 'EUROPA'], ['E', '5'], ['H', 'IPA'], ['I', 'ABA']],
      },
    },
    { nome: 'STM', righe: { 1: [['A', 'foglio STM da non toccare']] } },
  ]);

function roaEseguita() {
  const s = sopralluogoCon(['74.1.A']);
  Object.assign(s.condominio, { commessa: '18/26', indirizzo: 'Via Linati, 8', pressoAmministrazione: 'Amministrazione PASQUALI' });
  return conStato(conStato(s, 'emessa', '2026-03-01'), 'eseguiti', '2026-06-15');
}

function nuovaCommessa() {
  const s = sopralluogoCon(['77.1.A']);
  Object.assign(s.condominio, { commessa: '30/26', indirizzo: 'Via Nago, 22', pressoAmministrazione: 'Amministrazione SIBOLDI', cap: '20100', comune: 'Milano', dataRelazione: '2026-09-01' });
  return conStato(s, 'emessa', '2026-09-01');
}

describe('elenco lavori aggiornato sul posto', () => {
  it('aggiorna solo le celle della riga e aggiunge la nuova commessa in fondo', async () => {
    const e = await aggiornaElencoLavoriXlsx(await elencoLavori(), [roaEseguita(), nuovaCommessa()]);
    expect(e).toMatchObject({ righeAggiornate: 1, righeAggiunte: 1 });
    const buf = await e.blob!.arrayBuffer();
    const righe = await leggiCommesseXlsx(buf);
    expect(righe.map((r) => r.numero)).toEqual([18, 19, 30]);
    expect(righe[0]).toMatchObject({ stato: 'COMPLETO', dataFine: '2026-06-15', referente: 'ABA' });
    expect(righe[1]).toMatchObject({ pratica: 'IPA', stato: '' }); // riga senza pratica: intatta
    expect(righe[2]).toMatchObject({ cliente: 'SIBOLDI', via: 'VIA NAGO', civico: '22', pratica: 'ROA', dataConsegna: '2026-09-01' });
    // il foglio STM e le altre celle restano quelli di prima
    const fogli = await leggiFogli(buf);
    expect(fogli.map((f) => f.nome)).toEqual(['STEMA', 'STM']);
    expect(fogli[1].righe.get(1)!.get('A')).toBe('foglio STM da non toccare');
    expect(fogli[0].righe.get(1)!.get('A')).toBe('STEMA - COMMESSE 2026');
    // la data resta un numero con lo stile data (non testo) e la dimensione del foglio cresce
    const zip = await JSZip.loadAsync(buf);
    const xml = await zip.file('xl/worksheets/sheet1.xml')!.async('string');
    expect(xml).toMatch(/<c r="K3" s="1"><v>\d+<\/v><\/c>/);
    expect(xml).not.toContain('r="K5"'); // commessa non ancora completata: nessuna data fine
    expect(xml).toContain('<dimension ref="A1:M9"/>');
  });

  it('non riscrive nulla se è già tutto aggiornato', async () => {
    const primo = await aggiornaElencoLavoriXlsx(await elencoLavori(), [roaEseguita()]);
    const secondo = await aggiornaElencoLavoriXlsx(await primo.blob!.arrayBuffer(), [roaEseguita()]);
    expect(secondo.blob).toBeNull();
  });

  it('scriviValore crea la riga mancante al posto giusto', () => {
    const xml = '<sheetData><row r="2"><c r="A2"/></row><row r="5"><c r="A5"/></row></sheetData>';
    const out = scriviValore(xml, 'B', 3, 'x', '4');
    expect(out.indexOf('<row r="3"')).toBeGreaterThan(out.indexOf('<row r="2"'));
    expect(out.indexOf('<row r="3"')).toBeLessThan(out.indexOf('<row r="5"'));
    expect(out).toContain('<c r="B3" s="4" t="inlineStr">');
    expect(scriviValore('<sheetData><row r="1"/></sheetData>', 'A', 2, 7)).toBe('<sheetData><row r="1"/><row r="2"><c r="A2"><v>7</v></c></row></sheetData>');
  });
});

// ---- cartella dell'archivio simulata in memoria ----

class FileFinto {
  kind = 'file' as const;
  constructor(
    public name: string,
    public dati: Uint8Array,
  ) {}
  async getFile() {
    return new Blob([this.dati as BlobPart]);
  }
  async createWritable() {
    let scritto: Blob | undefined;
    return {
      write: async (b: Blob) => {
        scritto = b;
      },
      close: async () => {
        this.dati = new Uint8Array(await scritto!.arrayBuffer());
      },
      abort: async () => {},
    };
  }
}
class CartellaFinta {
  kind = 'directory' as const;
  figli = new Map<string, CartellaFinta | FileFinto>();
  constructor(public name: string) {}
  async *values() {
    yield* this.figli.values();
  }
  async getDirectoryHandle(n: string, o?: { create: boolean }) {
    let c = this.figli.get(n);
    if (!c && o?.create) this.figli.set(n, (c = new CartellaFinta(n)));
    return c as CartellaFinta;
  }
  async getFileHandle(n: string, o?: { create: boolean }) {
    let f = this.figli.get(n);
    if (!f && o?.create) this.figli.set(n, (f = new FileFinto(n, new Uint8Array())));
    return f as FileFinto;
  }
}

const STAB_INTEST: Cella[] = [['A', 'RAG. SOCIALE'], ['C', 'CONDOMINIO'], ['D', 'CIV'], ['E', 'CAP'], ['F', "CITTA'"], ['S', 'nuove att. Dlgs151/11'], ['U', 'ROA'], ['X', 'SCIA CPI'], ['Y', 'RINNOVO'], ['Z', 'SCADENZA']];

describe('aggiornamento dell’archivio sul posto', () => {
  it('riscrive elenco lavori e stabili trovati nelle cartelle e salta le cartelle dei lavori', async () => {
    const radice = new CartellaFinta('ARCHIVIO 2026');
    radice.figli.set('ELENCO LAVORI 2026.xlsx', new FileFinto('ELENCO LAVORI 2026.xlsx', await elencoLavori()));
    const pasquali = new CartellaFinta('PASQUALI');
    radice.figli.set('PASQUALI', pasquali);
    const stab = await xlsx([{ nome: 'PASQUALI 2026', righe: { 1: [['C', 'PASQUALI | ELENCO STABILI']], 2: STAB_INTEST, 3: [['A', 'COND LINATI'], ['B', 'VIA'], ['C', 'LINATI'], ['D', '8'], ['F', 'MILANO'], ['S', '74.1.A']] } }]);
    pasquali.figli.set('Stabili PASQUALI 2026.xlsx', new FileFinto('Stabili PASQUALI 2026.xlsx', stab));
    const lavori = new CartellaFinta('01_LAVORI');
    lavori.figli.set('Stabili copia vecchia.xlsx', new FileFinto('Stabili copia vecchia.xlsx', stab));
    pasquali.figli.set('01_LAVORI', lavori);

    const e = await aggiornaSulPosto(radice as unknown as FileSystemDirectoryHandle, {
      sopralluoghi: [roaEseguita()],
      tecnico: { nome: 'Luca Maldini' } as never,
      mese: '2026-06',
      commesseImportate: [],
      stabili: [],
    });
    expect(e.avvisi).toEqual([]);
    const elenco = radice.figli.get('ELENCO LAVORI 2026.xlsx') as FileFinto;
    expect((await leggiCommesseXlsx(await (await elenco.getFile()).arrayBuffer()))[0]).toMatchObject({ stato: 'COMPLETO', dataFine: '2026-06-15' });
    const st = pasquali.figli.get('Stabili PASQUALI 2026.xlsx') as FileFinto;
    const fogli = await leggiFogli(await (await st.getFile()).arrayBuffer());
    expect(fogli[0].righe.get(3)!.get('U')).toBe('fatta 15/06/2026');
    expect((await leggiStabiliXlsx(await (await st.getFile()).arrayBuffer(), 'x')).length).toBe(1);
    expect((lavori.figli.get('Stabili copia vecchia.xlsx') as FileFinto).dati).toBe(stab); // non toccato
    expect(e.commesse?.righe.length).toBe(2);
    expect(e.file.map((f) => f.nome)).toContain('ELENCO LAVORI 2026.xlsx');
  });
});
