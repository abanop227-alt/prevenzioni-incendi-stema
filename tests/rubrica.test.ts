import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { leggiAmministratore, salvaAmministratore } from '../src/lib/db';

const titolare = (cognome: string) => ({ cognome, nome: 'M', codiceFiscale: '', qualifica: '', email: '', pec: '' }) as never;

describe('rubrica degli amministratori', () => {
  it('si ritrova sia dal nome della cartella dell’archivio sia da “Amministrazione …”', async () => {
    await salvaAmministratore('BARBATI ERMINIO (STUDIO C.S.E.)', titolare('BIANCHI'), true);
    expect((await leggiAmministratore('Amministrazione Barbati'))?.cognome).toBe('BIANCHI');
    expect((await leggiAmministratore('BARBATI'))?.cognome).toBe('BIANCHI');
  });

  it('l’importazione dall’archivio non sostituisce un titolare già ricordato, l’uso nell’app sì', async () => {
    await salvaAmministratore('PASQUALI', titolare('ROSSI'));
    await salvaAmministratore('PASQUALI', titolare('NERI'), true); // da archivio: resta ROSSI
    expect((await leggiAmministratore('Amministrazione PASQUALI'))?.cognome).toBe('ROSSI');
    await salvaAmministratore('Amministrazione PASQUALI', titolare('VERDI')); // scelta dell'utente: sostituisce
    expect((await leggiAmministratore('PASQUALI'))?.cognome).toBe('VERDI');
  });
});
