import { useEffect, useState } from 'react';
import { scarica } from '../lib/condividi';
import { elencaSopralluoghi, elencaStabili } from '../lib/db';
import { FASCE, nellaFascia, scadenziario, type Fascia, type VoceScadenza } from '../lib/scadenziario';
import { creaXlsx } from '../lib/xlsxScrittura';
import { dataItaliana } from '../lib/util';

const testoScadenza = (v: VoceScadenza) => (v.precisa ? dataItaliana(v.scadenza) : `anno ${v.scadenza}`);

function frase(v: VoceScadenza): string {
  if (!v.precisa && v.giorni >= 0) return 'entro il ' + v.scadenza;
  if (v.giorni < 0) return `scaduta da ${Math.abs(v.giorni)} giorni`;
  if (v.giorni === 0) return 'scade oggi';
  return `tra ${v.giorni} giorni`;
}

/** Prossime scadenze dei rinnovi periodici, dagli elenchi stabili e dai rinnovi presentati con l'app. */
export default function Scadenziario() {
  const [voci, setVoci] = useState<VoceScadenza[] | null>(null);
  const [amm, setAmm] = useState('');
  const [fascia, setFascia] = useState<Fascia | ''>('entro12');

  useEffect(() => {
    Promise.all([elencaStabili(), elencaSopralluoghi()])
      .then(([st, so]) => setVoci(scadenziario(st, so)))
      .catch(() => setVoci([]));
  }, []);

  const amministrazioni = [...new Set((voci ?? []).map((v) => v.amministrazione).filter(Boolean))].sort();
  const dellAmm = (voci ?? []).filter((v) => !amm || v.amministrazione === amm);
  const mostrate = dellAmm.filter((v) => !fascia || nellaFascia(v, fascia));
  const conteggio = (f: Fascia) => dellAmm.filter((v) => nellaFascia(v, f)).length;

  async function esportaExcel() {
    const righe = dellAmm;
    const blob = await creaXlsx([
      {
        nome: 'Scadenze',
        titoli: [0],
        intestazioni: [1],
        larghezze: [16, 34, 20, 14, 14, 14],
        righe: [
          ['Scadenziario rinnovi periodici'],
          ['AMMINISTRAZIONE', 'INDIRIZZO', 'ATTIVITÀ', 'SCADENZA', 'STATO', 'FONTE'],
          ...righe.map((v) => [v.amministrazione, v.indirizzo, v.attivita, testoScadenza(v), frase(v), v.fonte === 'pratica' ? 'pratica dell’app' : 'elenco stabili']),
        ],
      },
    ]);
    scarica(blob, `SCADENZIARIO ${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  return (
    <>
      <h2 className="titolo-sezione">Scadenziario rinnovi</h2>
      <p className="muto piccolo">
        Le scadenze arrivano dagli elenchi stabili importati e dai rinnovi presentati con l’app (la pratica dell’app prevale sull’elenco). Se nell’elenco c’è
        solo l’anno, la scadenza vale fino al 31 dicembre.
      </p>
      {voci === null ? (
        <p className="muto">Carico…</p>
      ) : voci.length === 0 ? (
        <p className="muto">Nessuna scadenza: importa gli elenchi “Stabili …” con la colonna SCADENZA, oppure presenta un rinnovo dall’app.</p>
      ) : (
        <div className="card">
          <div className="griglia-2">
            <label className="campo">
              <span className="campo-etichetta">Amministrazione</span>
              <select value={amm} onChange={(e) => setAmm(e.target.value)}>
                <option value="">Tutte</option>
                {amministrazioni.map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
            </label>
            <label className="campo">
              <span className="campo-etichetta">Periodo</span>
              <select value={fascia} onChange={(e) => setFascia(e.target.value as Fascia | '')}>
                <option value="">Tutte</option>
                {FASCE.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.titolo} ({conteggio(f.id)})
                  </option>
                ))}
              </select>
            </label>
          </div>
          <ul className="lista-file">
            {mostrate.slice(0, 200).map((v) => (
              <li key={`${v.indirizzo}|${v.scadenza}`}>
                <span>
                  <strong>{v.indirizzo}</strong> <span className="muto">({v.amministrazione || 'senza amministrazione'})</span>
                  <br />
                  <span className="piccolo">
                    {v.attivita || 'attività non indicata'} · {testoScadenza(v)} · <span className={v.giorni < 0 ? 'errore' : ''}>{frase(v)}</span>
                    {v.fonte === 'pratica' ? ' · da pratica' : ''}
                  </span>
                </span>
              </li>
            ))}
          </ul>
          {mostrate.length > 200 && <p className="muto piccolo">Mostrate le prime 200 di {mostrate.length}: filtra per amministrazione o scarica l’Excel.</p>}
          {mostrate.length === 0 && <p className="muto piccolo">Nessuna scadenza in questo periodo.</p>}
          <div className="riga-pulsanti">
            <button className="btn" onClick={esportaExcel}>
              Scarica Excel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
