import { useEffect } from 'react';
import type { StatoAutoSync } from './autosync';

/** Richiama `ricarica` quando la sincronizzazione riceve dati da un altro dispositivo (stabili, elenco lavori, rubrica). */
export function useDatiSincronizzati(ricarica: () => void): void {
  useEffect(() => {
    const gestore = (e: Event) => {
      const s = (e as CustomEvent<StatoAutoSync>).detail;
      if (s?.stato === 'ok' && (s.esito.datiRicevuti > 0 || s.esito.ricevuti > 0)) ricarica();
    };
    window.addEventListener('roa-sync', gestore);
    return () => window.removeEventListener('roa-sync', gestore);
  }, [ricarica]);
}
