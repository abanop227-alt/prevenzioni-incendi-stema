import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { tecnicoVuoto } from '../src/lib/catalogo';
import { chiaviDaCartella, chiaviIndirizzo, datiDaArchivio, èModuloPrincipale } from '../src/lib/moduliInArchivio';
import { compilaModello, moduliPredefiniti, professionistaVuoto, valoriPin3 } from '../src/lib/moduliVvf';
import { chiaveIndirizzo } from '../src/lib/stabiliAggiornati';
import { sopralluogoCon } from './aiuti';

describe('ricerca dei moduli nell’archivio', () => {
  it('riconosce solo i moduli principali PIN 2 e PIN 3, con i nomi usati in archivio', () => {
    for (const ok of [
      '01_Via Aosta, 21_MOD. PIN 3 - 2023_RINNOVO PERIODICO.docx',
      'MOD. PIN 2-2023_SCIA.docx',
      'PIN_2_2023_SCIA_FV.docx',
      '1_PARRI, 23_MOD PIN. 3 - 2018_RINNOVO PERIODICO.docx',
      '01_DANTE, 33_PIN_3_2023 Rinnovo_FV.docx',
      '02_PARRI, 29_MOD. PIN 2-2023_SCIA_TORRE B.docx',
    ]) expect(èModuloPrincipale(ok), ok).toBe(true);
    for (const no of [
      '02_Via Aosta_MOD. PIN 3.1 - 2014_ASSEVERAZIONE PER RINNOVO.docx',
      'MOD. PIN 2.1-2018_ASSEVERAZIONE.docx',
      'CONI ZUGNA, 21_PIN_2.5-2018_CERT.IMP.docx',
      'BALZAC, 10_PIN_2.2-2023_CERT_REI.docx',
      'CATERINA, 36_PIN_2.3-2023_DICH. PROD.docx',
      'MEDEA, 18_PIN 2.6-2018_ DICH. NON AGGRAVIO.docx',
      'MOD. PIN 3.docx.pdf',
      '~$MOD. PIN 3.docx',
      'PIN 3.doc',
      'X_MOD. PIN 7-2018_VOLTURA.docx',
    ]) expect(èModuloPrincipale(no), no).toBe(false);
  });

  it('le cartelle pratica dell’archivio corrispondono allo stabile', () => {
    expect(chiaviDaCartella('LINATI, 8_ROA+SCIA')).toEqual([chiaveIndirizzo('Linati', '8')]);
    expect(chiaviDaCartella('CONI ZUGNA , 21_SCIA')).toEqual([chiaveIndirizzo('Coni Zugna', '21')]);
    expect(chiaviDaCartella('VIA NAGO 22_ROA')).toEqual([chiaveIndirizzo('Via Nago', '22')]);
    // intervallo di civici: vale per entrambi
    expect(chiaviDaCartella('PARRI,23-29_SCIA 77(X2) - RINNOVO 75')).toEqual([chiaveIndirizzo('Parri', '23'), chiaveIndirizzo('Parri', '29')]);
    expect(chiaviIndirizzo('Via Parri, 29')).toEqual([chiaveIndirizzo('Parri', '29')]);
  });
});

// ---- archivio finto, con la struttura reale (<AMMINISTRATORE>\01_LAVORI\CPI\<VIA, CIVICO>_<PRATICA>\…) ----

class FileFinto {
  kind = 'file' as const;
  constructor(
    public name: string,
    public dati: Uint8Array,
    public lastModified = 1,
  ) {}
  async getFile() {
    const f = new File([this.dati as BlobPart], this.name);
    Object.defineProperty(f, 'lastModified', { value: this.lastModified });
    return f;
  }
}
class CartellaFinta {
  kind = 'directory' as const;
  figli = new Map<string, CartellaFinta | FileFinto>();
  constructor(public name: string) {}
  async *values() {
    yield* this.figli.values();
  }
  cartella(nome: string) {
    let c = this.figli.get(nome);
    if (!c) this.figli.set(nome, (c = new CartellaFinta(nome)));
    return c as CartellaFinta;
  }
  percorso(...p: string[]): CartellaFinta {
    return p.reduce<CartellaFinta>((c, n) => c.cartella(n), this);
  }
}

describe('lettura dall’archivio (struttura reale)', () => {
  it('trova il PIN 3 più recente nella cartella dello stabile, anche in sottocartelle, e ignora .doc, PDF e altre pratiche', async () => {
    const s = sopralluogoCon(['77.1.A']);
    Object.assign(s.condominio, { indirizzo: 'Via Linati, 8', cap: '20128', comune: 'Milano', codiceFiscale: '80000000000' });
    const d = moduliPredefiniti(s);
    Object.assign(d.titolare, { cognome: 'BIANCHI', nome: 'LUCA', codiceFiscale: 'BNCLCU70A01F205X' });
    const t = { ...tecnicoVuoto, vvf: professionistaVuoto() };
    const modello = new Uint8Array(readFileSync(new URL('../public/moduli/pin3-rinnovo.docx', import.meta.url)));
    const blob = await compilaModello(modello, valoriPin3(s, d, t));
    const docx = new Uint8Array(await blob.arrayBuffer());

    const radice = new CartellaFinta('ARCHIVIO 2026');
    const cpi = radice.percorso('PASQUALI', '01_LAVORI', 'CPI');
    const pratica = cpi.percorso('LINATI, 8_ROA+SCIA');
    pratica.percorso('0_PEC PROTOCOLLO_SCIA').figli.set('01_LINATI, 8_MOD. PIN 3 - 2023_RINNOVO PERIODICO.pdf', new FileFinto('01_LINATI, 8_MOD. PIN 3 - 2023_RINNOVO PERIODICO.pdf', new Uint8Array([1])));
    pratica.percorso('RINNOVO').figli.set('01_LINATI, 8_MOD PIN. 3 - 2018_RINNOVO PERIODICO.doc', new FileFinto('01_LINATI, 8_MOD PIN. 3 - 2018_RINNOVO PERIODICO.doc', new Uint8Array([1])));
    pratica.percorso('RINNOVO', 'MODULI').figli.set('01_LINATI, 8_MOD PIN. 3 - 2023_RINNOVO PERIODICO.docx', new FileFinto('01_LINATI, 8_MOD PIN. 3 - 2023_RINNOVO PERIODICO.docx', docx, 5));
    pratica.percorso('FOTO 12-05-26').figli.set('MOD PIN 3 falso.docx', new FileFinto('MOD PIN 3 falso.docx', new Uint8Array([9]), 99)); // nelle cartelle FOTO non si entra
    cpi.percorso('MEDEA, 18_SCIA').figli.set('MOD. PIN 3.docx', new FileFinto('MOD. PIN 3.docx', new Uint8Array([9]), 9)); // altro stabile
    // un'altra amministrazione, con la variante 01_CPI e nessun 01_LAVORI
    radice.percorso('FORLANO', '01_LAVORI', '01_CPI', 'DANTE ALIGHIERI, 33_RINNOVO').figli.set('01_D_PIN_3_2023 Rinnovo_FV.docx', new FileFinto('01_D_PIN_3_2023 Rinnovo_FV.docx', docx, 7));

    const r = await datiDaArchivio(radice as unknown as FileSystemDirectoryHandle, 'Via Linati, 8');
    expect(r).toMatchObject({ cartelle: 1, docx: 1, altri: 2 });
    expect(r.letti?.titolare).toMatchObject({ cognome: 'BIANCHI', nome: 'LUCA', codiceFiscale: 'BNCLCU70A01F205X' });
    expect(r.letti?.file).toBe('01_LINATI, 8_MOD PIN. 3 - 2023_RINNOVO PERIODICO.docx');

    // la variante 01_CPI e il nome con ", " funzionano
    const r2 = await datiDaArchivio(radice as unknown as FileSystemDirectoryHandle, 'Via Dante Alighieri, 33');
    expect(r2).toMatchObject({ cartelle: 1, docx: 1 });
    // nessuna cartella: esito vuoto ma chiaro
    const vuoto = await datiDaArchivio(radice as unknown as FileSystemDirectoryHandle, 'Via Inesistente, 1');
    expect(vuoto).toMatchObject({ cartelle: 0, docx: 0 });
    expect(vuoto.letti).toBeUndefined();
  });
});
