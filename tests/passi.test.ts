import { describe, expect, it } from 'vitest';
import { nuovaProvaIdranti } from '../src/lib/idranti';
import { haIdranti, passiWizard } from '../src/lib/passi';
import { sopralluogoCon } from './aiuti';

describe('passo Idranti del wizard', () => {
  it('compare solo con le attività 75 e 77', () => {
    expect(haIdranti(sopralluogoCon(['74.1.A']))).toBe(false);
    expect(haIdranti(sopralluogoCon(['75.2.B']))).toBe(true);
    expect(haIdranti(sopralluogoCon(['77.2.B']))).toBe(true);
    expect(haIdranti(sopralluogoCon(['74.3.C', '77.3.C']))).toBe(true);
    expect(haIdranti(sopralluogoCon([]))).toBe(false);
  });

  it('ROA: senza 75/77 il passo non c’è; con 75 o 77 sì', () => {
    expect(passiWizard(sopralluogoCon(['74.1.A']))).toEqual(['attivita', 'condominio', 'voci', 'riepilogo']);
    expect(passiWizard(sopralluogoCon(['74.2.B', '75.1.A']))).toEqual(['attivita', 'condominio', 'voci', 'idranti', 'riepilogo']);
    expect(passiWizard(sopralluogoCon(['77.1.A']))).toContain('idranti');
  });

  it('rinnovo: stessa regola; la SCIA non ha il passo', () => {
    const r = sopralluogoCon(['74.1.A']);
    r.pratica = { tipo: 'rinnovo' } as never;
    expect(passiWizard(r)).toEqual(['attivita', 'condominio', 'pratica', 'moduli']);
    const r77 = sopralluogoCon(['77.1.A']);
    r77.pratica = { tipo: 'rinnovo' } as never;
    expect(passiWizard(r77)).toEqual(['attivita', 'condominio', 'pratica', 'idranti', 'moduli']);
    const scia = sopralluogoCon(['75.1.A']);
    scia.pratica = { tipo: 'scia' } as never;
    expect(passiWizard(scia)).not.toContain('idranti');
  });

  it('una prova già inserita resta raggiungibile anche senza 75/77', () => {
    const s = sopralluogoCon(['74.1.A']);
    s.provaIdranti = nuovaProvaIdranti('74.1.A');
    expect(passiWizard(s)).toContain('idranti');
  });
});
