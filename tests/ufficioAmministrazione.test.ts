import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { famigliaDi } from '../src/lib/catalogo';
import { leggiAmministratore, leggiRubricaAmministratori, leggiUfficioAmministrazione, salvaAmministratore, salvaUfficioAmministrazione } from '../src/lib/db';
import { cat } from './aiuti';

const titolare = (campi: Record<string, string> = {}) => ({
  cognome: 'PASQUALI', nome: 'ALBERTO', indirizzo: 'VIA EMANUELE FILIBERTO', civico: '6', cap: '20149', comune: 'MILANO', provincia: 'MI', telefono: '02/347514',
  codiceFiscale: '', qualifica: 'AMMINISTRATORE PRO TEMPORE', email: '', pec: '', ...campi,
});

describe('dati di studio dell’amministrazione', () => {
  it('senza nulla ricordato non c’è niente da proporre', async () => {
    expect(await leggiUfficioAmministrazione('Amministrazione NESSUNO')).toBeUndefined();
  });

  it('si ricordano alla compilazione e si ritrovano con il nome breve o intero dell’amministrazione', async () => {
    await salvaUfficioAmministrazione('PASQUALI', { presso: 'Amministrazione Stabili Pasquali Alberto', indirizzo: 'Via Emanuele Filiberto, 6 – 20149 Milano', telefono: '02/347514' });
    for (const nome of ['PASQUALI', 'Amministrazione PASQUALI', 'Amministrazione stabili Pasquali']) {
      expect(await leggiUfficioAmministrazione(nome), nome).toMatchObject({ telefono: '02/347514', presso: 'Amministrazione Stabili Pasquali Alberto' });
    }
  });

  it('il titolare letto dall’archivio non viene bloccato dai dati di studio già ricordati, e li conserva', async () => {
    await salvaAmministratore('PASQUALI', titolare(), true); // import dall'archivio: prima c'erano solo i dati di studio
    const t = await leggiAmministratore('PASQUALI');
    expect(t?.cognome).toBe('PASQUALI');
    expect(t).not.toHaveProperty('ufficio'); // i moduli non ricevono il campo in più
    expect((await leggiUfficioAmministrazione('PASQUALI'))?.telefono).toBe('02/347514');
    // un secondo import "solo se mancante" non sostituisce il titolare
    await salvaAmministratore('PASQUALI', titolare({ cognome: 'ALTRO' }), true);
    expect((await leggiAmministratore('PASQUALI'))?.cognome).toBe('PASQUALI');
  });

  it('in mancanza di dati ricordati usa indirizzo e telefono del titolare letto dai moduli', async () => {
    await salvaAmministratore('Studio CERUTI', titolare({ cognome: 'CERUTI', indirizzo: 'VIA STRAMBIO GAETANO', civico: '34', cap: '20133', telefono: '02/70124253' }));
    expect(await leggiUfficioAmministrazione('CERUTI')).toEqual({ presso: '', indirizzo: 'Via Strambio Gaetano, 34 – 20133 Milano', telefono: '02/70124253' });
    expect(Object.keys(await leggiRubricaAmministratori())).toContain('alias:ceruti');
  });
});

describe('attività dell’elenco', () => {
  it('ci sono 74.3.C, 77.2.B e 77.3.C, con le frasi della loro famiglia', () => {
    const codici = cat.attivita.map((a) => a.codice);
    for (const c of ['74.1.A', '74.2.B', '74.3.C', '75.1.A', '75.2.B', '75.4.C', '77.1.A', '77.2.B', '77.3.C']) expect(codici, c).toContain(c);
    expect(famigliaDi(cat, '74.3.C')?.id).toBe('74');
    expect(famigliaDi(cat, '77.2.B')?.id).toBe('77');
    expect(famigliaDi(cat, '77.3.C')?.id).toBe('77');
    expect(cat.attivita.find((a) => a.codice === '77.3.C')?.descrizione).toMatch(/superiore a 54 m/);
  });
});
