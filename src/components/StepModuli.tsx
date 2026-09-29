import { useEffect, useState } from 'react';
import { condividi, fileDaBlob, isMobile, puoCondividere, scarica } from '../lib/condividi';
import { chiaveIndirizzo } from '../lib/stabiliAggiornati';
import { dividiIndirizzo } from '../lib/moduliVvf';
import { leggiRinnoviImportati, leggiAmministratore, leggiCartellaArchivio, leggiIndiceModuli, leggiTecnico, salvaAmministratore, salvaCartellaArchivio, salvaIndiceModuli } from '../lib/db';
import { cartellaSupportata, permessoScrittura, scegliCartella } from '../lib/archivio';
import { moduliCompletati, type DatiLetti } from '../lib/moduliEsistenti';
import { amministratoriDaIndice, cercaInIndice, costruisciIndice, datiDaArchivio } from '../lib/moduliInArchivio';
import { generaModulo, moduliPredefiniti, nomeFileModulo, VALORI_MODULO, type ModelloModulo } from '../lib/moduliVvf';
import { documentiPratica, praticaDi } from '../lib/pratiche';
import type { DatiModuli, Sopralluogo, Tecnico } from '../lib/types';
import { Campo } from './Campo';

interface Props {
  s: Sopralluogo;
  aggiorna: (f: (s: Sopralluogo) => Sopralluogo) => void;
}

/** Imposta un valore in un oggetto annidato ("titolare.cognome") senza modificare l'originale. */
function impostaPercorso<T>(o: T, percorso: string, valore: unknown): T {
  const [k, ...resto] = percorso.split('.');
  const corrente = (o as Record<string, unknown>)[k];
  return { ...o, [k]: resto.length ? impostaPercorso(corrente, resto.join('.'), valore) : valore } as T;
}

const MODULI_PER_TIPO: Record<'rinnovo' | 'scia', { id: ModelloModulo['id']; documento: string; testo: string }[]> = {
  rinnovo: [
    { id: 'pin3', documento: 'pin3', testo: 'MOD. PIN 3 – attestazione di rinnovo' },
    { id: 'pin31', documento: 'pin31', testo: 'MOD. PIN 3.1 – asseverazione' },
  ],
  scia: [
    { id: 'pin2', documento: 'pin2', testo: 'MOD. PIN 2 – SCIA' },
    { id: 'pin21', documento: 'pin21', testo: 'MOD. PIN 2.1 – asseverazione' },
  ],
};

/** Altri moduli VV.F. che possono servire, con i dati già noti (il resto si scrive a mano nel Word). */
const ALTRI_MODULI: { id: ModelloModulo['id']; testo: string }[] = [
  { id: 'pin1', testo: 'PIN 1 – valutazione progetto' },
  { id: 'pin7', testo: 'PIN 7 – voltura' },
  { id: 'pin22', testo: 'PIN 2.2 – certificazione REI' },
  { id: 'pin23', testo: 'PIN 2.3 – dichiarazione prodotto' },
  { id: 'pin24', testo: 'PIN 2.4 – dichiarazione impianto (installatore)' },
  { id: 'pin25', testo: 'PIN 2.5 – certificazione impianto' },
  { id: 'pin26', testo: 'PIN 2.6 – non aggravio rischio' },
];

/** Controlli sui dati prima di generare i moduli: cosa manca per non consegnare un modulo con riquadri vuoti. */
function daCompletare(s: Sopralluogo, m: DatiModuli, tecnico: Tecnico): string[] {
  const out: string[] = [];
  if (!praticaDi(s).nPraticaVvf.trim()) out.push('numero pratica VV.F. (passo Pratica)');
  if (!m.titolare.cognome.trim() || !m.titolare.nome.trim()) out.push('cognome e nome del titolare (amministratore)');
  if (m.titolare.codiceFiscale.replace(/\s/g, '').length !== 16) out.push('codice fiscale del titolare (16 caratteri)');
  if (!m.attivita.classe.trim()) out.push('attività (classe)');
  const p = tecnico.vvf;
  if (!p?.cognome.trim() || !p.codiceMI.trim()) out.push('dati del professionista (impostazioni del tecnico, schermata iniziale)');
  return out;
}

/** L'archivio si rilegge una volta per sessione all'apertura dei moduli (poi con il pulsante). */
let indiceAggiornatoInSessione = false;

export default function StepModuli({ s, aggiorna }: Props) {
  const p = praticaDi(s);
  const [tecnico, setTecnico] = useState<Tecnico | null>(null);
  const [generando, setGenerando] = useState<string | null>(null);
  const [esito, setEsito] = useState<string | null>(null);

  const [fonte, setFonte] = useState<string | null>(null);
  const [cartella, setCartella] = useState<FileSystemDirectoryHandle | undefined>();
  const [ricerca, setRicerca] = useState<string | null>(null);

  /** Completa i moduli: prima ciò che l'utente ha già scritto, poi il modulo dello stesso stabile, la rubrica dell'amministrazione, condominio e attività. */
  function applica(letti: DatiLetti | undefined, noto: DatiModuli['titolare'] | undefined) {
    aggiorna((x) => {
      const base = moduliCompletati(x.moduli, moduliPredefiniti(x), letti, noto);
      const pr = x.pratica;
      const conPratica = pr && !pr.nPraticaVvf && letti?.rifPratica && /^\d{4,}$/.test(letti.rifPratica) ? { pratica: { ...pr, nPraticaVvf: letti.rifPratica } } : {};
      return JSON.stringify(base) === JSON.stringify(x.moduli) && !Object.keys(conPratica).length ? x : { ...x, moduli: base, ...conPratica };
    });
  }

  /** Numero di pratica VV.F. (NOP) dall'elenco rinnovi, se la pratica non lo ha ancora. */
  async function nopDaElencoRinnovi() {
    if (praticaDi(s).nPraticaVvf.trim()) return;
    const r = await leggiRinnoviImportati().catch(() => undefined);
    const { indirizzo, civico } = dividiIndirizzo(s.condominio.indirizzo);
    const k = chiaveIndirizzo(indirizzo, civico);
    const nop = r?.righe.find((x) => x.nop && /^\d{3,}$/.test(x.nop) && chiaveIndirizzo(x.via, x.civico) === k)?.nop;
    if (nop) aggiorna((x) => (x.pratica && !x.pratica.nPraticaVvf ? { ...x, pratica: { ...x.pratica, nPraticaVvf: nop } } : x));
  }

  const rubricaDi = () => leggiAmministratore(s.condominio.pressoAmministrazione).catch(() => undefined);

  /** Rilegge l'archivio (solo i file cambiati), aggiorna l'indice condiviso col telefono e la rubrica, e compila. */
  async function aggiornaIndice(c: FileSystemDirectoryHandle) {
    const nuovo = await costruisciIndice(c, await leggiIndiceModuli().catch(() => undefined), setRicerca);
    await salvaIndiceModuli(nuovo);
    for (const a of amministratoriDaIndice(nuovo)) await salvaAmministratore(a.amministrazione, a.titolare, true).catch(() => {});
    const v = cercaInIndice(nuovo, s.condominio.indirizzo);
    if (v) {
      setFonte(v.file);
      setRicerca(`✓ Archivio letto (${Object.keys(nuovo.voci).length} stabili con moduli). Compilato dai dati di “${v.file}”.`);
    } else {
      const r = await datiDaArchivio(c, s.condominio.indirizzo).catch(() => undefined);
      setRicerca(
        `Archivio letto (${Object.keys(nuovo.voci).length} stabili con moduli). ` +
          (!r || !r.cartelle
            ? 'Per questo indirizzo non c’è ancora una cartella in archivio: uso la rubrica dell’amministrazione.'
            : r.altri
              ? `Per questo stabile ci sono ${r.altri} moduli solo in .doc o PDF: converti in .docx (vedi guida) per leggerli.`
              : 'Per questo stabile non c’è un MOD. PIN 2 o PIN 3 in .docx: uso la rubrica.'),
      );
    }
    applica(v?.letti, await rubricaDi());
  }

  // apertura: i dati si ricavano da soli. Subito dall'indice condiviso (funziona anche da telefono), poi, sul computer, rileggendo l'archivio.
  useEffect(() => {
    leggiTecnico().then(setTecnico).catch(() => {});
    (async () => {
      const idx = await leggiIndiceModuli().catch(() => undefined);
      const voce = cercaInIndice(idx, s.condominio.indirizzo);
      if (voce) setFonte(voce.file);
      applica(voce?.letti, await rubricaDi());
      await nopDaElencoRinnovi();
      const c = await leggiCartellaArchivio().catch(() => undefined);
      setCartella(c);
      if (!c) return;
      if (!(await permessoScrittura(c, false).catch(() => false))) {
        if (!voce) setRicerca('Concedi l’accesso alla cartella dell’archivio per compilare dai moduli già presenti.');
        return;
      }
      if (!indiceAggiornatoInSessione || !idx) {
        indiceAggiornatoInSessione = true;
        await aggiornaIndice(c).catch((e) => setRicerca(`Errore: ${(e as Error).message}`));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Scelta della cartella dell'archivio direttamente da qui (una volta sola): poi tutto si compila da solo. */
  async function scegliEcerca() {
    try {
      const c = await scegliCartella();
      await salvaCartellaArchivio(c);
      setCartella(c);
      indiceAggiornatoInSessione = true;
      await aggiornaIndice(c);
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setRicerca(`Errore: ${(e as Error).message}`);
    }
  }

  async function leggiDaArchivio() {
    if (!cartella) return;
    setRicerca('Cerco nell’archivio…');
    try {
      if (!(await permessoScrittura(cartella, true))) return setRicerca('Serve il permesso di accesso alla cartella dell’archivio.');
      indiceAggiornatoInSessione = true;
      await aggiornaIndice(cartella);
    } catch (e) {
      setRicerca(`Errore: ${(e as Error).message}`);
    }
  }

  const m = s.moduli;
  const moduli = p.tipo === 'rinnovo' ? MODULI_PER_TIPO.rinnovo : p.tipo === 'scia' ? MODULI_PER_TIPO.scia : [];
  const documenti = documentiPratica(s);
  const fatti = s.documenti ?? {};
  const mancanti = documenti.filter((d) => !fatti[d.chiave]).length;
  const imposta = (chiave: string, v: boolean) => aggiorna((x) => ({ ...x, documenti: { ...(x.documenti ?? {}), [chiave]: v } }));
  const set = (percorso: string, v: unknown) => aggiorna((x) => ({ ...x, moduli: impostaPercorso(x.moduli ?? moduliPredefiniti(x), percorso, v) }));
  const campo = (etichetta: string, percorso: string, opz: { inputMode?: 'numeric' | 'tel'; aiuto?: string } = {}) => {
    const valore = percorso.split('.').reduce<unknown>((o, k) => (o as Record<string, unknown>)?.[k], m) as string | undefined;
    return <Campo key={percorso} etichetta={etichetta} valore={valore ?? ''} onValore={(v) => set(percorso, v)} autoComplete="off" {...opz} />;
  };

  async function genera(id: ModelloModulo['id']) {
    if (!m || !tecnico) return;
    setGenerando(id);
    setEsito(null);
    try {
      const valori = VALORI_MODULO[id](s, m, tecnico);
      const blob = await generaModulo(id, valori);
      const file = fileDaBlob(blob, nomeFileModulo(id, s));
      await salvaAmministratore(s.condominio.pressoAmministrazione, m.titolare).catch(() => {});
      if (isMobile() && puoCondividere(file)) await condividi(file, file.name).catch(() => scarica(file, file.name));
      else scarica(file, file.name);
      setEsito(`✓ ${file.name}`);
    } catch (e) {
      setEsito(`Errore: ${(e as Error).message}`);
    } finally {
      setGenerando(null);
    }
  }

  const mancano = m && tecnico ? daCompletare(s, m, tecnico) : [];
  const gruppo = (origine: 'studio' | 'esterno', titolo: string) => {
    const righe = documenti.filter((d) => d.origine === origine);
    if (!righe.length) return null;
    return (
      <>
        <h3 className="titolo-sezione">{titolo}</h3>
        <div className="card">
          {righe.map((d) => (
            <label key={d.chiave} className="riga-check">
              <input type="checkbox" checked={!!fatti[d.chiave]} onChange={(e) => imposta(d.chiave, e.target.checked)} />
              <span>{d.testo}</span>
            </label>
          ))}
        </div>
      </>
    );
  };

  return (
    <section>
      <h2 className="titolo-passo">Moduli e documenti {p.tipo === 'scia' ? 'della SCIA' : 'del rinnovo'}</h2>

      {moduli.length > 0 && m && (
        <>
          <h3 className="titolo-sezione">Moduli VV.F. da compilare</h3>
          <p className="muto piccolo">
            I dati si compilano da soli da condominio, attività, rubrica dell’amministrazione
            {fonte ? <> e dal modulo già in archivio (<em>{fonte}</em>)</> : ' e, sul computer con la cartella archivio scelta, dai moduli già compilati'}. Controllali e correggi se serve.
            Titolare e codice fiscale vengono dai moduli PIN 2/3 dell’archivio: senza la cartella scelta restano da scrivere una volta per amministrazione.
          </p>
          {cartella ? (
            <div className="riga-pulsanti">
              <button className="btn" onClick={leggiDaArchivio}>
                Leggi dai moduli dell’archivio
              </button>
            </div>
          ) : (
            cartellaSupportata() && (
              <div className="riga-pulsanti">
                <button className="btn btn-primario" onClick={scegliEcerca}>
                  Scegli la cartella dell’archivio per compilare da solo
                </button>
              </div>
            )
          )}
          {ricerca && <p className="promemoria">{ricerca}</p>}
          <details className="card" open>
            <summary>Titolare (amministratore)</summary>
            <div className="griglia-2">
              {campo('Cognome', 'titolare.cognome')}
              {campo('Nome', 'titolare.nome')}
            </div>
            {campo('Codice fiscale', 'titolare.codiceFiscale')}
            {campo('In qualità di', 'titolare.qualifica')}
            <div className="griglia-2">
              {campo('Via / piazza', 'titolare.indirizzo')}
              {campo('N. civico', 'titolare.civico')}
              {campo('CAP', 'titolare.cap', { inputMode: 'numeric' })}
              {campo('Comune', 'titolare.comune')}
              {campo('Provincia', 'titolare.provincia')}
              {campo('Telefono', 'titolare.telefono', { inputMode: 'tel' })}
              {campo('Email', 'titolare.email')}
              {campo('PEC', 'titolare.pec')}
            </div>
            <p className="muto piccolo">Il titolare si ricorda per questa amministrazione: la prossima volta si precompila.</p>
          </details>
          <details className="card">
            <summary>Condominio e attività</summary>
            {campo('Ragione sociale (della)', 'ragione')}
            <div className="griglia-2">
              {campo('Sede: via', 'sede.indirizzo')}
              {campo('N. civico', 'sede.civico')}
              {campo('CAP', 'sede.cap', { inputMode: 'numeric' })}
              {campo('Comune', 'sede.comune')}
              {campo('Provincia', 'sede.provincia')}
              {campo('Telefono', 'sede.telefono', { inputMode: 'tel' })}
            </div>
            {campo('Tipo di attività', 'attivita.tipo', { aiuto: 'es. AUTORIMESSA, CENTRALE TERMICA, EDIFICIO DI CIVILE ABITAZIONE' })}
            <div className="griglia-2">
              {campo('Classe (n./sottoclasse/cat.)', 'attivita.classe')}
              {campo('Altre attività', 'attivita.altre')}
              {campo('Attività sita in: via', 'attivita.indirizzo')}
              {campo('N. civico', 'attivita.civico')}
              {campo('CAP', 'attivita.cap', { inputMode: 'numeric' })}
              {campo('Comune', 'attivita.comune')}
              {campo('Provincia', 'attivita.provincia')}
              {campo('Telefono', 'attivita.telefono', { inputMode: 'tel' })}
            </div>
            {campo('Comando VV.F. di', 'comando')}
          </details>
          <details className="card">
            <summary>{p.tipo === 'rinnovo' ? 'Rinnovo: SCIA precedente e versamento' : 'Versamento'}</summary>
            {p.tipo === 'rinnovo' && (
              <>
                {campo('SCIA / rinnovo precedente', 'sciaPrecedente', { aiuto: 'es. RINNOVO CPI DEL 28/04/2021' })}
                <label className="riga-check">
                  <input type="checkbox" checked={m.allegaAsseverazione} onChange={(e) => set('allegaAsseverazione', e.target.checked)} />
                  <span>Allega l’asseverazione (MOD. PIN 3.1)</span>
                </label>
              </>
            )}
            {campo('Totale versamento (€)', 'versamentoTotale')}
            {m.versamento.map((_, i) => (
              <div key={i} className="griglia-2">
                {campo(`Attività ${i + 1}: n.`, `versamento.${i}.n`)}
                {campo('Sottoclasse', `versamento.${i}.sotto`)}
                {campo('Importo €', `versamento.${i}.importo`)}
              </div>
            ))}
          </details>
          <details className="card">
            <summary>Firma{p.tipo === 'scia' ? ' e asseverazione (MOD. PIN 2.1)' : ''}</summary>
            <Campo etichetta="Data di firma (se vuota, si scrive a mano)" type="date" valore={m.dataFirma ?? ''} onValore={(v) => set('dataFirma', v)} />
            {p.tipo === 'scia' && (
              <>
                <label className="campo">
                  <span className="campo-etichetta">Intervento</span>
                  <select value={m.intervento ?? ''} onChange={(e) => set('intervento', e.target.value)}>
                    <option value="">Da indicare a mano</option>
                    <option value="nuovo">Nuovo insediamento</option>
                    <option value="modifica">Modifica di attività esistente</option>
                  </select>
                </label>
                <label className="riga-check">
                  <input type="checkbox" checked={!!m.progettoApprovato?.attivo} onChange={(e) => set('progettoApprovato', { data: '', protocollo: '', ...m.progettoApprovato, attivo: e.target.checked })} />
                  <span>Progetto approvato dal Comando VV.F. (solo attività di categoria B e C)</span>
                </label>
                {m.progettoApprovato?.attivo && (
                  <div className="griglia-2">
                    <Campo etichetta="In data" type="date" valore={m.progettoApprovato.data} onValore={(v) => set('progettoApprovato.data', v)} />
                    {campo('Prot. n.', 'progettoApprovato.protocollo')}
                  </div>
                )}
              </>
            )}
          </details>
          {p.tipo === 'rinnovo' && (
          <details className="card">
            <summary>Asseverazione (MOD. PIN 3.1)</summary>
            {campo('SCIA a firma di', 'sciaFirma')}
            <Campo etichetta="Data del sopralluogo" type="date" valore={m.dataSopralluogo} onValore={(v) => set('dataSopralluogo', v)} />
            {m.impianti.map((imp, i) => (
              <div key={i}>
                <label className="riga-check">
                  <input type="checkbox" checked={imp.attivo} onChange={(e) => set(`impianti.${i}.attivo`, e.target.checked)} />
                  <span>{['Estinzione o controllo incendi', 'Controllo del fumo e del calore', 'Rivelazione di fumo, calore, gas, incendio', 'Segnalazione e allarme incendio', 'Altro'][i]}</span>
                </label>
                {imp.attivo && campo('Tipologia', `impianti.${i}.testo`)}
              </div>
            ))}
          </details>
          )}

          {mancano.length > 0 && (
            <p className="promemoria">
              Da completare: {mancano.join('; ')}. I riquadri vuoti restano vuoti nel modulo.
            </p>
          )}
          <div className="riga-pulsanti">
            {moduli.map((mod) => (
              <button key={mod.id} className="btn btn-primario" onClick={() => genera(mod.id)} disabled={!!generando || !tecnico}>
                {generando === mod.id ? 'Genero…' : mod.testo}
              </button>
            ))}
          </div>
          <details className="card">
            <summary>Altri moduli VV.F.</summary>
            <p className="muto piccolo">Si compilano i dati anagrafici e dell’attività; le parti tecniche e le firme restano da fare nel Word.</p>
            <div className="riga-pulsanti">
              {ALTRI_MODULI.map((mod) => (
                <button key={mod.id} className="btn" onClick={() => genera(mod.id)} disabled={!!generando || !tecnico}>
                  {generando === mod.id ? 'Genero…' : mod.testo}
                </button>
              ))}
            </div>
          </details>
          {esito && <p className="promemoria">{esito}</p>}
          <p className="muto piccolo">Il Word è il modulo ufficiale compilato: controllalo, firmalo e convertilo in PDF come fai oggi.</p>
        </>
      )}

      <h3 className="titolo-sezione">Documenti</h3>
      <p className="muto piccolo">
        {mancanti === 0 ? '✓ Tutti i documenti sono pronti: puoi presentare la pratica e passarla a “presentata”.' : `Mancano ${mancanti} documenti su ${documenti.length}.`}
      </p>
      {gruppo('studio', 'Preparati dallo studio')}
      {gruppo('esterno', 'Da ricevere (certificazioni, bollettino, documenti)')}
    </section>
  );
}
