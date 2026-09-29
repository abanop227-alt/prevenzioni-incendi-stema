// Compilazione dei moduli VV.F. (MOD. PIN) a partire dai modelli in public/moduli/*.docx.
// I modelli si costruiscono dai moduli ufficiali vuoti con scripts/moduli/costruisci_moduli.py: i riquadri da
// compilare contengono {{chiave}}; le caselle di controllo hanno w:val="{{chiave}}" (1/0).
import JSZip from 'jszip';
import type { DatiModuli, IndirizzoModulo, ProfessionistaVvf, Sopralluogo, Tecnico } from './types';
import { dataItaliana } from './util';

export type Valori = Record<string, string | boolean>;

export interface ModelloModulo {
  id: 'pin3' | 'pin31' | 'pin2' | 'pin21' | 'pin1' | 'pin7' | 'pin22' | 'pin23' | 'pin25' | 'pin26';
  file: string;
  /** nome del file generato, senza estensione */
  nome: string;
}

export const MODELLI: Record<ModelloModulo['id'], ModelloModulo> = {
  pin3: { id: 'pin3', file: 'pin3-rinnovo.docx', nome: 'MOD. PIN 3 - 2023_RINNOVO PERIODICO' },
  pin31: { id: 'pin31', file: 'pin31-asseverazione-rinnovo.docx', nome: 'MOD. PIN 3.1 - 2014_ASSEVERAZIONE PER RINNOVO' },
  pin2: { id: 'pin2', file: 'pin2-scia.docx', nome: 'MOD. PIN 2 - 2023_SCIA' },
  pin21: { id: 'pin21', file: 'pin21-asseverazione-scia.docx', nome: 'MOD. PIN 2.1 - 2018_ASSEVERAZIONE' },
  pin1: { id: 'pin1', file: 'pin1-valutazione-progetto.docx', nome: 'MOD. PIN 1 - 2023_VALUTAZIONE PROGETTO' },
  pin7: { id: 'pin7', file: 'pin7-voltura.docx', nome: 'MOD. PIN 7 - 2018_VOLTURA' },
  pin22: { id: 'pin22', file: 'pin22-cert-rei.docx', nome: 'MOD. PIN 2.2 - 2023_CERT REI' },
  pin23: { id: 'pin23', file: 'pin23-dichiarazione-prodotto.docx', nome: 'MOD. PIN 2.3 - 2018_DICHIARAZIONE PRODOTTO' },
  pin25: { id: 'pin25', file: 'pin25-certificazione-impianto.docx', nome: 'MOD. PIN 2.5 - 2018_CERTIFICAZIONE IMPIANTO' },
  pin26: { id: 'pin26', file: 'pin26-non-aggravio-rischio.docx', nome: 'MOD. PIN 2.6 - 2018_NON AGGRAVIO RISCHIO' },
};

const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Riempie i segnaposto del modello: quelli senza valore restano vuoti (le caselle non spuntate). */
export async function compilaModello(modello: ArrayBuffer | Uint8Array, valori: Valori): Promise<Blob> {
  const zip = await JSZip.loadAsync(modello);
  const file = zip.file('word/document.xml');
  if (!file) throw new Error('Il modello non è un documento Word valido.');
  let xml = await file.async('string');
  // caselle: w:val="{{chiave}}" → 1 / 0
  xml = xml.replace(/w:val="\{\{(\w+)\}\}"/g, (_, k: string) => `w:val="${valori[k] === true || valori[k] === '1' ? '1' : '0'}"`);
  xml = xml.replace(/\{\{(\w+)\}\}/g, (_, k: string) => {
    const v = valori[k];
    return typeof v === 'string' ? esc(v) : '';
  });
  zip.file('word/document.xml', xml);
  return zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
}

/** Scarica il modello dall'app (in cache per l'uso offline) e lo compila. */
export async function generaModulo(id: ModelloModulo['id'], valori: Valori, carica?: (file: string) => Promise<ArrayBuffer>): Promise<Blob> {
  const m = MODELLI[id];
  const dati = carica
    ? await carica(m.file)
    : await fetch(`${import.meta.env.BASE_URL}moduli/${m.file}`).then((r) => {
        if (!r.ok) throw new Error(`Modello ${m.file} non disponibile.`);
        return r.arrayBuffer();
      });
  return compilaModello(dati, valori);
}

// ---------------- dati predefiniti ----------------

const vuotoIndirizzo = (): IndirizzoModulo => ({ indirizzo: '', civico: '', cap: '', comune: '', provincia: '', telefono: '' });

/** "Via Aosta, 21" → { indirizzo: "VIA AOSTA", civico: "21" } */
export function dividiIndirizzo(testo: string): { indirizzo: string; civico: string } {
  const t = testo.trim();
  const m = /^(.*?)[,\s]+(\d+[\w/\-.]*)$/.exec(t);
  return m ? { indirizzo: m[1].trim().toUpperCase(), civico: m[2] } : { indirizzo: t.toUpperCase(), civico: '' };
}

const TIPO_ATTIVITA: Record<string, string> = { '74': 'CENTRALE TERMICA', '75': 'AUTORIMESSA', '77': 'EDIFICIO DI CIVILE ABITAZIONE' };

export const NUMERO_INDIRIZZI_VERSAMENTO = 8;

/** Dati iniziali dei moduli, ricavati da condominio e attività; il resto lo scrive l'utente. */
export function moduliPredefiniti(s: Sopralluogo): DatiModuli {
  const c = s.condominio;
  const imm = dividiIndirizzo(c.indirizzo);
  const amm = dividiIndirizzo(c.indirizzoAmministrazione);
  const codici = s.attivita.map((a) => a.codice);
  const prima = codici[0] ?? '';
  const numero = prima.split('.')[0];
  const cf = c.codiceFiscale.trim();
  return {
    comando: 'MILANO',
    titolare: {
      cognome: '',
      nome: '',
      indirizzo: amm.indirizzo,
      civico: amm.civico,
      cap: '',
      comune: '',
      provincia: 'MI',
      telefono: c.telefono,
      codiceFiscale: '',
      qualifica: 'AMMINISTRATORE PRO TEMPORE',
      email: '',
      pec: '',
    },
    ragione: `CONDOMINIO ${[c.nome.trim(), c.indirizzo.trim()].filter(Boolean).join(' – ')}${cf ? ` – C.F: ${cf}` : ''}`.trim(),
    sede: { indirizzo: imm.indirizzo, civico: imm.civico, cap: c.cap, comune: c.comune.toUpperCase(), provincia: 'MI', telefono: c.telefono },
    attivita: {
      ...vuotoIndirizzo(),
      indirizzo: imm.indirizzo,
      civico: imm.civico,
      cap: c.cap,
      comune: c.comune.toUpperCase(),
      provincia: 'MI',
      telefono: c.telefono,
      tipo: TIPO_ATTIVITA[numero] ?? '',
      classe: prima,
      altre: codici.slice(1).join(' – '),
    },
    sciaPrecedente: '',
    sciaFirma: '',
    dataSopralluogo: '',
    allegaAsseverazione: true,
    versamentoTotale: '',
    versamento: codici.slice(0, NUMERO_INDIRIZZI_VERSAMENTO).map((cod) => {
      const [n, ...resto] = cod.split('.');
      return { n, sotto: resto.join('.'), importo: '' };
    }),
    impianti: [0, 1, 2, 3, 4].map(() => ({ attivo: false, testo: '' })),
  };
}

export const professionistaVuoto = (): ProfessionistaVvf => ({
  titolo: '',
  cognome: '',
  nome: '',
  collegio: '',
  alboProvincia: '',
  alboNumero: '',
  codiceMI: '',
  ufficio: vuotoIndirizzo(),
  email: '',
  pec: '',
  delegato: { titolo: '', cognome: '', nome: '', ...vuotoIndirizzo() },
});

// ---------------- valori per modulo ----------------

const maiuscolo = (t: string) => t.trim().toUpperCase();

/** Valori comuni ai moduli di rinnovo: titolare, sede, attività. */
function valoriTitolare(d: DatiModuli): Valori {
  const t = d.titolare;
  const v: Valori = {
    tCognome: maiuscolo(t.cognome),
    tNome: maiuscolo(t.nome),
    tIndirizzo: maiuscolo(t.indirizzo),
    tCivico: t.civico,
    tCap: t.cap,
    tComune: maiuscolo(t.comune),
    tProv: maiuscolo(t.provincia),
    tTel: t.telefono,
    qualifica: maiuscolo(t.qualifica),
    ragione: d.ragione.trim(),
    sIndirizzo: maiuscolo(d.sede.indirizzo),
    sCivico: d.sede.civico,
    sCap: d.sede.cap,
    sComune: maiuscolo(d.sede.comune),
    sProv: maiuscolo(d.sede.provincia),
    sTel: d.sede.telefono,
    email: t.email.trim(),
    pec: t.pec.trim(),
  };
  const cf = t.codiceFiscale.replace(/\s/g, '').toUpperCase();
  for (let k = 0; k < 16; k++) v[`cf${k}`] = cf[k] ?? '';
  return v;
}

function valoriAttivita(d: DatiModuli): Valori {
  const a = d.attivita;
  return {
    tipoAttivita: maiuscolo(a.tipo),
    aIndirizzo: maiuscolo(a.indirizzo),
    aCivico: a.civico,
    aCap: a.cap,
    aComune: maiuscolo(a.comune),
    aProv: maiuscolo(a.provincia),
    aTel: a.telefono,
    classe: a.classe,
    altreAttivita: a.altre,
  };
}

/** MOD. PIN 3 – attestazione di rinnovo periodico. */
export function valoriPin3(s: Sopralluogo, d: DatiModuli, tecnico: Tecnico): Valori {
  const p = tecnico.vvf ?? professionistaVuoto();
  const v: Valori = {
    rifPratica: s.pratica?.nPraticaVvf ?? '',
    comando: maiuscolo(d.comando),
    ...valoriTitolare(d),
    ...valoriAttivita(d),
    sciaPrecedente: d.sciaPrecedente.trim(),
    allegaAsseverazione: d.allegaAsseverazione,
    nonAllegaAsseverazione: !d.allegaAsseverazione,
    totale: d.versamentoTotale.trim(),
    // corrispondenza e delegato: dati del professionista
    cCognome: maiuscolo(p.cognome),
    cNome: maiuscolo(p.nome),
    cIndirizzo: maiuscolo(p.ufficio.indirizzo),
    cCivico: p.ufficio.civico,
    cCap: p.ufficio.cap,
    cComune: maiuscolo(p.ufficio.comune),
    cProv: maiuscolo(p.ufficio.provincia),
    cTel: p.ufficio.telefono,
    cEmail: p.email,
    cPec: p.pec,
    dTitolo: maiuscolo(p.delegato.titolo),
    dCognome: maiuscolo(p.delegato.cognome),
    dNome: maiuscolo(p.delegato.nome),
    dIndirizzo: maiuscolo(p.delegato.indirizzo),
    dCivico: p.delegato.civico,
    dCap: p.delegato.cap,
    dComune: maiuscolo(p.delegato.comune),
    dProv: maiuscolo(p.delegato.provincia),
    dTel: p.delegato.telefono,
  };
  for (let k = 0; k < 8; k++) {
    const r = d.versamento[k];
    v[`vaN${k}`] = r?.n ?? '';
    v[`vaSotto${k}`] = r?.sotto ?? '';
    v[`vaImporto${k}`] = r?.importo.trim() ? `${r.importo.trim()}` : '';
  }
  return v;
}

/** MOD. PIN 3.1 – asseverazione per rinnovo. */
export function valoriPin31(s: Sopralluogo, d: DatiModuli, tecnico: Tecnico): Valori {
  const p = tecnico.vvf ?? professionistaVuoto();
  const a = d.attivita;
  const v: Valori = {
    rifPratica: s.pratica?.nPraticaVvf ?? '',
    comando: maiuscolo(d.comando),
    pTitolo: maiuscolo(p.titolo),
    pCognome: maiuscolo(p.cognome),
    pNome: maiuscolo(p.nome),
    pCollegio: maiuscolo(p.collegio),
    pAlboProv: maiuscolo(p.alboProvincia),
    pAlboNumero: p.alboNumero,
    pCodiceMI: p.codiceMI,
    pIndirizzo: maiuscolo(p.ufficio.indirizzo),
    pCivico: p.ufficio.civico,
    pCap: p.ufficio.cap,
    pComune: maiuscolo(p.ufficio.comune),
    pProv: maiuscolo(p.ufficio.provincia),
    pTel: p.ufficio.telefono,
    tipoAttivita: maiuscolo(a.tipo),
    aIndirizzo: maiuscolo(a.indirizzo),
    aCivico: a.civico,
    aCap: a.cap,
    aComune: maiuscolo(a.comune),
    aProv: maiuscolo(a.provincia),
    aTel: a.telefono,
    sciaData: d.sciaPrecedente.trim(),
    sciaFirma: d.sciaFirma.trim(),
    dataSopralluogo: dataItaliana(d.dataSopralluogo),
    dataFirma: '',
  };
  d.impianti.forEach((i, k) => {
    v[`chkA${k}`] = i.attivo;
    v[`testoA${k}`] = i.attivo ? i.testo.trim() : '';
  });
  return v;
}

/** "77.1.A" → { n: "77", sotto: "1", cat: "A" } */
export function dividiCodice(codice: string): { n: string; sotto: string; cat: string } {
  const [n = '', sotto = '', cat = ''] = codice.trim().split('.');
  return { n, sotto, cat };
}

function valoriClassi(codici: string[], righe: number): Valori {
  const v: Valori = {};
  for (let k = 0; k < righe; k++) {
    const c = dividiCodice(codici[k] ?? '');
    v[`attN${k}`] = c.n;
    v[`attSotto${k}`] = c.sotto;
    v[`attCat${k}`] = c.cat;
  }
  return v;
}

function valoriProfessionista(p: ProfessionistaVvf): Valori {
  return {
    cCognome: maiuscolo(p.cognome),
    cNome: maiuscolo(p.nome),
    cIndirizzo: maiuscolo(p.ufficio.indirizzo),
    cCivico: p.ufficio.civico,
    cCap: p.ufficio.cap,
    cComune: maiuscolo(p.ufficio.comune),
    cProv: maiuscolo(p.ufficio.provincia),
    cTel: p.ufficio.telefono,
    cEmail: p.email,
    cPec: p.pec,
    dTitolo: maiuscolo(p.delegato.titolo),
    dCognome: maiuscolo(p.delegato.cognome),
    dNome: maiuscolo(p.delegato.nome),
    dIndirizzo: maiuscolo(p.delegato.indirizzo),
    dCivico: p.delegato.civico,
    dCap: p.delegato.cap,
    dComune: maiuscolo(p.delegato.comune),
    dProv: maiuscolo(p.delegato.provincia),
    dTel: p.delegato.telefono,
  };
}

/** MOD. PIN 2 – SCIA. */
export function valoriPin2(s: Sopralluogo, d: DatiModuli, tecnico: Tecnico): Valori {
  const p = tecnico.vvf ?? professionistaVuoto();
  const t = d.titolare;
  const codici = s.attivita.map((a) => a.codice);
  const v: Valori = {
    rifPratica: s.pratica?.nPraticaVvf ?? '',
    comando: maiuscolo(d.comando),
    ...valoriTitolare(d),
    ...valoriAttivita(d),
    ...valoriClassi(codici, 4),
    // fascicolo tecnico custodito presso l'amministratore
    fNominativo: maiuscolo(`${t.nome} ${t.cognome}`),
    fIndirizzo: maiuscolo(t.indirizzo),
    fCivico: t.civico,
    fCap: t.cap,
    fComune: maiuscolo(t.comune),
    fProv: maiuscolo(t.provincia),
    ...valoriProfessionista(p),
    totale: d.versamentoTotale.trim(),
  };
  for (let k = 0; k < 6; k++) {
    const r = d.versamento[k];
    v[`vaN${k}`] = r?.n ?? '';
    v[`vaImporto${k}`] = r?.importo.trim() ?? '';
  }
  return v;
}

/** MOD. PIN 2.1 – asseverazione della SCIA. */
export function valoriPin21(s: Sopralluogo, d: DatiModuli, tecnico: Tecnico): Valori {
  const p = tecnico.vvf ?? professionistaVuoto();
  const a = d.attivita;
  return {
    rifPratica: s.pratica?.nPraticaVvf ?? '',
    pTitolo: maiuscolo(p.titolo),
    pCognome: maiuscolo(p.cognome),
    pNome: maiuscolo(p.nome),
    pCollegio: maiuscolo(`${p.collegio} ${p.alboProvincia}`),
    pAlboNumero: p.alboNumero,
    pIndirizzo: maiuscolo(p.ufficio.indirizzo),
    pCivico: p.ufficio.civico,
    pCap: p.ufficio.cap,
    pComune: maiuscolo(p.ufficio.comune),
    pProv: maiuscolo(p.ufficio.provincia),
    pTel: p.ufficio.telefono,
    pEmail: p.email,
    pPec: p.pec,
    chkNuovo: false,
    chkModifica: false,
    tipoAttivita: maiuscolo(a.tipo),
    aIndirizzo: maiuscolo(a.indirizzo),
    aCivico: a.civico,
    aCap: a.cap,
    aComune: maiuscolo(a.comune),
    aProv: maiuscolo(a.provincia),
    aTel: a.telefono,
    ...valoriClassi(s.attivita.map((x) => x.codice), 3),
    dataFirma: '',
  };
}

/** Dati anagrafici e recapiti del professionista, con le chiavi p… dei moduli PIN 1, 2.2, 2.3, 2.5, 2.6. */
function valoriProfessionistaP(p: ProfessionistaVvf, collegioComeProvincia = false): Valori {
  return {
    pTitolo: maiuscolo(p.titolo),
    pCognome: maiuscolo(p.cognome),
    pNome: maiuscolo(p.nome),
    pCollegio: maiuscolo(collegioComeProvincia ? p.alboProvincia : p.collegio),
    pCodiceMI: p.codiceMI,
    pIndirizzo: maiuscolo(p.ufficio.indirizzo),
    pCivico: p.ufficio.civico,
    pCap: p.ufficio.cap,
    pComune: maiuscolo(p.ufficio.comune),
    pProv: maiuscolo(p.ufficio.provincia),
    pTel: p.ufficio.telefono,
    pEmail: p.email,
    pPec: p.pec,
  };
}

/** Recapito dell'attività (n. civico, CAP, comune, provincia, telefono) e, dove serve, la via. */
function valoriSedeAttivita(d: DatiModuli): Valori {
  return { ...valoriAttivita(d), dataFirma: '' };
}

/** MOD. PIN 1 – valutazione del progetto. */
export function valoriPin1(_s: Sopralluogo, d: DatiModuli, tecnico: Tecnico): Valori {
  const p = tecnico.vvf ?? professionistaVuoto();
  return { ...valoriTitolare(d), ...valoriSedeAttivita(d), ...valoriProfessionistaP(p) };
}

/** MOD. PIN 7 – voltura (cambio di titolare). */
export function valoriPin7(_s: Sopralluogo, d: DatiModuli, _tecnico: Tecnico): Valori {
  return { ...valoriTitolare(d), ...valoriSedeAttivita(d), classe: d.attivita.classe };
}

/** MOD. PIN 2.2 – certificazione di resistenza al fuoco (REI). */
export function valoriPin22(_s: Sopralluogo, d: DatiModuli, tecnico: Tecnico): Valori {
  return { ...valoriProfessionistaP(tecnico.vvf ?? professionistaVuoto()), ...valoriSedeAttivita(d) };
}

/** MOD. PIN 2.3 – dichiarazione di prodotto. */
export function valoriPin23(_s: Sopralluogo, d: DatiModuli, tecnico: Tecnico): Valori {
  return { ...valoriProfessionistaP(tecnico.vvf ?? professionistaVuoto()), ...valoriSedeAttivita(d) };
}

/** MOD. PIN 2.5 – certificazione di impianto. */
export function valoriPin25(_s: Sopralluogo, d: DatiModuli, tecnico: Tecnico): Valori {
  return { ...valoriProfessionistaP(tecnico.vvf ?? professionistaVuoto(), true), ...valoriSedeAttivita(d) };
}

/** MOD. PIN 2.6 – dichiarazione di non aggravio del rischio. */
export function valoriPin26(_s: Sopralluogo, d: DatiModuli, tecnico: Tecnico): Valori {
  return { ...valoriProfessionistaP(tecnico.vvf ?? professionistaVuoto(), true), ...valoriSedeAttivita(d) };
}

/** Funzione dei valori di ogni modulo. */
export const VALORI_MODULO: Record<ModelloModulo['id'], (s: Sopralluogo, d: DatiModuli, t: Tecnico) => Valori> = {
  pin3: valoriPin3,
  pin31: valoriPin31,
  pin2: valoriPin2,
  pin21: valoriPin21,
  pin1: valoriPin1,
  pin7: valoriPin7,
  pin22: valoriPin22,
  pin23: valoriPin23,
  pin25: valoriPin25,
  pin26: valoriPin26,
};

/** Nome del file: "VIA CIVICO_MOD. PIN 3 - 2023_RINNOVO PERIODICO.docx" come nell'archivio dello studio. */
export function nomeFileModulo(id: ModelloModulo['id'], s: Sopralluogo): string {
  const c = s.condominio;
  const base = [c.indirizzo.trim() || 'pratica'].join(' ').replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim();
  const num = id === 'pin3' || id === 'pin2' || id === 'pin1' || id === 'pin7' ? '01_' : '02_';
  return `${num}${base}_${MODELLI[id].nome}.docx`;
}
