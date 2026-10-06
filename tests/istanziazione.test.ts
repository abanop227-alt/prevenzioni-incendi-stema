import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  applicaEsclusivita,
  duplicaSezione,
  famigliaDi,
  gruppiDocumento,
  migraSopralluogo,
  nuovaAttivita,
  nuovoSopralluogo,
  nuovaVocePersonalizzata,
  numerazioneFoto,
  nonAggravioEffettivo,
  sezioniDiAttivita,
  sincronizza,
  spostaSezione,
  spostaVoce,
  testoConclusioniAutomatico,
  validaCatalogo,
  vociDiSezione,
} from '../src/lib/catalogo';
import { cat, sopralluogoCon, voce } from './aiuti';

describe('libreria', () => {
  it('contiene le famiglie 74, 75 e 77 con sezioni e voci', () => {
    expect(cat.famiglie.map((f) => f.id).sort()).toEqual(['74', '75', '77']);
    for (const f of cat.famiglie) {
      expect(f.sezioni.length).toBeGreaterThanOrEqual(3);
      expect(f.certificazioni.length).toBeGreaterThan(3);
      expect(f.regoleTecniche.length).toBeGreaterThanOrEqual(1);
    }
    expect(cat.famiglie.find((f) => f.id === '77')!.sezioni.map((s) => s.titolo)).toEqual([
      'Vano scala',
      'Locale macchine ascensore',
      'Impianto idrico antincendio',
      'Cartelli e segnaletica di sicurezza',
      'Porte dei locali tecnici (contatori, autoclave, solai)',
    ]);
  });

  it('le parti da completare non hanno parentesi annidate', () => {
    for (const f of cat.famiglie)
      for (const s of f.sezioni)
        for (const v of s.voci) {
          let d = 0;
          for (const ch of v.testo) {
            d += ch === '[' ? 1 : ch === ']' ? -1 : 0;
            expect(d === 0 || d === 1, v.id).toBe(true);
          }
          expect(d, v.id).toBe(0);
        }
  });

  it('la famiglia si ricava dal numero: anche un codice personalizzato 75.3.C ha le voci delle autorimesse', () => {
    expect(famigliaDi(cat, '75.3.C')?.id).toBe('75');
    expect(famigliaDi(cat, '99.1.A')).toBeUndefined();
  });

  it('accetta una libreria modificata con una nuova famiglia, senza toccare il codice', () => {
    const c = validaCatalogo({
      attivita: [{ codice: '49.1.A', descrizione: 'Gruppi elettrogeni' }],
      famiglie: [{ id: '49', sezioni: [{ id: 'ge', titolo: 'Gruppo elettrogeno', voci: [{ id: 'ge1', titolo: 'x', testo: 'y', lavorazioni: [{ descrizione: 'z', um: 'mc' }] }] }] }],
    });
    expect(c.umOptions).toContain('mc');
    const s = sincronizza({ ...sopralluogoCon([]), attivita: [nuovaAttivita(c, '49.1.A')] }, c);
    expect(s.voci.map((v) => v.key)).toEqual(['ge1@ge@49.1.A']);
    expect(() => validaCatalogo({ attivita: [] })).toThrow(/famiglie/);
  });
});

describe('istanziazione per attività', () => {
  it('una 77 mostra tutte le voci della libreria 77, sezione per sezione', () => {
    const s = sopralluogoCon(['77.1.A']);
    const f77 = cat.famiglie.find((f) => f.id === '77')!;
    const sezioni = sezioniDiAttivita(s, '77.1.A');
    expect(sezioni.map((x) => x.titolo)).toEqual(f77.sezioni.map((x) => x.titolo));
    sezioni.forEach((sez, i) => {
      expect(vociDiSezione(s, sez.key).map((v) => v.voceId)).toEqual(f77.sezioni[i].voci.map((v) => v.id));
    });
    expect(s.voci.every((v) => !v.selezionata)).toBe(true);
  });

  it('più attività insieme: 74 + 75 + 77, ognuna con le sue voci indipendenti', () => {
    const s = sopralluogoCon(['74.1.A', '75.2.B', '77.1.A']);
    const tot = cat.famiglie.reduce((n, f) => n + f.sezioni.reduce((m, x) => m + x.voci.length, 0), 0);
    expect(s.voci).toHaveLength(tot);
    expect(new Set(s.voci.map((v) => v.attivita))).toEqual(new Set(['74.1.A', '75.2.B', '77.1.A']));
    expect(s.righeExtra.map((r) => r.key)).toEqual(['trasporto@74.1.A', 'trasporto@75.2.B', 'trasporto@77.1.A']);
  });

  it('due attività della stessa famiglia hanno voci separate', () => {
    const s = sopralluogoCon(['75.1.A', '75.2.B']);
    const a = voce(s, '75-ar-posacenere', '75.1.A');
    const b = voce(s, '75-ar-posacenere', '75.2.B');
    expect(a.key).not.toBe(b.key);
    a.testo = 'modificato';
    expect(b.testo).not.toBe('modificato');
  });

  it('attività, regola tecnica, scopo e certificazioni proposti dalla libreria', () => {
    const a = nuovaAttivita(cat, '77.1.A');
    expect(a.regolaTecnica).toBe('D.M. 16/05/1987 n° 246');
    expect(a.regolaTecnicaTesto).toContain('D.M. 16/05/1987');
    expect(a.descrizioneScopo).toContain('{dato}');
    expect(a.certificazioni.every((c) => c.richiesta)).toBe(true);
    const a74 = nuovaAttivita(cat, '74.1.A');
    expect(a74.certificazioni.some((c) => !c.richiesta)).toBe(true); // opzionali non spuntate
  });

  it('la sincronizzazione è idempotente e non tocca le modifiche', () => {
    const s = sopralluogoCon(['74.1.A']);
    s.voci[0].testo = 'modificato';
    const s2 = sincronizza(s, cat);
    expect(s2).toBe(s);
  });

  it('duplica una sezione (Vano scala → Vano scala B) con voci nuove e vuote', () => {
    let s = sopralluogoCon(['77.1.A']);
    const vs = sezioniDiAttivita(s, '77.1.A')[0];
    voce(s, '77-vs-aer-ok').selezionata = true;
    s = duplicaSezione(s, cat, vs.key, 'Vano scala B');
    const sez = sezioniDiAttivita(s, '77.1.A');
    expect(sez.map((x) => x.titolo)).toEqual([
      'Vano scala',
      'Vano scala B',
      'Locale macchine ascensore',
      'Impianto idrico antincendio',
      'Cartelli e segnaletica di sicurezza',
      'Porte dei locali tecnici (contatori, autoclave, solai)',
    ]);
    const nuove = vociDiSezione(s, sez[1].key);
    expect(nuove.length).toBe(vociDiSezione(s, vs.key).length);
    expect(nuove.every((v) => !v.selezionata)).toBe(true);
    // una seconda duplicazione va dopo "Vano scala B"
    s = duplicaSezione(s, cat, vs.key, 'Vano scala C');
    expect(sezioniDiAttivita(s, '77.1.A').map((x) => x.titolo).slice(0, 3)).toEqual(['Vano scala', 'Vano scala B', 'Vano scala C']);
  });

  it('documento: solo voci spuntate, sezioni vuote escluse; foto numerate in ordine', () => {
    const s = sopralluogoCon(['74.1.A', '77.1.A']);
    const a = voce(s, '74-ct-aer-ok');
    const b = voce(s, '77-vs-aer-ok');
    const c = voce(s, '77-ia-descrizione');
    [a, b, c].forEach((v) => (v.selezionata = true));
    a.fotoIds = ['f1'];
    b.fotoIds = ['f2', 'f3'];
    const pers = nuovaVocePersonalizzata(sezioniDiAttivita(s, '77.1.A')[3]);
    s.voci.push(pers);
    const g = gruppiDocumento(s);
    expect(g.map((x) => x.sezioni.map((y) => y.sezione.titolo))).toEqual([
      ['Locale centrale termica'],
      ['Vano scala', 'Impianto idrico antincendio', 'Cartelli e segnaletica di sicurezza'],
    ]);
    const n = numerazioneFoto(s);
    expect(n.get(a.key)).toEqual([1]);
    expect(n.get(b.key)).toEqual([2, 3]);
  });

  it('conclusioni automatiche: esito, riferimenti e non aggravio dalla voce', () => {
    const s = sopralluogoCon(['74.1.A', '77.1.A']);
    s.attivita[0].dataApprovazione = '2001-06-08';
    s.attivita[1].riferimento = 'regola';
    let t = testoConclusioniAutomatico(s, cat);
    expect(t).toContain('non risulta dunque conforme al progetto approvato il 08/06/2001 per l’attività 74.1.A e al D.M. 16/05/1987 n° 246 per l’attività 77.1.A');
    expect(t).not.toContain('non aggravio');
    voce(s, '74-ct-pot-diff').selezionata = true;
    expect(nonAggravioEffettivo(s)).toBe(true);
    t = testoConclusioniAutomatico(s, cat);
    expect(t).toContain('dichiarazione di non aggravio');
    s.nonAggravio = false;
    expect(nonAggravioEffettivo(s)).toBe(false);
  });

  it('migra i sopralluoghi creati con la prima versione dell’app', () => {
    const vecchio = {
      id: 'x',
      creato: 1,
      modificato: 2,
      attivita: [{ codice: '77.1.A', descrizione: 'd', nProgetto: '12', dataApprovazione: '2020-01-01', datoDimensionale: '25' }],
      condominio: { committente: 'Cond. Alfa', dataSopralluogo: '2026-01-01' },
      voci: [{ key: 'g1@77.1.A' }],
      conclusioni: 'x',
    };
    const s = sincronizza(migraSopralluogo(vecchio, cat), cat);
    expect(s.versione).toBe(2);
    expect(s.attivita[0].nProgetto).toBe('12');
    expect(s.condominio.committente).toBe('Cond. Alfa');
    expect(s.voci.length).toBeGreaterThan(5);
  });

  it('riordina frasi nella sezione e sezioni nell’attività (l’ordine va nel Word)', () => {
    let s = sopralluogoCon(['74.1.A', '77.1.A']);
    const vs = sezioniDiAttivita(s, '77.1.A')[0];
    const prima = vociDiSezione(s, vs.key).map((v) => v.voceId);
    s = spostaVoce(s, `${prima[1]}@${vs.key}`, -1);
    expect(vociDiSezione(s, vs.key).map((v) => v.voceId)).toEqual([prima[1], prima[0], ...prima.slice(2)]);
    // la prima non sale oltre, l'ultima non scende oltre
    expect(spostaVoce(s, `${prima[1]}@${vs.key}`, -1)).toBe(s);
    s = spostaSezione(s, vs.key, 1);
    expect(sezioniDiAttivita(s, '77.1.A').map((x) => x.titolo).slice(0, 2)).toEqual(['Locale macchine ascensore', 'Vano scala']);
    // le sezioni della 74 non si mescolano con la 77
    expect(sezioniDiAttivita(s, '74.1.A')[0].titolo).toBe('Locale centrale termica');
    expect(spostaSezione(s, sezioniDiAttivita(s, '74.1.A')[0].key, -1)).toBe(s);
    // ordine nel documento
    for (const v of vociDiSezione(s, vs.key).slice(0, 2)) v.selezionata = true;
    const g = gruppiDocumento(s).find((x) => x.attivita.codice === '77.1.A')!;
    expect(g.sezioni[0].voci.map((v) => v.voceId)).toEqual([prima[1], prima[0]]);
  });

  it('frasi spostate in un’altra sezione della libreria: seguono la sezione senza doppioni né perdite', () => {
    // sopralluogo creato quando le frasi del locale macchine stavano in "Vano scala"
    let s = sopralluogoCon(['77.1.A']);
    const lm = sezioniDiAttivita(s, '77.1.A').find((x) => x.sezioneId === '77-lm')!;
    s = {
      ...s,
      sezioni: s.sezioni.filter((x) => x !== lm),
      voci: s.voci
        .filter((v) => v.sezioneKey !== lm.key || v.voceId === '77-vs-lma-porta-80')
        .map((v) =>
          v.sezioneKey === lm.key
            ? { ...v, key: `${v.voceId}@77-vs@77.1.A`, sezioneKey: '77-vs@77.1.A', selezionata: true, fotoIds: ['f1'] }
            : v,
        ),
    };
    const dopo = sincronizza(s, cat);
    const sez = sezioniDiAttivita(dopo, '77.1.A');
    expect(sez.map((x) => x.titolo)).toEqual(['Vano scala', 'Locale macchine ascensore', 'Impianto idrico antincendio', 'Cartelli e segnaletica di sicurezza', 'Porte dei locali tecnici (contatori, autoclave, solai)']);
    const porta = dopo.voci.filter((v) => v.voceId === '77-vs-lma-porta-80');
    expect(porta).toHaveLength(1);
    expect(porta[0].sezioneKey).toBe('77-lm@77.1.A');
    expect(porta[0].selezionata).toBe(true);
    expect(porta[0].fotoIds).toEqual(['f1']);
    expect(vociDiSezione(dopo, '77-vs@77.1.A').some((v) => v.voceId?.startsWith('77-vs-lma'))).toBe(false);
    expect(sincronizza(dopo, cat)).toBe(dopo);
  });
});

describe('impianto idrico antincendio: una voce, un esito, i rilievi', () => {
  it('c’è una sola voce di descrizione per tipo e le voci sugli idranti sono tutte nella sezione dell’impianto', () => {
    for (const [fam, sez] of [['77', '77-me'], ['75', '75-ia']] as const) {
      const f = cat.famiglie.find((x) => x.id === fam)!;
      const impianto = f.sezioni.find((x) => x.id === sez)!;
      expect(impianto.titolo).toBe('Impianto idrico antincendio');
      expect(impianto.voci.filter((v) => v.id.endsWith('-ia-descrizione'))).toHaveLength(1);
      // fuori dalla sezione non resta nessuna frase sugli idranti, né duplicati del promemoria UNI 10779
      const altrove = f.sezioni.filter((x) => x.id !== sez).flatMap((x) => x.voci);
      expect(altrove.filter((v) => /idrant|manichett|UNI 10779|motopompa/i.test(v.testo))).toEqual([]);
    }
    const uni = cat.famiglie.flatMap((f) => f.sezioni.flatMap((x) => x.voci)).filter((v) => v.testo.includes('UNI 10779'));
    expect(uni).toHaveLength(2); // una per tipo (75 e 77), con lo stesso testo
    expect(uni[0].testo).toBe(uni[1].testo);
  });

  it('l’esito della prova è uno solo: spuntarne uno toglie l’altro', () => {
    let s = sopralluogoCon(['77.1.A']);
    voce(s, '77-me-prova-negativa').selezionata = true;
    s = applicaEsclusivita(s, cat, voce(s, '77-me-prova-negativa').key);
    voce(s, '77-ia-prova-positiva').selezionata = true;
    s = applicaEsclusivita(s, cat, voce(s, '77-ia-prova-positiva').key);
    expect(voce(s, '77-ia-prova-positiva').selezionata).toBe(true);
    expect(voce(s, '77-me-prova-negativa').selezionata).toBe(false);
    expect(voce(s, '77-me-prova').selezionata).toBe(false);
  });

  it('i rilievi senza gruppo si spuntano insieme alla descrizione', () => {
    let s = sopralluogoCon(['77.1.A']);
    for (const id of ['77-ia-descrizione', '77-me-manichette', '77-me-idranti-mancanti']) {
      voce(s, id).selezionata = true;
      s = applicaEsclusivita(s, cat, voce(s, id).key);
    }
    expect(['77-ia-descrizione', '77-me-manichette', '77-me-idranti-mancanti'].every((id) => voce(s, id).selezionata)).toBe(true);
  });

  it('i tre attacchi motopompa si escludono a vicenda', () => {
    let s = sopralluogoCon(['77.1.A']);
    for (const id of ['77-me-attacco', '77-me-attacco-unico']) {
      voce(s, id).selezionata = true;
      s = applicaEsclusivita(s, cat, voce(s, id).key);
    }
    expect(voce(s, '77-me-attacco').selezionata).toBe(false);
    expect(voce(s, '77-me-attacco-unico').selezionata).toBe(true);
  });

  it('una sola voce per le porte REI/EI da sostituire in ogni sezione', () => {
    const porte = cat.famiglie.flatMap((f) => f.sezioni.flatMap((x) => x.voci)).filter((v) => v.id.includes('porta-sostituire') || v.id === '77-vs-lma-porta-80');
    expect(porte.map((v) => v.id).sort()).toEqual(['75-fv-porta-sostituire', '77-lt-porta-sostituire', '77-vs-lma-porta-80']);
    for (const v of porte) {
      expect(v.lavorazioni.map((l) => l.inclusa !== false)).toEqual([true, true, true, false]);
    }
  });
});

describe('pratiche salvate prima della riorganizzazione', () => {
  it('conservano frasi e testi già compilati e ricevono le voci nuove senza perdite', () => {
    const vecchia = validaCatalogo(JSON.parse(readFileSync(new URL('./fixtures/roa-dati-prima-riorganizzazione.json', import.meta.url), 'utf8')));
    let s = nuovoSopralluogo();
    s.attivita = ['75.2.B', '77.1.A'].map((c) => nuovaAttivita(vecchia, c));
    s = sincronizza(s, vecchia);
    const rete = voce(s, '77-me-rete');
    rete.selezionata = true;
    rete.testo = 'Testo già modificato dal tecnico.';
    rete.fotoIds = ['f1'];
    voce(s, '75-ds-idranti').selezionata = true;

    const dopo = sincronizza(s, cat);
    // le frasi vecchie, spuntate e modificate, restano
    expect(voce(dopo, '77-me-rete').testo).toBe('Testo già modificato dal tecnico.');
    expect(voce(dopo, '77-me-rete').fotoIds).toEqual(['f1']);
    expect(voce(dopo, '75-ds-idranti').selezionata).toBe(true);
    // e arrivano le voci nuove, non spuntate
    expect(voce(dopo, '77-ia-descrizione').selezionata).toBe(false);
    expect(voce(dopo, '75-ia-descrizione').selezionata).toBe(false);
    // la sezione nuova dell'autorimessa c'è
    expect(dopo.sezioni.some((x) => x.sezioneId === '75-ia')).toBe(true);
    // nessuna chiave doppia
    const chiavi = dopo.voci.map((v) => v.key);
    expect(new Set(chiavi).size).toBe(chiavi.length);
  });
});
