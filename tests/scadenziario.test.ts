import { describe, expect, it } from 'vitest';
import { conStato } from '../src/lib/pratiche';
import { nellaFascia, scadenziario } from '../src/lib/scadenziario';
import type { Stabile } from '../src/lib/stabili';
import { sopralluogoCon } from './aiuti';

const stabile = (via: string, civico: string, scadenza: string, amministrazione = 'PASQUALI'): Stabile =>
  ({ id: `${via}${civico}`, nome: via, tipoVia: 'VIA', via, civico, cap: '', comune: '', contatto: '', telefono: '', nop: '', kw: '', attivita: ['74.1.A'], progetto: '', scadenza, codiceFiscale: '', note: '', amministrazione, origine: 'x.xlsx' }) as Stabile;

describe('scadenziario dei rinnovi', () => {
  const oggi = '2026-09-29';

  it('ordina per scadenza e distingue anno solo e data precisa', () => {
    const v = scadenziario([stabile('LINATI', '8', '2030'), stabile('EUROPA', '5', '2026-03-01'), stabile('AOSTA', '1', '2026'), stabile('NAGO', '2', 'n.d.')], [], oggi);
    expect(v.map((x) => x.indirizzo.split(',')[0].replace('Via ', ''))).toEqual(['Europa', 'Aosta', 'Linati']);
    expect(v[0]).toMatchObject({ precisa: true, giorni: -212, fonte: 'elenco' });
    expect(v[1]).toMatchObject({ precisa: false, giorni: 93 }); // l'anno vale fino al 31 dicembre
  });

  it('il rinnovo presentato con l’app prevale sull’elenco e calcola la scadenza dalle attività', () => {
    const s = sopralluogoCon(['77.1.A', '74.1.A']);
    Object.assign(s.condominio, { indirizzo: 'Via Linati, 8', pressoAmministrazione: 'Amministrazione PASQUALI' });
    s.pratica = { tipo: 'rinnovo', stato: 'presentata', referente: '', origineId: null, dataStato: '2026-05-26', dataPresentazione: '2026-05-26', protocolloPec: '', nPraticaVvf: '' };
    const v = scadenziario([stabile('LINATI', '8', '2027')], [s], oggi);
    expect(v).toHaveLength(1);
    expect(v[0]).toMatchObject({ fonte: 'pratica', scadenza: '2031-05-26', precisa: true, amministrazione: 'PASQUALI' }); // 77 e 74 non indipendenti: termine minore (5 anni)
  });

  it('ignora rinnovi non ancora presentati e altri tipi di pratica', () => {
    const roa = conStato(sopralluogoCon(['74.1.A']), 'emessa', '2026-03-01');
    const bozza = sopralluogoCon(['74.1.A']);
    bozza.pratica = { tipo: 'rinnovo', stato: 'bozza', referente: '', origineId: null, dataStato: '2026-05-26', dataPresentazione: '', protocolloPec: '', nPraticaVvf: '' };
    expect(scadenziario([], [roa, bozza], oggi)).toEqual([]);
  });

  it('fasce: prossimi 3 mesi dentro i 12', () => {
    expect(nellaFascia({ giorni: -1 }, 'scadute')).toBe(true);
    expect(nellaFascia({ giorni: 30 }, 'entro3')).toBe(true);
    expect(nellaFascia({ giorni: 30 }, 'entro12')).toBe(true);
    expect(nellaFascia({ giorni: 200 }, 'entro3')).toBe(false);
    expect(nellaFascia({ giorni: 400 }, 'oltre')).toBe(true);
    expect(nellaFascia({ giorni: -5 }, 'entro12')).toBe(false);
  });
});

describe('unisciAmministrazioni', () => {
  it('unisce i nomi scritti in modi diversi', async () => {
    const { unisciAmministrazioni } = await import('../src/lib/scadenziario');
    const v = (amministrazione: string) => ({ indirizzo: 'x', amministrazione, attivita: '', scadenza: '2027-01-01', precisa: true, fonte: 'elenco' as const, giorni: 1 });
    const r = unisciAmministrazioni([v('AMMINISTRAZIONE PASQUALI'), v('PASQUALI'), v('Pasquali S.r.l.'), v('ROSSI')]);
    expect(r.map((x) => x.amministrazione)).toEqual(['PASQUALI', 'PASQUALI', 'PASQUALI', 'ROSSI']);
  });
});
