// Passi del wizard per tipo di pratica. Il passo "Idranti" (prova di pressione e portata) compare solo se c'è
// un'attività 75 (autorimesse) o 77 (edifici civili), o se la prova è già stata inserita.
import { praticaDi } from './pratiche';
import type { Sopralluogo, TipoPratica } from './types';

export type IdPasso = 'attivita' | 'condominio' | 'voci' | 'idranti' | 'riepilogo' | 'pratica' | 'moduli';

const PASSI_TIPO: Record<TipoPratica, IdPasso[]> = {
  roa: ['attivita', 'condominio', 'voci', 'idranti', 'riepilogo'],
  rinnovo: ['attivita', 'condominio', 'pratica', 'idranti', 'moduli'],
  scia: ['attivita', 'condominio', 'pratica', 'moduli'],
};

/** Attività con una rete idranti: 75 (autorimesse) e 77 (edifici di civile abitazione). */
export const haIdranti = (s: Pick<Sopralluogo, 'attivita'>) => s.attivita.some((a) => /^(75|77)\b/.test(a.codice.trim()));

export function passiWizard(s: Sopralluogo): IdPasso[] {
  const passi = PASSI_TIPO[praticaDi(s).tipo];
  return haIdranti(s) || s.provaIdranti?.attiva ? passi : passi.filter((p) => p !== 'idranti');
}
