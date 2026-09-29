import { describe, expect, it } from 'vitest';
import { chiaveDaCartella, èModuloPrincipale } from '../src/lib/moduliInArchivio';
import { chiaveIndirizzo } from '../src/lib/stabiliAggiornati';

describe('ricerca dei moduli nell’archivio', () => {
  it('riconosce solo i moduli principali PIN 2 e PIN 3', () => {
    for (const ok of ['01_Via Aosta, 21_MOD. PIN 3 - 2023_RINNOVO PERIODICO.docx', 'MOD. PIN 2 - 2023_SCIA.docx', 'PIN_2_2023_SCIA_FV.docx', 'PIN 3 rinnovo (1).docx']) expect(èModuloPrincipale(ok), ok).toBe(true);
    for (const no of ['02_Via Aosta_MOD. PIN 3.1 - 2014_ASSEVERAZIONE PER RINNOVO.docx', 'MOD. PIN 2.1 - 2018_ASSEVERAZIONE.docx', 'PIN_2_2_2023_CERT_REI.docx', 'MOD. PIN 3.docx.pdf', '~$MOD. PIN 3.docx', 'PIN 3.doc']) expect(èModuloPrincipale(no), no).toBe(false);
  });

  it('la cartella pratica "VIA NAGO 22_ROA" corrisponde allo stabile Via Nago, 22', () => {
    expect(chiaveDaCartella('VIA NAGO 22_ROA')).toBe(chiaveIndirizzo('Via Nago', '22'));
    expect(chiaveDaCartella('VIALE CONI ZUGNA 21A_RINNOVO')).toBe(chiaveIndirizzo('Viale Coni Zugna', '21A'));
  });
});
