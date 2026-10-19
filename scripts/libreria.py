# Sorgente della libreria voci (genera src/data/roa-dati.json).
# Testi estratti dalle ROA dello studio; le parti variabili sono tra [parentesi quadre].
import json, os

L = lambda d, um, inclusa=True: {"descrizione": d, "um": um, **({} if inclusa else {"inclusa": False})}
V = lambda id, titolo, testo, didascalia="", lav=None, **k: {"id": id, "titolo": titolo, "testo": testo, "didascalia": didascalia, "lavorazioni": lav or [], **k}
C = lambda testo, sotto=None, predefinita=True: {"testo": testo, **({"sotto": sotto} if sotto else {}), **({} if predefinita else {"predefinita": False})}

CARTELLONISTICA = L("Fornitura e posa nuova cartellonistica.", "cad")
RIM_PORTE = L("Rimozione porte non a norma.", "cad")
PORTA_REI = L("Fornitura e posa porte con resistenza al fuoco non inferiori a REI [60] (dimensioni [0,80 x 2,00] m), compresa assistenza muraria.", "cad")
COLLARI = L("Fornitura e posa collari termo – espandenti sulle tubazioni attraversanti le murature sul retro dei box ed i filtri.", "a corpo")

def sotto(impianto, n2=True, n3=True):
    return [f"Progetto {impianto}{'²' if n2 else ''};", "Schema d’impianto;", "Relazione con la tipologia dei materiali;",
            f"Requisiti tecnico professionali dell’impresa esecutrice{'³' if n3 else ''}."]

UNI10779 = ("Si rammenta, inoltre, che la norma UNI 10779-2014 – RETE IDRANTI – stabilisce che:\n"
            "- La manutenzione degli idranti a muro deve essere svolta almeno due volte all’anno, in conformità alla UNI EN 671-3, da personale competente e qualificato.\n"
            "- Tutte le tubazioni flessibili e semirigide devono essere verificate annualmente sottoponendole alla pressione di rete per verificarne l’integrità.\n"
            "- In ogni caso, ogni 5 anni deve essere eseguita la prova di tenuta delle tubazioni flessibili e semirigide (12 bar) come previsto dalla UNI EN 671-3. Se la prova dà esito positivo non vi è l’obbligo di sostituire la tubazione.")

f74 = {
  "id": "74", "nome": "Impianti di produzione di calore", "zonaComputo": "Centrale termica:",
  "unitaDato": "kW", "etichettaDato": "Potenzialità",
  "modelloScopo": "Impianti per la produzione di calore alimentati a combustibile solido, liquido o gassoso con potenzialità pari a {dato} kW",
  "regoleTecniche": [
    {"etichetta": "D.M. 12/04/1996", "testo": "“Approvazione della regola tecnica di prevenzione incendi per la progettazione, la costruzione e l’esercizio degli impianti termici alimentati da combustibili gassosi” – D.M. 12 aprile 1996."},
    {"etichetta": "D.M. 08/11/2019", "testo": "D.M. 08/11/2019."},
  ],
  "sezioni": [
    {"id": "74-ct", "titolo": "Locale centrale termica", "voci": [
      V("74-ct-descrizione", "Impianto: descrizione",
        "La centrale termica posta al piano [interrato], [nella volumetria dell’edificio ad uso civile servito / nel cortile interno dell’edificio], [con ingresso diretto dall’esterno,] è alimentata a [gas]. Ha una potenza nominale utile di [220,00] kW[; è composta da n° 4 unità di potenza 65,5 kW per una potenza totale di 262 kW]. [L’edificio non è soggetto ad attività ricompresa nel D.P.R. 1° agosto 2011 n° 151.]",
        "Locale centrale termica."),
      V("74-ct-nulla-osta", "Pratica VV.F.: nulla osta provvisorio",
        "Dall’accesso atti presso il Comando VV.F. di [Milano] risulta un Nulla Osta Provvisorio del [9/04/93] per la centrale termica a [gasolio]. Attualmente risulta installata una centrale termica alimentata a [gas].",
        "Nulla Osta Provvisorio."),
      V("74-ct-pot-progetto", "Potenzialità: corrispondenza con il progetto approvato",
        "Durante il sopralluogo è stata verificata la corretta corrispondenza con il progetto approvato della centrale termica.",
        "Centrale termica."),
      V("74-ct-pot-ok", "Potenzialità conforme al progetto",
        "Al momento del sopralluogo è stato possibile verificare la corretta corrispondenza della portata termica della caldaia presente, ovvero pari a [valore] kW, rispetto al progetto approvato dal Comando dei VV.F.",
        "Portata termica riscontrata."),
      V("74-ct-pot-diff", "Potenzialità diversa dal progetto (non aggravio)",
        "Al momento del sopralluogo è stato possibile osservare la portata della caldaia, ovvero pari a [valore] kW, difforme da quanto indicato nel progetto approvato, ovvero pari a [valore] kW. In fase di presentazione della S.C.I.A. (segnalazione certificata di inizio attività) antincendio verrà allegata la dichiarazione di non aggravio del rischio incendio per indicare la diminuzione di potenzialità[, che peraltro comporta una diminuzione della categoria di rischio, passando da attività 74.2.B ad attività 74.1.A, come da D.P.R. 1° agosto 2011 n° 151].",
        "Portata termica riscontrata.", nonAggravio=True),
      V("74-ct-pot-scia", "Potenzialità conforme a progetto e S.C.I.A.",
        "Durante il sopralluogo è stata verificata la corretta posizione della centrale termica con la potenzialità dell’impianto che risulta essere pari a [valore] kW, come indicato nel progetto e nella S.C.I.A. approvati al Comando dei Vigili del Fuoco.",
        "Potenzialità dell’impianto – Stralcio progetto approvato."),
      V("74-ct-aer-ok", "Aerazione presente e dimensionata",
        "È stata riscontrata l’aerazione permanente all’interno del locale centrale termica, correttamente dimensionata come previsto nel progetto approvato.",
        "Areazione presente nel locale centrale termica."),
      V("74-ct-aer-fin", "Aerazione tramite finestre con griglie",
        "Durante il sopralluogo, si è rilevato che l'aerazione del locale è assicurata da [due finestre, entrambe dotate di griglie metalliche e mantenute costantemente aperte].",
        "Aerazione presente nel locale centrale termica."),
      V("74-ct-aer-334", "Aperture di aerazione § 3.3.4 (sacche di gas)",
        "Il punto § 3.3.4 della Normativa stabilisce che le aperture di aerazione devono essere realizzate e collocate in modo da evitare la formazione di sacche di gas. Al momento del sopralluogo è stata verificata tale prescrizione.",
        "Porta metallica grigliata – Aerazione permanente."),
      V("74-ct-autochiusura", "Porta senza dispositivo di autochiusura",
        "Al momento del sopralluogo risultava assente il dispositivo di autochiusura della porta [in ferro] di accesso al locale centrale termica. Sarà necessario provvedere alla sua installazione, come previsto dalla normativa vigente.",
        "Porta di accesso alla centrale termica.", [L("Ripristino dispositivi di autochiusura.", "cad"), L("Fornitura e posa di congegno di autochiusura.", "cad", False)]),
      V("74-ct-porta-verificare", "Porta tagliafuoco da verificare (resta aperta)",
        "Il locale centrale termica è prospiciente [sull’intercapedine antincendio che comunica con le cantine dell’edificio attraverso un disimpegno]. Al fine di garantire la compartimentazione della centrale termica, [dovrà essere verificata la porta tagliafuoco / dovranno essere verificate le due porte tagliafuoco], affinché possano chiudersi liberamente. Al momento del sopralluogo [la porta rimaneva aperta / le porte rimanevano aperte], non garantendo così la delimitazione del comparto antincendio.",
        "Porta tagliafuoco rimasta aperta.", [L("Fornitura e posa di congegno di autochiusura.", "cad")]),
      V("74-ct-porta-grigliata", "Porta grigliata esente da requisiti REI",
        "L’accesso al locale avviene tramite una porta grigliata, esente da requisiti REI in quanto il locale è raggiungibile direttamente da uno spazio scoperto, conformemente alle normative vigenti in materia di prevenzione incendi.",
        "Porta di accesso al locale centrale termica."),
      V("74-ct-aer-porta", "Aerazione tramite porta grigliata e ventole",
        "Il locale è correttamente areato con porta grigliata avente superficie di griglia superiore ad [1 mq.] [e ventole di aerazione].",
        "Porta di accesso / aerazione centrale termica."),
      V("74-ct-collari", "Collari intumescenti su tubazioni in plastica",
        "Si provveda nel dotare le tubazioni, in materiale plastico, [insediate nel muro e nella soletta,] con collari intumescenti aventi caratteristiche di resistenza al fuoco non inferiori a EI 120, ai fini di compartimentare correttamente il locale.",
        "Tubazioni in plastica su cui installare i collari.",
        [L("Fornitura e posa collari termoespandenti EI 120.", "cad")]),
      V("74-ct-forometria", "Forometria o fori da sigillare",
        "Al fine di garantire la compartimentazione del locale centrale termica sarà necessario [sigillare la forometria esistente / ripristinare tutti i fori presenti nel locale].",
        "Fori da ripristinare.",
        [L("Ripristini forometrie esistenti con materiali certificati al fuoco almeno EI 120.", "a corpo")]),
      V("74-ct-cartongesso", "Cassonetto o controsoffitto in cartongesso: documenti o rimozione",
        "Al momento del sopralluogo è stata riscontrata la presenza di un cassonetto realizzato in cartongesso [e di parte del soffitto rivestito di cartongesso]. È necessario reperire tutta la documentazione del materiale impiegato (certificato di conformità del materiale e dichiarazioni di corretta posa), perché sono documenti da allegare alla presentazione della SCIA antincendio. Se tali documenti non sono più reperibili, [il cassonetto e la parte del controsoffitto vanno rimossi / il cassonetto va rimosso] e realizzati con materiale idoneo, ovvero non inferiore a EI 120.",
        "Cassonetto in cartongesso."),
      V("74-ct-intonaco", "Intonaco ammalorato",
        "Durante il sopralluogo è stato riscontrato in diverse parti della centrale termica l’intonaco ammalorato; pertanto si consiglia il rifacimento nelle porzioni più degradate.",
        "Intonaco ammalorato.",
        [L("Asportazione intonaco in fase di distacco. Formazione corpo d’intonaco nelle aree con mattoni a vista.", "a corpo")]),
      V("74-ct-serbatoio", "Serbatoio a gasolio dismesso: maniglia a strappo",
        "Si provveda alla rimozione della maniglia a strappo del vecchio serbatoio a gasolio, ormai rimosso.",
        "Maniglia a strappo del vecchio serbatoio."),
      V("74-ct-murature", "Murature REI 120 non certificabili",
        "Il progetto approvato dai VV.F. prevedeva che le murature di delimitazione tra i locali [centrale termica, disimpegno e cantina condominiale] avrebbero avuto caratteristiche di resistenza al fuoco non inferiori a REI 120 ed il professionista incaricato all’epoca precisava nella relazione progettuale che tali murature sarebbero state realizzate con [blocchetti di cemento prefabbricato certificati REI 120]. Ebbene, se non fosse possibile reperire idonea documentazione a riguardo, le caratteristiche odierne delle murature (spessore di circa [10] cm) non permetterebbero al sottoscritto di poterle certificare, secondo il metodo tabellare, con caratteristiche REI 120. Sarà dunque necessario, in questo caso, provvedere alla posa in opera di idoneo cartongesso antincendio, in aderenza alle murature stesse, da terra a plafone, in modo tale da garantire la prescritta resistenza al fuoco delle murature.",
        "Murature di separazione tra i locali.",
        [L("Fornitura e posa cartongesso REI 120 in aderenza alle pareti tra [locale caldaia, disimpegno e cantine] (interno al locale caldaia).", "mq")]),
      V("74-ct-controsoffitto", "Controsoffitto REI/EI 120 del locale",
        "Per garantire la compartimentazione completa della centrale termica, dovrà essere installato un controsoffitto avente caratteristiche REI / EI 120, in aderenza al soffitto esistente. Il tutto dovrà essere documentato con certificati di conformità dei materiali impiegati e dichiarazione di corretta posa.",
        "Soffitto attuale della centrale termica.",
        [L("Fornitura e posa controsoffitto REI / EI 120 in aderenza al soffitto della centrale termica.", "mq")]),
      V("74-ct-canna-disimpegno", "Canna fumaria nel disimpegno (EI 60)",
        "La canna fumaria per lo smaltimento dei fumi della combustione attraversa la muratura di delimitazione con il locale disimpegno, per poi svilupparsi all’interno dello stesso, prima di collegarsi al ramo verticale che sfocia in copertura. Tale tubazione dovrà necessariamente possedere caratteristiche di resistenza al fuoco non inferiori a EI 60 all’interno del disimpegno. Non essendo, ad oggi, in possesso di alcuna documentazione che possa testimoniare le sue caratteristiche se ne prescrive preventivamente la compartimentazione. Alternativamente si potrebbe posare in opera un tratto in materiale plastico (ove possibile) nella sola porzione di condotto in attraversamento della muratura di delimitazione tra centrale termica e disimpegno, installando appositi collari antincendio sulla porzione plastica, all’interno di entrambi i locali.",
        "Canna fumaria.",
        [L("Compartimentazione canna fumaria all’interno del disimpegno della centrale termica.", "a corpo"),
         L("Demolizione muratura in corrispondenza dell’attraversamento della canna fumaria tra la centrale termica e il disimpegno, installazione porzione di tubazione in plastica ed installazione di n. 2 collari termo espandenti.", "a corpo", False)]),
      V("74-ct-chiusura-muratura", "Chiusura muratura tratto verticale canna fumaria",
        "Al fine di garantire la corretta compartimentazione del locale disimpegno (REI 60), sarà necessario provvedere alla chiusura della muratura ove trova alloggiamento il tratto verticale della canna fumaria, installando inoltre apposito sportello metallico atto all’ispezione della camera di raccolta.",
        "Porzione di muratura da chiudere.",
        [L("Chiusura della muratura in mattoni pieni dove trova alloggiamento il tratto verticale della canna fumaria, compresa la fornitura e la posa di idoneo sportello di ispezione.", "a corpo")]),
      V("74-ct-materiale", "Materiale depositato nel disimpegno",
        "Si ricorda inoltre che, all’interno del locale disimpegno è assolutamente vietato depositare qualsiasi tipo di materiale e/o sostanza. Si provveda pertanto alla rimozione di tutto il materiale rilevato in fase di sopralluogo.",
        "Materiale presente nel disimpegno da rimuovere."),
      V("74-ct-condizionatori", "Macchine per il condizionamento nel disimpegno",
        "Analogamente a quanto descritto al punto precedente si prescrive la rimozione e lo spostamento delle macchine per il condizionamento ad oggi presenti nel locale disimpegno.",
        "Macchine per il condizionamento da rimuovere."),
      V("74-ct-sfiato", "Vecchio tubo di sfiato e materiali ingombranti",
        "Si consiglia di togliere il vecchio tubo di sfiato, e di mantenere sia l’ingresso della centrale termica che l’area della stessa priva di materiali ingombranti, per favorire l’accesso al personale dei vigili del fuoco in caso di emergenza.",
        "Vecchio tubo di sfiato e materiali ingombranti.", [L("Rimozione tubazione di sfiato.", "cad")]),
      V("74-ct-sgancio-doppione", "Pulsante di sgancio doppione da rimuovere",
        "Si consiglia la rimozione del pulsante di sgancio installato [nei pressi dell’entrata del locale centrale termica, appena sotto la valvola di intercettazione gas], dato che doppione come funzione e non idoneo alla corretta visualizzazione e rappresentazione del pulsante di sgancio.",
        "Pulsante da rimuovere.", [L("Rimozione pulsante di sgancio non idoneo.", "cad")]),
    ]},
    {"id": "74-ds", "titolo": "Dispositivi di sicurezza", "voci": [
      V("74-ds-estintore-ok", "Estintore presente e manutenuto",
        "Si ricorda che il numero degli estintori non dovrà mai essere inferiore a n°1 posizionato in prossimità della centrale termica. Dovrà inoltre possedere capacità estinguente non inferiore a [21 A – 89 BC], corredato da apposita cartellonistica di ampiezza sufficiente per consentirne un’immediata individuazione. Si ricorda, inoltre, che gli estintori devono essere soggetti a manutenzione semestrale con firma e timbro da apporre su appositi cartellini, ai sensi del D.lgs. 81/08. Al momento del sopralluogo il presidio risultava presente e correttamente manutenuto, nonché segnalato.",
        "Estintore presente a servizio della centrale termica."),
      V("74-ds-estintori-gruppi", "Estintori: numero pari ai gruppi termici",
        "Si ricorda che il numero degli estintori non dovrà mai essere inferiore al numero dei gruppi della centrale termica, nel caso specifico n° [2], posizionati in prossimità dell’impianto termico. [Al momento del sopralluogo è stato riscontrato un solo estintore.] L’estintore dovrà possedere capacità estinguente non inferiore a [34 A – 144 B], corredato da apposita cartellonistica. Gli estintori devono essere soggetti a manutenzione semestrale con firma e timbro su apposito cartellino, ai sensi del D.lgs. 81/08.",
        "Estintori a servizio della centrale termica.",
        [L("Fornitura e posa estintore in acciaio, omologato, a polvere, 6 kg, 34A 233BC, con gancio a muro.", "cad"),
         L("Fornitura e posa gancio per estintore.", "cad", False)]),
      V("74-ds-estintore-cartello", "Estintore: cartellonistica da installare",
        "Si ricorda che ogni estintore presente deve essere munito di apposita cartellonistica. Durante il sopralluogo si è riscontrata la mancanza della cartellonistica dell’estintore posto [all’esterno del locale centrale termica], di conseguenza si richiede l’apposita installazione.",
        "Cartellonistica da installare.", [CARTELLONISTICA]),
      V("74-ds-estintore-noman", "Estintore privo di manutenzione",
        "Durante il sopralluogo è stata riscontrata l’assenza di manutenzione sull’estintore posizionato all’interno della centrale termica. Pertanto, si dovrà provvedere alla sua manutenzione e/o sostituzione, se necessario, da parte della ditta manutentrice dei presidi antincendio.\nInoltre, si ricorda che il numero degli estintori non dovrà mai essere inferiore a n°1, posizionato in prossimità del locale centrale termica. Inoltre, l’estintore dovrà possedere capacità estinguente non inferiore a [34 A – 144 B] corredato da apposita cartellonistica di ampiezza sufficiente per consentirne un’immediata individuazione.",
        "Estintore presente privo di manutenzione."),
      V("74-ds-cartellino", "Estintori: cartellino di manutenzione da compilare",
        "Si ricorda, inoltre, che gli estintori devono essere soggetti a manutenzione semestrale con firma e timbro da apporre su appositi cartellini, ai sensi del D.lgs. 81/08. Sarà pertanto necessario provvedere al controllo periodico dei presidi, compilando il cartellino di manutenzione a corredo.",
        "Cartellino di manutenzione semestrale."),
      V("74-ds-rilevatore", "Rilevatore fughe gas collegato all’elettrovalvola",
        "Al momento del sopralluogo è stata riscontrata la presenza del rilevatore di fughe gas, correttamente collegato all’elettrovalvola.",
        "Rilevatore fughe gas collegato all’elettrovalvola."),
      V("74-ds-emergenza", "Illuminazione di emergenza non funzionante",
        "All’interno del disimpegno è stata rilevata la presenza dell’illuminazione di emergenza. Al momento del sopralluogo, però, tale dispositivo non appariva correttamente funzionante (led segnalatore rosso). Si provveda a contattare apposita ditta per la manutenzione ed il ripristino del dispositivo.",
        "Luce d’emergenza da ripristinare."),
      V("74-ds-contatore-aerato", "Contatore gas: alloggiamento aerato",
        "Il contatore gas dovrà essere dotato di apposito alloggiamento aerato.",
        "Alloggio contatore gas da rendere aerato.", [L("Fornitura e posa cassonetto metallico aerato per contatore gas metano.", "cad"), L("Realizzazione forometrie alloggio contatore gas.", "a corpo", False)]),
      V("74-ds-area-libera", "Area contatore, sgancio ed estintore da tenere libera",
        "È stata riscontrata la presenza dei cassonetti dei rifiuti nelle vicinanze del contatore gas, del pulsante di sgancio e dell’estintore. Tale area deve essere sempre accessibile in caso di emergenza, pertanto dovrà essere libera.",
        "Area da lasciare libera."),
      V("74-ds-gas-giallo", "Linea gas da colorare di giallo",
        "La normativa di riferimento prevede che le tubazioni di adduzione del gas, dal contatore al generatore termico, devono essere contraddistinte con colore giallo. Attualmente tali tubazioni appaiono verniciate [dello stesso colore della facciata condominiale nel tratto esterno al fabbricato]. Si provveda dunque a verniciare l’intera linea di colore giallo, dal contatore al generatore.",
        "Linea gas da colorare di giallo.", [L("Tinteggiatura linea gas dal contatore al bruciatore in smalto giallo.", "a corpo")]),
      V("74-ds-gas-giallo-parz", "Linea gas: verniciatura gialla incompleta",
        "È stata riscontrata durante il sopralluogo l’incompleta verniciatura del tubo gas, si provveda al suo restauro così da favorirne il riconoscimento.",
        "Conduttura del gas da verniciare.",
        [L("Tinteggiatura linea gas dal contatore al bruciatore in smalto giallo.", "a corpo")]),
      V("74-ds-valvola-cartello", "Valvola di intercettazione gas: cartellonistica da installare",
        "Si ricorda che la valvola d’intercettazione del gas deve essere ben segnalata con apposita cartellonistica conforme al D.lgs. 81/08, quindi provvedere alla sua installazione.",
        "Cartellonistica da installare.", [CARTELLONISTICA]),
      V("74-ds-presidi-cartello", "Cartellonistica: presidi e centrale termica",
        "Installare apposita cartellonistica indicante i presidi e la centrale termica.",
        "Presidi e centrale termica.", [CARTELLONISTICA]),
      V("74-ds-sgancio-nuovo", "Pulsante di sgancio da installare",
        "Si provveda all’installazione di adeguato pulsante di sgancio nei pressi della centrale termica corredato da idonea cartellonistica conforme al D.lgs. 81/08.",
        "Pulsante di sgancio.",
        [L("Fornitura e posa in opera di pulsante di sgancio in scatola isolante rossa, con grado di protezione IP55, azionabile con la rottura del vetro di protezione.", "cad"),
         L("Segnalazione luminosa a corredo del pulsante di sgancio.", "cad"),
         L("Assistenza muraria per l’installazione ed il tracciamento della linea.", "a corpo"),
         L("Fornitura ed installazione linea in PVC dalla distribuzione principale al pulsante.", "a corpo")]),
      V("74-ds-sgancio-ok", "Pulsante di sgancio presente e segnalato",
        "Al momento del sopralluogo è stata riscontrata la presenza del pulsante di sgancio d’emergenza a servizio della centrale termica corredato di idonea cartellonistica conforme al D.lgs. 81/08.",
        "Pulsante di sgancio."),
      V("74-ds-valvola", "Valvola di intercettazione gas presente",
        "Al momento del sopralluogo è stata riscontrata la presenza della valvola d’intercettazione del gas metano, corredata con apposita cartellonistica conforme al D.lgs. 81/08.",
        "Valvola intercettazione gas."),
    ]},
    {"id": "74-cf", "titolo": "Canna fumaria", "voci": [
      V("74-cf-termometro", "Termometro sul canale fumi presente",
        "Al momento del sopralluogo è stata accertata la presenza del termometro atto a consentire il rilevamento della temperatura dei fumi sul canale, come prescritto dal D.P.R 1391/70.",
        "Foro e termometro posti sul canale fumi."),
      V("74-cf-camera", "Camera di raccolta presente",
        "È stata verificata la presenza della camera di raccolta posta alla base del tratto verticale del canale dei fumi.",
        "Camera di raccolta."),
      V("74-cf-altezza-ok", "Terminale oltre 1 m dal colmo",
        "È stato possibile osservare la parte terminale della canna fumaria di altezza superiore ad 1,00 m. dal colmo del tetto, come previsto dalla normativa vigente.",
        "Tratto finale della canna fumaria."),
      V("74-cf-altezza-nv", "Terminale non verificabile",
        "Non è stato possibile verificare se la parte terminale della canna fumaria posta in copertura risulta di altezza superiore ad 1,00 m dal colmo del tetto, se così non sarà si dovrà provvedere a portare la stessa all’altezza indicata.",
        "Canna fumaria."),
    ]},
    {"id": "74-cs", "titolo": "Cartelli e segnaletica di sicurezza", "voci": [
      V("74-cs-contatore", "Contatore gas con cartellonistica",
        "È stata riscontrata la presenza del contatore gas, corredato da apposita cartellonistica conforme al D.lgs. 81/08.",
        "Contatore gas."),
      V("74-cs-contatore-nuovo", "Contatore gas: cartellonistica da installare",
        "Si provveda a corredare il contatore gas con apposita cartellonistica conforme al D.lgs. 81/08.",
        "Contatore gas.", [CARTELLONISTICA]),
      V("74-cs-interruttore", "Interruttore generale: cartellonistica da installare",
        "Si provveda a corredare l’interruttore generale con apposita cartellonistica.",
        "Interruttore generale.", [CARTELLONISTICA]),
      V("74-cs-integrare", "Integrare cartelli sgancio e valvola gas",
        "Si provveda ad integrare la cartellonistica di riferimento relativa al pulsante di sgancio elettrico a servizio della centrale termica ed alla valvola di intercettazione manuale del gas.",
        "Pulsante di sgancio – Valvola di intercettazione manuale del gas.", [CARTELLONISTICA]),
    ]},
  ],
  "certificazioni": [
    C("Dichiarazione di Conformità dei prodotti utilizzati per ripristinare le caratteristiche REI 120 delle compartimentazioni o per compartimentare eventuali pareti tubazioni non appartenenti all’impianto termico (intonaci ignifughi, malte e cartongessi REI, …);", predefinita=False),
    C("Dichiarazione di corretta posa in opera da parte dell’installatore dei prodotti;", predefinita=False),
    C("Dichiarazione di Conformità dei materiali utilizzati per realizzazione di opere edili (gasbeton, cartongesso REI, …);", predefinita=False),
    C("Dichiarazione di corretta posa in opera da parte dell’installatore delle opere edili;", predefinita=False),
    C("Certificazione porte REI;", predefinita=False),
    C("Dichiarazione di conformità da parte della ditta installatrice delle porte REI;", predefinita=False),
    C("Dichiarazione di conformità alla regola d’arte dell’impianto termico¹:", sotto("impianto termico")),
    C("Certificato di costruzione generatore termico;"),
    C("Dichiarazione di Conformità al D.M. 37/08 dell’impianto elettrico¹:", sotto("impianto elettrico")),
    C("Dichiarazione di Conformità alle norme UNI 9615 per camini eventualmente intubati¹;",
      ["Progetto e dimensionamento camino;", "Schema camino;", "Relazione con la tipologia dei materiali;", "Requisiti tecnico professionali dell’impresa esecutrice."]),
    C("Dichiarazione di conformità alla regola d’arte dell’impianto adduzione gas¹:", sotto("impianto adduzione gas", n3=False)),
    C("Prova di tenuta tubazione adduzione gas metano;"),
    C("Dichiarazione di conformità alla regola d’arte dell’impianto rivelazione gas;"),
    C("Dichiarazione di conformità di bonifica serbatoio;", predefinita=False),
    C("Dichiarazioni di conformità di valvole d’intercettazione, pressostati e vasi d’espansione;"),
    C("Certificato d’inertizzazione del serbatoio;", predefinita=False),
    C("Certificato sostitutivo dichiarazione rispondenza strutture alla classe REI;"),
    C("Dichiarazione di Conformità e Omologazione degli estintori presenti;"),
    C("Contratto di manutenzione presidi mobili (estintori) con apposita ditta;"),
    C("Messa a terra;"),
    C("Denuncia impianto I.N.A.I.L. (ex I.S.P.E.S.L.)."),
  ],
}

f77 = {
  "id": "77", "nome": "Edifici di civile abitazione", "zonaComputo": "Edificio di civile abitazione:",
  "unitaDato": "m", "etichettaDato": "Altezza antincendio",
  "modelloScopo": "Edifici destinati ad uso civile con altezza antincendio pari a {dato} m",
  "regoleTecniche": [
    {"etichetta": "D.M. 16/05/1987 n° 246", "testo": "Approvazione della regola tecnica di prevenzione incendi per la progettazione, la costruzione di “edifici civili aventi altezza antincendio > di 24 m.” D.M. 16/05/1987 n°246."},
    {"etichetta": "D.M. 25/01/2019", "testo": "“Modifiche ed integrazioni all’allegato del decreto 16/05/1987, n. 246 concernente norme di sicurezza antincendi per gli edifici di civile abitazione” – D.M. 25/01/2019."},
  ],
  "sezioni": [
    {"id": "77-vs", "titolo": "Vano scala", "voci": [
      V("77-vs-aer-ok", "Aerazione in sommità presente",
        "Al momento del sopralluogo è stata rilevata la presenza dell’aerazione permanente in sommità del vano scala.",
        "Apertura di aerazione del vano scala."),
      V("77-vs-aer-no", "Aerazione in sommità assente: rimozione vetri",
        "Al momento del sopralluogo non è stata rilevata la presenza dell’aerazione permanente in sommità del vano scala. Sarà necessario provvedere alla rimozione degli infissi vetrati presenti fino al raggiungimento di una superfice almeno pari a 1,00 mq, condizione soddisfatta con la rimozione di almeno n°[4] vetri presenti.\nProvvedere inoltre alla fornitura e posa di griglie alettate nella porzione dell’intervento.",
        "Apertura di aerazione del vano scala.",
        [L("Rimozione vetrata vani scala.", "a corpo"), L("Fornitura e posa “alette in lamiera” per aerazione vano scala.", "a corpo")]),
      V("77-vs-aer-altezza", "Altezza antincendio e aerazione assente",
        "Nello stabile è presente n°[1] vano scala, avente altezza antincendio pari a [valore] m. Durante il sopralluogo non è stata riscontrata l’aerazione permanente presente in sommità del vano scala ≥ 1,00 m², sarà pertanto necessario provvedere alla sostituzione dei vetri della finestra sufficienti fino al raggiungimento di una superficie non inferiore ad 1 mq con protezioni metalliche alettate.",
        "Aereazione permanente.",
        [L("Rimozione vetrata vani scala.", "a corpo"), L("Fornitura e posa “alette in lamiera” per aerazione vano scala.", "a corpo")]),
      V("77-vs-porta-copertura", "Porta REI al piano copertura non in progetto",
        "Si segnala la presenza, al piano [copertura], di una porta REI non riportata nel progetto approvato, la cui presenza potrebbe ostacolare il passaggio dei fumi, in caso di incendio, verso le aperture di aerazione permanente indicate dal progetto approvato stesso. Si ritiene opportuno, prima di fornire indicazioni operative in merito a tale porta, attendere l'esito del sopralluogo e il relativo verdetto del Comando dei Vigili del Fuoco.",
        "Porta non riportata nel progetto."),
      V("77-vs-filtro-autorimessa", "Filtro a prova di fumo edificio / autorimessa da realizzare",
        "Come da progetto, sarà necessario realizzare il filtro a prova di fumo per la comunicazione tra edificio e autorimessa.",
        "Filtro a prova di fumo da realizzare.",
        [L("Realizzazione di pareti in muratura con resistenza al fuoco REI 120 per separare il filtro a prova di fumo dal resto del comparto, come da progetto approvato.", "mq"),
         L("Fornitura e posa di porta REI 120 di comunicazione tra filtro e [autorimessa], completa di dispositivo di auto chiusura, maniglione antipanico e chiusura di sopraluce e spallette con materiali aventi le stesse caratteristiche di resistenza al fuoco.", "cad"),
         L("Installazione di punti luce di emergenza e segnaletica di sicurezza all’interno del filtro.", "a corpo"),
         L("Fornitura e posa di sacchetti e/o schiuma termo - espandente a protezione degli eventuali cavi elettrici e tubazioni in corrispondenza degli attraversamenti delle pareti del filtro.", "a corpo")]),
      V("77-vs-porta-filtro-vano", "Porta filtro / vano scala da sostituire con REI 120",
        "Come da progetto, sarà necessario sostituire tale porta per la comunicazione tra il filtro e il vano scala, con una avente caratteristiche REI [120] dotata di maniglione antipanico.",
        "Porta da sostituire.",
        [L("Fornitura e posa di porta REI [120] di comunicazione tra filtro e vano scala, completa di dispositivo di auto chiusura, maniglione antipanico e chiusura di sopraluce e spallette con materiali aventi le stesse caratteristiche di resistenza al fuoco.", "cad")]),
      V("77-vs-porte-contrario", "Porte montate al contrario rispetto all’esodo",
        "Le porte indicate, quelle di collegamento [alle cantine e al vano scala], sono montate al contrario. Si chiede di montarle nel giusto verso, seguendo il senso dell'esodo come da progetto approvato.",
        "Porte montate al contrario.",
        [L("Smontaggio e rimontaggio delle porte di collegamento [alle cantine e al vano scala] con inversione del senso di apertura secondo il verso dell’esodo, compresa regolazione del dispositivo di auto chiusura e riposizionamento del maniglione antipanico.", "cad")]),
      V("77-vs-oggetti", "Oggetti lungo le vie d’esodo",
        "È vietato porre qualsiasi genere di materiale lungo le vie d’esodo in modo da non creare intralcio in caso di necessità; pertanto, sarà necessario rimuovere gli oggetti nel vano scala e nei pianerottoli dal piano [copertura] al piano [terra].",
        "Oggetti da rimuovere."),
    ]},
    {"id": "77-lm", "titolo": "Locale macchine ascensore", "voci": [
      V("77-vs-lma-aer-ok", "Locale macchine ascensore: aerazione presente",
        "È stata riscontrata un’apertura d’areazione, all’interno del locale tecnico ascensore, che soddisfa i requisiti necessari (> 1 mq.) per un corretto smaltimento dei fumi in caso di incendio.",
        "Areazione presente nel locale macchine ascensore."),
      V("77-vs-lma-aer-no", "Locale macchine ascensore senza aerazione",
        "Il locale macchine ascensore è sprovvisto di areazione permanente, sostituire la finestra chiusa con una griglia d’areazione con superficie ≥1 mq.",
        "Finestra da sostituire.",
        [L("Rimozione vetrata aerazione locale macchine ascensore.", "cad"), L("Fornitura e posa “alette in lamiera” per aerazione locale macchine ascensore.", "cad")]),
      V("77-vs-lma-porta-rei30", "Porta locale macchine REI 30 (promemoria)",
        "Si ricorda che, qualora il locale macchine dell’ascensore sia direttamente comunicante con il vano scala ed entrambi siano posti all’interno del corpo dell’edificio, tale comunicazione deve avvenire tramite una porta con resistenza al fuoco non inferiore a REI 30, in conformità a quanto previsto dalla normativa antincendio per gli edifici di civile abitazione."),
      V("77-vs-lma-porta-80", "Porta e sopraluce locale macchine da sostituire (§ 8.0)",
        "La comunicazione con il locale macchine ascensore, così come previsto dal punto § 8.0 della normativa vigente, dovrà avvenire tramite porte e strutture aventi caratteristiche di resistenza al fuoco non inferiori a REI 30. Al momento del sopralluogo la porta ed il sopraluce non rispettavano tali caratteristiche, pertanto, sarà necessario provvedere alla sostituzione della porta con modello avente caratteristiche di resistenza al fuoco almeno pari a REI 30 e provvisto del dispositivo di autochiusura, e la chiusura del sopraluce con materiali aventi caratteristiche di resistenza al fuoco almeno pari a REI 30.",
        "Porta di accesso al locale macchine ascensore.",
        [L("Rimozione porte locali ascensori non a norma, compreso sopraluce.", "cad"),
         L("Fornitura e posa porta REI 30 di accesso al locale macchine ascensore, dimensioni [65 cm x 200 cm] filo muro, in sostituzione dell’esistente, completa di dispositivo di autochiusura e assistenza muraria.", "cad"),
         L("Chiusura del sopraluce del locale macchine ascensore con materiali aventi caratteristiche di resistenza al fuoco REI 30.", "a corpo"),
         L("Tinteggiature aree oggetto d’intervento.", "a corpo", False)]),
      V("77-vs-lma-porta-metallica", "Porta metallica locale macchine da sostituire",
        "La porta metallica di accesso al locale macchina ascensore, comunicante con il vano scala, andrà sostituita con una porta tagliafuoco avente proprietà ≥ REI30 per garantire la giusta compartimentazione del locale in caso di incendio.",
        "Porta da sostituire.",
        [L("Rimozione porte non a norma del locale macchine ascensore.", "cad"),
         L("Fornitura e posa porte REI 30, compresa assistenza muraria.", "cad"),
         L("Tinteggiature aree oggetto d’intervento.", "a corpo", False)]),
      V("77-lm-porta-terrazza", "Porta non conforme ma accesso da terrazza (nessuna sostituzione)",
        "Il locale macchine [dei due ascensori], ubicato al piano [sottotetto], presenta una porta di accesso non conforme al progetto approvato. Poiché l'accesso avviene da terrazza a cielo aperto, si ritiene non necessaria la sostituzione dell'infisso ai fini dell'adeguamento.",
        "Porta accesso locale ascensore."),
      V("77-lm-aer-naturale", "Aerazione naturale permanentemente aperta",
        "Al momento del sopralluogo, il locale macchine ascensore risultava dotato di apertura per l’aerazione naturale permanentemente aperta.",
        "Aereazione permanente, locale ascensore."),
    ]},
    {"id": "77-me", "titolo": "Mezzi di estinzione", "voci": [
      V("77-me-rete", "Rete idranti: colonna montante e requisiti",
        "Il vano scala è dotato di rete idranti costituita da una colonna montante dal piano [rialzato] al piano [ottavo]. Gli idranti dovranno essere provvisti di tubazione flessibile lunga 20 m in nylon UNI 45 e lancia d’erogazione UNI 45 mm, corredati da apposita cartellonistica di ampiezza sufficiente per consentirne un’immediata individuazione. L’impianto sarà collegato direttamente all’acquedotto comunale e tenuto costantemente sotto pressione. Inoltre, lo stesso dovrà garantire una pressione di 2 BAR ed una portata non inferiore ai 120 l/min. misurati all’idrante idraulicamente più sfavorito in condizioni di altimetria e distanza, con la contemporanea apertura dei 2 idranti idraulicamente più sfavoriti.",
        "Alcuni idranti presenti nel vano scala."),
      V("77-me-rete-piani", "Rete idranti con idranti a piani alterni",
        "Il vano scala è dotato di rete idranti costituita da una colonna montante con idranti presenti ai piani [rialzato, 1°, 3°, 5°, 6° e 7°]. Ogni idrante dovrà possedere tubazione flessibile lunga 20 m in nylon UNI 45 e lancia d’erogazione UNI 45 mm corredati da apposita cartellonistica di ampiezza sufficiente per consentirne un’immediata individuazione.\nL’impianto dovrà garantire una pressione di 2 BAR ed una portata non inferiore ai 120 l/min. per ogni idrante per un tempo di 30 min., con l’apertura dell’idrante nelle condizioni più sfavorevoli di distanza.",
        "Alcuni idranti."),
      V("77-me-idranti-mancanti", "Idranti mancanti da installare",
        "È altresì necessario procedere, in conformità con il progetto, all’installazione degli idranti mancanti ai piani [primo e terzo], al fine di garantire la sicurezza e il rispetto delle normative vigenti."),
      V("77-me-prova", "Prova di pressione non eseguita",
        "Durante il sopralluogo non è stato possibile eseguire la prova di pressione dell’impianto idrico antincendio.\nSarà necessario effettuare la verifica di efficienza dell’impianto, rilevando la pressione residua al bocchello della lancia in condizioni più sfavorevoli per altimetria e distanza.\nL’esito della prova dovrà garantire una portata di 120 l/m necessari, ovvero una pressione pari almeno a 2 bar, con la contemporanea apertura dei due presidi idraulicamente più sfavoriti.\nQualora la prova darà esito negativo sarà necessario effettuare ulteriori verifiche da parte di un impiantista al fine di definire le eventuali lavorazioni da eseguire, ad oggi impossibili da prevedere e computare."),
      V("77-me-prova-negativa", "Prova idrostatica con esito negativo",
        "Durante il sopralluogo è stata eseguita la prova idrostatica, la quale ha avuto esito negativo.",
        "Pressione minore di 2 BAR."),
      V("77-me-manichette", "Manichette obsolete, senza manutenzione",
        "Al momento del sopralluogo le manichette si presentavano obsolete, prive del collaudo e della manutenzione semestrale da parte dell’impresa manutentrice.\nSi provveda pertanto alla loro sostituzione, ovvero al collaudo delle stesse.",
        "Manichette scadute e manutenzione semestrale assente."),
      V("77-me-attacco", "Attacco di mandata per motopompa VV.F.",
        "Completa l’impianto antincendio n. 1 attacco di mandata per motopompa dei VV.F., posto [nei pressi dell’entrata del passo carrabile], corredato da idonea cartellonistica conforme D.lgs. 81/08[, da porre fuori dalla cassetta per una più rapida individuazione, e da cartellino di manutenzione semestrale].",
        "Attacco di mandata per motopompa VV.F."),
      V("77-me-attacco-unico", "Attacco UNI 70 a servizio di più colonne",
        "A completare l’impianto idrico antincendio è presente n°1 attacco di mandata per autopompa dei VV.F. di tipo UNI 70, posto a servizio di entrambe le colonne montanti. Corredarlo di cartellonistica conforme al D.lgs. 81/08.",
        "Attacco di mandata per motopompa."),
      V("77-me-attacco-safecrash", "Attacco autopompa con vetro safe crash",
        "È stata verificata la presenza dell’attacco autopompa posto al piano [rialzato] dotato di vetro safe crash.",
        "Attacco autopompa."),
      V("77-me-safecrash-danneggiati", "Idranti con vetro safe crash danneggiato",
        "In ciascuno dei vani scala sono presenti idranti UNI 45 con lancia d’erogazione UNI 45 corredati da apposita cartellonistica. In fase di sopralluogo sono stati riscontrati presidi che presentavano il vetro “safe crash” danneggiato o mancante nel corpo scale [A]: si provveda alla sostituzione dei vetri.",
        "Presidio con vetro safe crash rotto.", [L("Sostituzione vetri safe crash entro cassette idranti UNI 45.", "cad")]),
      V("77-me-uni10779", "Promemoria UNI 10779 (manutenzione idranti)", UNI10779),
    ]},
    {"id": "77-cs", "titolo": "Cartelli e segnaletica di sicurezza", "voci": [
      V("77-cs-vie", "Cartellonistica vie d’esodo a ogni piano",
        "Si provveda all’installazione dell’apposita cartellonistica indicante i percorsi e le vie d’esodo ad ogni piano del vano scala [dall’ottavo al piano rialzato].",
        "Segnaletica via di fuga da installare.",
        [L("Fornitura e posa nuova cartellonistica di segnalazione vie d’esodo, [dall’ottavo piano al piano terra].", "cad")]),
      V("77-cs-presidi", "Presidi da corredare di cartellonistica",
        "Si provveda a corredare i presidi con cartellonistica conforme al D.lgs. 81/08.",
        "", [CARTELLONISTICA]),
    ]},
    {"id": "77-lt", "titolo": "Porte dei locali tecnici (contatori, autoclave, solai)", "voci": [
      V("77-lt-porta-contatori", "Porta locale contatori da sostituire (EI 120)",
        "Al fine di garantire la compartimentazione del locale contatori, sarà necessario sostituire la porta in ferro grigliata con modello tagliafuoco EI 120, inoltre sarà necessario procedere con la chiusura della parte superiore del muro in quanto comunicante con il locale.",
        "Porta del locale contatori.",
        [L("Rimozione porta grigliata in ferro del locale contatori.", "cad"),
         L("Fornitura e posa porta tagliafuoco EI 120, dimensioni minime [80 cm x 205 cm].", "cad"),
         L("Chiusura della parte superiore del muro e dei sopraluci con materiali aventi caratteristiche di resistenza al fuoco EI 120.", "a corpo")]),
      V("77-lt-porta-autoclave", "Porta locale autoclave da sostituire (EI 120)",
        "Si provveda a sostituire il serramento di accesso del locale autoclave in quanto non resistente al fuoco come prescritto dal parere di conformità condizionato. La nuova porta, avente stesse dimensioni di quella esistente, dovrà possedere caratteristiche di resistenza al fuoco non inferiori a EI 120.",
        "Porta di accesso al locale autoclave.",
        [L("Rimozione portone del locale autoclave.", "cad"),
         L("Fornitura e posa portone tagliafuoco EI 120, dimensioni come esistenti, dotato di congegno di autochiusura e cilindretto.", "cad"),
         L("Chiusura del sopraluce del portone con materiali EI 120.", "a corpo")]),
      V("77-lt-porta-solaio", "Porte locali solaio e macchine ascensore da sostituire (EI 120)",
        "Al momento del sopralluogo le porte dei locali macchine ascensori e solai sui [tre] vani scale risultavano non conformi alle normative vigenti in materia di prevenzione incendi; pertanto sono da sostituire con porte tagliafuoco aventi caratteristiche di resistenza al fuoco EI 120.",
        "Porte locali solaio e locale macchine ascensore.",
        [L("Rimozione porte dei locali solaio e macchine ascensore.", "cad"),
         L("Fornitura e posa porta tagliafuoco EI 120, dimensioni foro muro [80 x 210 cm].", "cad"),
         L("Tinteggiature aree oggetto d’intervento.", "a corpo", False)]),
      V("77-lt-solaio-estintori", "Piano solaio: estintori da integrare",
        "Si provveda ad integrare n° [2] estintori nel piano solaio: n° 1 estintore a biossido di carbonio CO2 in prossimità della centralina TV e delle derivazioni elettriche; n° 1 estintore a polvere nella zona di ingresso.",
        "Piano solaio.", [L("Fornitura e posa estintore a biossido di carbonio CO2.", "cad"), L("Fornitura e posa estintore in polvere da 6 KG.", "cad")]),
      V("77-lt-solaio-cartelli", "Piano solaio: cartelli di divieto e passaggi ribassati",
        "Si provveda a segnalare, mediante idonea cartellonistica, il divieto di deposito di sostanze infiammabili e i passaggi di altezza ridotta.",
        "Piano solaio.", [CARTELLONISTICA]),
    ]},
  ],
  "certificazioni": [
    C("Certificazione dell’impianto idrico antincendio (rete idranti) redatto da professionista abilitato¹;", sotto("impianto idrico")),
    C("Dichiarazione di Conformità al D.M. 37/08 dell’impianto elettrico¹;", sotto("impianto elettrico")),
    C("Dichiarazione di Conformità e Omologazione degli estintori, idranti presenti, corredati delle verifiche semestrali obbligatorie ai sensi della UNI EN 671-3;"),
    C("Contratto di manutenzione presidi fissi (idranti) e mobili (estintori) con apposita ditta."),
    C("Certificazione porte REI;"),
    C("Dichiarazione di corretta posa da parte della ditta installatrice delle porte REI."),
  ],
}

f75 = {
  "id": "75", "nome": "Autorimesse", "zonaComputo": "ATTIVITA’ {codice}",
  "unitaDato": "mq", "etichettaDato": "Superficie",
  "modelloScopo": "Autorimessa privata, con superficie pari a {dato} mq",
  "introduzione": "L’autorimessa oggetto di relazione si sviluppa su [un unico piano a quota – x,xx m al di sotto della quota stradale]. La stessa ha una superficie di compartimento pari a [valore] mq, con capacità ricettiva totale pari a n° [numero] autovetture, suddivise in n° [numero] box e n° [numero] posti auto.",
  "regoleTecniche": [
    {"etichetta": "D.M. 01/02/1986", "testo": "“Norme di sicurezza antincendio per la costruzione e l’esercizio di autorimesse e simili” – D.M. 01/02/1986."},
    {"etichetta": "D.M. 03/08/2015 e s.m.i.", "testo": "“Norme di sicurezza antincendio per la costruzione e l’esercizio di autorimesse e simili” ai sensi della specifica regola tecnica – Capitolo V6 – D.M. 03/08/2015 e s.m.i."},
  ],
  "sezioni": [
    {"id": "75-fv", "titolo": "Filtri vani scala", "voci": [
      V("75-fv-realizzare", "Filtri da realizzare",
        "Al fine di garantire la corrispondenza dello stato dei luoghi al progetto approvato sarà necessario realizzare n°[4] filtri di collegamento tra i vani scala e l’autorimessa.\nI suddetti filtri dovranno essere realizzati con materiali in grado di garantire caratteristiche di resistenza al fuoco almeno pari a REI [60].",
        "Filtro vano scala [A]."),
      V("75-fv-esistenti", "Filtri esistenti: verifica porte e autochiusure",
        "L’autorimessa è compartimentata dagli edifici di civile abitazione soprastanti [e dall’autorimessa adiacente] per mezzo di filtri a prova di fumo. Le porte di comunicazione devono garantire la corretta compartimentazione dei locali. Si provveda a contattare la ditta manutentrice per verificare l’efficienza delle stesse, prevedendo il ripristino dei dispositivi di autochiusura non funzionanti.\nSi evidenzia che, qualora l’amministrazione non fosse in possesso delle dichiarazioni attestanti le caratteristiche di resistenza al fuoco delle porte sarà possibile reperirle, mediante un pagamento, presso la ditta produttrice.",
        "Stralcio progetto.", [L("Ripristino dispositivi di autochiusura.", "cad")]),
      V("75-fv-porta-guaina", "Porta REI priva di guaina termo-espandente",
        "Al momento del sopralluogo la porta di collegamento tra il corsello ed il vano scala [A], sebbene fosse REI e costantemente revisionata da parte della ditta manutentrice non sembrava essere in ottimo stato in quanto completamente priva della guaina termo – espandente. Si provveda alla sostituzione della stessa con un modello simile avente caratteristiche di resistenza al fuoco non inferiori a REI [60].",
        "Porta di accesso al filtro – vano scala [A].", [RIM_PORTE, PORTA_REI]),
      V("75-fv-porta-verniciata", "Porta REI verniciata (guaina coperta)",
        "Al momento del sopralluogo la porta di collegamento tra [il corsello ed il vano scala C], sebbene fosse REI e costantemente revisionata da parte della ditta manutentrice non sembrava essere in ottimo stato.\nLa porta è stata verniciata con una pittura che ha coperto la guaina termo-espandente, non garantendone più le prestazioni di reazione al fuoco ed ha inoltre cancellato le informazioni del produttore per poter risalire alle dichiarazioni di conformità.\nSi provveda pertanto alla sostituzione della stessa con un modello simile avente caratteristiche di resistenza al fuoco non inferiori a REI [60].",
        "Porta di accesso al filtro – vano scala [C].", [RIM_PORTE, PORTA_REI]),
      V("75-fv-aerazione-ostruita", "Aerazione del filtro ostruita",
        "Si ricorda di mantenere libera l’aerazione del filtro, evitando qualsiasi ostruzione, al fine di assicurare il rispetto delle condizioni di sicurezza e di conformità normativa.",
        "Aerazione ostruita.",
        [L("Rimozione ostruzione dell’aerazione del filtro vano scala [B].", "a corpo")]),
      V("75-fv-porta-locale", "Porta di locale tecnico interna al filtro",
        "La porta di accesso al [locale contatori], essendo all’interno del filtro da realizzare dovrà essere sostituita con modello avente caratteristiche di resistenza al fuoco non inferiori a REI [60].",
        "Porta di accesso al [locale contatori].", [RIM_PORTE, PORTA_REI]),
      V("75-fv-porta-nuova", "Nuova porta REI e chiusura sopraluce",
        "Al fine di realizzare il suddetto filtro sarà necessario installare una porta avente caratteristiche almeno pari a REI [60], prevedendo alla chiusura del sopraluce con materiali aventi le medesime caratteristiche di resistenza al fuoco.",
        "Porta REI da installare.", [PORTA_REI]),
      V("75-fv-senso-fuga", "Porta apribile nel senso di fuga (dislivello)",
        "La porta dovrà essere apribile nel senso di fuga, pertanto essendo presente un lieve dislivello, sarà necessario installarla immediatamente dopo il gradino presente.",
        "Porta REI da installare."),
      V("75-fv-porta-ferro", "Porta in ferro filtro – vano scala da sostituire",
        "La porta in ferro di collegamento tra il filtro ed il vano scala [C] dovrà essere sostituita con modello avente caratteristiche di resistenza al fuoco non inferiore a REI [60]. Si provveda inoltre alla chiusura del sopraluce con materiale avente le medesime caratteristiche di resistenza al fuoco.",
        "Porta di collegamento con il vano scala [C].", [RIM_PORTE, PORTA_REI]),
      V("75-fv-pvc-collari", "Tubazioni in PVC nel filtro: collari",
        "La porzione del vano scala [A], dove verrà realizzato il filtro, è attraversata da tubazioni in PVC. Sarà necessario proteggere le stesse con collari termo – espandenti nella porzione di attraversamento del sopraluce da realizzare.",
        "Tubazioni passanti nel filtro.", [COLLARI]),
      V("75-fv-pvc-cartongesso", "Tubazione in PVC nel filtro: cartongesso REI",
        "Al momento del sopralluogo è stata riscontrata la presenza di un tratto di tubazione in PVC passante all’interno del filtro del vano scala [C]. Sarà necessario provvedere alla compartimentazione dello stesso mediante cartongesso avente caratteristiche di resistenza al fuoco non inferiori a REI [60].",
        "Tubazione in PVC passante nel filtro scala [C]."),
      V("75-fv-griglia-lma", "Griglia locale macchine ascensore sul corsello",
        "Il locale macchine ascensore è provvisto di una griglia di aerazione sfociante nel corsello. Al fine di garantire la corretta compartimentazione dell’autorimessa sarà necessario provvedere alla sostituzione della stessa con griglia in materiale termo – espandente avente le medesime dimensioni ([95 cm x 50 cm]).",
        "Aerazione locale macchine ascensore.",
        [L("Rimozione griglia di aerazione del locale macchine ascensore.", "a corpo"),
         L("Fornitura e posa di griglia termo – espandente per l’aerazione del locale macchine ascensore (dimensioni [0,95 m x 0,50 m]), compresa assistenza muraria.", "a corpo")]),
    ]},
    {"id": "75-ar", "titolo": "Autorimessa", "voci": [
      V("75-ar-griglia-ascensore", "Griglia di aerazione del locale ascensore sul corsello",
        "I locali macchine ascensore sono provvisti di una griglia di aerazione sfociante nel corsello. Al fine di garantire la corretta compartimentazione dell’autorimessa sarà necessario provvedere alla sostituzione della stessa con griglia antincendio avente le medesime dimensioni, ovvero provvedere alla sua completa chiusura con materiale avente resistenza al fuoco non inferiore a REI 120.",
        "Aerazione sfociante sul corsello.",
        [L("Fornitura e posa griglia antincendio [Scala A], dimensioni [43x26] cm, compresa assistenza muraria.", "cad")]),
      V("75-ar-griglie", "Griglie di aerazione presenti",
        "È stata accertata la presenza delle griglie di aerazione dell’autorimessa come previsto dalla normativa vigente.",
        "Griglie di aerazione."),
      V("75-ar-corrimano", "Scala e rampa d’esodo: corrimano",
        "La scala e la rampa utilizzate come percorso d’esodo fino a luogo sicuro definitivo, dovranno essere dotate di corrimano laterale, come prescritto al punto S.4.5.4 del D.M. 03/08/2015.",
        "Vie d’esodo."),
      V("75-ar-cancello", "Cancello del passo carrabile apribile nel senso di fuga",
        "Il cancello situato all'inizio del passo carrabile e destinato anche all'esodo di emergenza dovrà aprirsi nel senso di fuga, in conformità ai requisiti previsti per le vie di esodo.",
        "Porta d’esodo rampa carrabile."),
      V("75-ar-portone", "Portone tagliafuoco non più necessario",
        "A seguito del progetto, presentato al Comando Provinciale dei VV.F. di [Milano], la presenza del portone tagliafuoco avente classe di resistenza al fuoco pari a REI [120] non risulta più necessaria. Si provveda pertanto alla rimozione del dispositivo.",
        "Portone tagliafuoco."),
      V("75-ar-plafoni", "Plafoni ammalorati con ferri scoperti",
        "I plafoni dell’autorimessa, in alcune zone localizzate, si presentavano deteriorati, lasciando scoperti i ferri dell’armatura. Si provveda pertanto a risanare le strutture in modo da garantire la resistenza al fuoco non inferiore a REI [90], oltre che la loro stabilità.",
        "Plafone ammalorato."),
      V("75-ar-pvc-collari", "Tubazioni in PVC cantine / retro box: collari",
        "È stata riscontrata la presenza di tubazioni in PVC passanti all’interno dei corridoi delle cantine/retro dei box. Al fine di garantire la corretta compartimentazione dell’autorimessa sarà necessario provvedere alla posa di collari termo – espandenti in corrispondenza degli attraversamenti delle tubazioni in PVC nelle murature dal lato interno dei box.",
        "Tubazioni in PVC passanti nelle murature.", [COLLARI]),
      V("75-ar-foro", "Foro da chiudere con materiali REI",
        "Si provveda inoltre alla chiusura del foro presente nel [corridoio delle cantine] con materiali aventi caratteristiche di resistenza al fuoco non inferiori a REI [60].",
        "Foro presente nel corridoio cantine.",
        [L("Chiusura foro nella muratura retro box / cantine con materiali REI [60].", "a corpo"),
         L("Chiusura forometrie per garantire la compartimentazione al fuoco del comparto autorimessa.", "cad", False)]),
      V("75-ar-posacenere", "Posacenere da rimuovere (divieto di fumo)",
        "Si ricorda che nell’autorimessa è severamente vietato fumare. Si provveda a rimuovere il posacenere ed il cartello correlato.",
        "Posacenere.", [L("Rimozione posacenere.", "cad")]),
      V("75-ar-attacco-nuovo", "Attacco autopompa UNI 70 da installare",
        "Dovrà essere installato un attacco autopompa UNI 70, internamente in prossimità dell’entrata del passo carrabile, correlato da apposito cartello d’identificazione, a servizio esclusivo dell’autorimessa, ben visibile e facilmente raggiungibile. Sarà cura del manutentore dell’impianto, accertarsi della presenza del disconnettore e filtro idraulico come da normativa vigente.",
        "Entrata passo carrabile."),
      V("75-ar-rete-requisiti", "Rete idranti: requisiti di pressione e portata",
        "L’impianto sarà collegato direttamente all’acquedotto comunale e tenuto costantemente sotto pressione. Inoltre, lo stesso dovrà garantire una pressione di 2 BAR ed una portata non inferiore ai 120 l/min. misurati all’idrante idraulicamente più sfavorito in condizioni di altimetria e distanza, con la contemporanea apertura dei 2 idranti idraulicamente più sfavoriti."),
      V("75-ar-coibentazione", "Tubazioni della rete idranti da coibentare",
        "Sarà necessaria la coibentazione delle tubazioni scoperte presenti in autorimessa, per evitare che, in basse temperature, l’acqua al suo interno congeli, impossibilitando in caso di incendio il corretto funzionamento degli idranti.",
        "Tubazioni da coibentare."),
    ]},
    {"id": "75-ds", "titolo": "Dispositivi di sicurezza", "voci": [
      V("75-ds-estintori", "Estintori: numero e requisiti",
        "Al momento del sopralluogo sono stati riscontrati n°[11] estintori.\nTali dispositivi di sicurezza devono possedere capacità estinguente non inferiore a [13 A – 233 B], essere corredati da apposita cartellonistica di ampiezza sufficiente per consentirne un’immediata individuazione e da cartellino relativo alle manutenzioni semestrali obbligatorie ai sensi del D.lgs. 81/08.",
        "Alcuni degli estintori presenti.", [L("Fornitura e posa estintore in polvere da 6 KG.", "cad", False)]),
      V("75-ds-estintori-progetto", "Estintori: numero minimo da progetto",
        "Il numero degli estintori presenti nell’autorimessa non dovrà mai essere inferiore a n°[8], come previsto dal progetto approvato. Al momento del sopralluogo è stata riscontrata la presenza di n°[19] presidi.",
        "Alcuni estintori presenti nel corsello box."),
      V("75-ds-manutenzione-ok", "Presidi con manutenzione semestrale",
        "Al momento del sopralluogo, i presidi si presentavano provvisti di manutenzione semestrale obbligatoria.",
        "Cartellini di manutenzione."),
      V("75-ds-manutenzione-ok-2", "Estintori e idranti correttamente manutenuti",
        "Durante il sopralluogo, è stata riscontrata la corretta manutenzione semestrale di estintori e idranti.",
        "Estintori e idranti mantenuti correttamente."),
      V("75-ds-idranti", "Rete idranti: numero di idranti",
        "L’impianto idrico antincendio è costituito da n° [5] idranti, inseriti in apposite cassette con vetro trasparente tipo “safe – crash”, corredati di manichette e lance erogatrici mantenute costantemente collegate.",
        "Alcuni idranti a muro UNI 45 presenti nel corsello."),
      V("75-ds-idranti-requisiti", "Idranti: requisiti idraulici",
        "Ogni idrante dovrà possedere tubazione flessibile lunga [20 m] in nylon UNI 45 e lancia d’erogazione UNI [45] corredati da apposita cartellonistica di ampiezza sufficiente per consentirne un’immediata individuazione. L’impianto dovrà inoltre possedere caratteristiche idrauliche tali da garantire al bocchello della lancia, nelle condizioni più sfavorevoli di altimetria e di distanza, una portata non inferiore ai 120 l/min primo ed una pressione di almeno 2,0 BAR ed essere dimensionato per una portata totale determinata considerando la probabilità di contemporaneo funzionamento [di N. 2 idranti / del 50% degli idranti]."),
      V("75-ds-uni10779", "Promemoria UNI 10779 (manutenzione manichette)",
        "Si rammenta, inoltre, che la norma UNI 10779-2014 – RETE IDRANTI – stabilisce che:\n"
        "- La manutenzione degli idranti a muro deve essere svolta almeno due volte all’anno, in conformità alla UNI EN 671-3, da personale competente e qualificato.\n"
        "- Tutte le manichette devono essere verificate annualmente sottoponendole alla pressione di rete per verificarne l’integrità.\n"
        "- In ogni caso, ogni 5 anni deve essere eseguita la prova idraulica delle manichette (12 bar) come previsto dalla UNI EN 671-3. Se la prova dà esito positivo non vi è l’obbligo di sostituire la manichetta."),
      V("75-ds-manichette", "Manichette prive di manutenzione",
        "Al momento del sopralluogo le manichette risultavano tuttavia prive di manutenzione e/o collaudo.\nSi provveda a contattare la ditta manutentrice dei presidi per effettuare le verifiche necessarie.",
        "Manichette scadute."),
      V("75-ds-attacchi", "Attacchi di mandata per motopompa presenti",
        "Completa l’impianto n° [1] attacco di mandata per motopompa dei VV.F. di tipo UNI 70 posto [nei pressi della rampa carrabile di accesso all’autorimessa].",
        "Attacco di mandata per motopompa."),
      V("75-ds-attacco-ammalorato", "Attacco motopompa ammalorato / senza cartellino",
        "Al momento del sopralluogo il presidio si presentava sprovvisto di cartellino di manutenzione semestrale ed ammalorato. Contattare la ditta manutentrice per provvedere al suo corretto mantenimento. Corredarlo di idonea cartellonistica conforme al D.lgs. 81/08 per una più rapida individuazione.",
        "Attacco di mandata per motopompa."),
    ]},
    {"id": "75-cs", "titolo": "Cartelli e segnaletica di sicurezza", "voci": [
      V("75-cs-integrare", "Integrare cartellonistica vie d’esodo",
        "Si provveda ad integrare la cartellonistica, conforme al D.lgs 81/08, indicante le vie d’esodo ed il relativo percorso per raggiungerle.",
        "Corsello box.", [CARTELLONISTICA]),
      V("75-cs-installare", "Segnaletica da installare lungo le vie d’esodo",
        "Sarà necessaria l’installazione della segnaletica di sicurezza lungo le vie d’esodo.",
        "Segnaletica da installare.", [CARTELLONISTICA]),
      V("75-cs-sgancio", "Pulsante di sgancio da segnalare",
        "È stata riscontrata la presenza del pulsante di sgancio. Si provveda a corredarlo di idonea cartellonistica conforme al D.lgs. 81/08.",
        "Pulsante di sgancio.", [CARTELLONISTICA]),
    ]},
  ],
  "certificazioni": [
    C("Dichiarazione di Conformità dell’impianto idrico antincendio (rete idranti) redatto da professionista abilitato:", sotto("impianto idrico", False, False)),
    C("Dichiarazione di Conformità al D.M. 37/08 dell’impianto elettrico:", sotto("impianto elettrico", False, False)),
    C("Dichiarazione di Conformità dell’impianto rilevazione fumi:", sotto("impianto elettrico", False, False), predefinita=False),
    C("Dichiarazione di Conformità dell’impianto di sovrappressione e di corretta posa in opera;", predefinita=False),
    C("Dichiarazione di Conformità dell’impianto di rilevazione fumo/calore (RFC) collegato ai portoni REI;", predefinita=False),
    C("Dichiarazione di Conformità e Omologazione degli estintori, idranti presenti, corredati delle verifiche semestrali obbligatorie ai sensi della UNI EN 671-3;"),
    C("Contratto di manutenzione presidi fissi (idranti) e mobili (estintori) con apposita ditta;"),
    C("Dichiarazione di Conformità dei prodotti utilizzati per ripristinare le caratteristiche REI di eventuali pareti o tubazioni (intonaci ignifughi, malte e cartongessi REI, …);"),
    C("Dichiarazione di corretta posa in opera da parte dell’installatore dei prodotti;"),
    C("Dichiarazione di Conformità dei materiali utilizzati per realizzazione di opere edili (gasbeton, cartongesso REI, …);"),
    C("Dichiarazione di corretta posa in opera da parte dell’installatore delle opere edili;"),
    C("Dichiarazione di Conformità dei collari termo-espandenti avente caratteristiche REI di eventuali tubazioni presenti all’interno dell’autorimessa;", predefinita=False),
    C("Dichiarazione di corretta posa in opera da parte dell’installatore dei collari termo-espandenti;", predefinita=False),
    C("Certificazione porte REI;"),
    C("Dichiarazione di conformità da parte della ditta installatrice delle porte REI."),
    C("Dichiarazione di conformità da parte della ditta installatrice dei maniglioni antipanico sulle porte REI.", predefinita=False),
  ],
}

libreria = {
  "versione": 2,
  "attivita": [
    {"codice": "74.1.A", "descrizione": "Impianti per la produzione di calore alimentati a combustibile solido, liquido o gassoso con potenzialità superiore a 116 kW (fino a 350 kW)"},
    {"codice": "74.2.B", "descrizione": "Impianti per la produzione di calore alimentati a combustibile solido, liquido o gassoso con potenzialità superiore a 350 kW (fino a 700 kW)"},
    {"codice": "74.3.C", "descrizione": "Impianti per la produzione di calore alimentati a combustibile solido, liquido o gassoso con potenzialità superiore a 700 kW"},
    {"codice": "75.1.A", "descrizione": "Autorimesse pubbliche e private, parcheggi pluriplano e meccanizzati, con superficie compresa tra 300 mq e 1.000 mq"},
    {"codice": "75.2.B", "descrizione": "Autorimesse pubbliche e private, parcheggi pluriplano e meccanizzati, con superficie compresa tra 1.000 mq e 3.000 mq"},
    {"codice": "75.4.C", "descrizione": "Autorimesse pubbliche e private, parcheggi pluriplano e meccanizzati, con superficie superiore a 3.000 mq"},
    {"codice": "77.1.A", "descrizione": "Edifici destinati ad uso civile, con altezza antincendio superiore a 24 m. (fino a 32 m)"},
    {"codice": "77.2.B", "descrizione": "Edifici destinati ad uso civile, con altezza antincendio superiore a 32 m. (fino a 54 m)"},
    {"codice": "77.3.C", "descrizione": "Edifici destinati ad uso civile, con altezza antincendio superiore a 54 m. (fino a 80 m)"},
  ],
  "famiglie": [f74, f75, f77],
  "umOptions": ["a corpo", "cad", "mq", "ml", "kg", "h"],
  "lavorazioniComuni": [
    L("Trasporto materiali di qualsiasi natura all’esterno del fabbricato e conferimento alle P.P.D.D.", "a corpo"),
    L("Fornitura e posa nuova cartellonistica.", "cad"),
    L("Fornitura e posa maniglione antipanico su uscita di emergenza.", "a corpo"),
    L("Fornitura e posa estintore in polvere da 6 KG.", "cad"),
    L("Tinteggiature aree oggetto d’intervento.", "a corpo"),
    L("Apprestamento di cantiere, copertura a protezione dell’impianto termico, formazione piani di lavoro e pulizia finale.", "a corpo"),
    L("Fornitura e posa collari termoespandenti EI 120 su tubazioni combustibili.", "cad"),
    L("Chiusura forometrie con materiali certificati EI 120.", "a corpo"),
  ],
  "cartelliSuggeriti": [
    "cartelli da applicare in tutti i piani [dall’ottavo al piano rialzato]",
    "cartello da applicare nei pressi della scala che porta all’uscita del condominio",
    "cartelli da applicare in prossimità di ciascuna rampa di scale",
    "cartelli da applicare in prossimità degli idranti",
    "cartello da applicare in prossimità dell’attacco VV.F.",
    "cartello da installare nei pressi dell’attacco autopompa",
    "cartello da applicare nei pressi del pulsante di sgancio",
    "cartelli da apporre lungo il percorso d’esodo",
    "cartelli da apporre sopra le uscite d’emergenza",
    "cartelli da applicare in direzione delle uscite di emergenza",
    "cartelli da applicare in prossimità delle uscite di emergenza",
    "cartelli da applicare verso i vani scala",
    "cartelli da applicare a tutti i piani del vano scala",
    "cartelli da applicare verso l’uscita di emergenza",
    "cartelli da applicare nei pressi delle uscite di sicurezza",
  ],
  "notaBeneSuggerimenti": [
    "Si ricorda che, sarà necessario effettuare le prove di pressione e portata dell’impianto idrico antincendio per verificarne le attuali prestazioni in conformità alle vigenti normative ed eventualmente, dopo le verifiche di un impiantista, definire le lavorazioni da eseguire, ad oggi impossibili da computare.",
    "Si raccomanda di contattare la ditta manutentrice per effettuare una verifica approfondita delle condizioni attuali dei presidi antincendio.",
    "Si precisa che le lavorazioni di cui ai punti [2] e [2 bis] del computo metrico sono da considerarsi l’una alternativa dell’altra. La corretta tipologia di intervento sarà definita solo a seguito del controllo della documentazione condominiale in possesso dell’amministrazione e dal confronto con il responsabile e manutentore dell’impianto.",
    "Per la voce N. [5] si dovrà necessariamente avere accesso a tutti i box in modo tale da poter quantificare con esattezza il numero di collari necessari.",
    "Si raccomanda di contattare la ditta manutentrice per effettuare una verifica approfondita delle condizioni attuali dei presidi antincendio, in particolare a seguito dell’esito negativo della prova idrostatica riscontrata in sede di sopralluogo.",
    "Si precisa, inoltre, che eventuali ulteriori lavorazioni dovranno essere considerate come lavorazioni aggiuntive, la cui necessità potrà emergere a seguito del sopralluogo da parte del Vigile competente, che sarà effettuato ai fini dell’approvazione della SCIA.",
    "Nel computo metrico non è stata inserita la lavorazione relativa all’eliminazione delle macchine per il condizionamento presenti nel disimpegno di accesso alla centrale termica in quanto si presume siano a carico dei singoli condomini privati.",
  ],
  "testi": {
    "esposizione": "Regolamento recante disciplina dei procedimenti relativi alla prevenzione incendi, a norma dell’art. 20, comma 8, della legge 15 marzo 1997 n° 59 – D.P.R. 1° agosto 2011 n° 151.",
    "notaCertificazioni": "Per impianti non ricadenti nel campo di applicazione del D.M. 37/08 è comunque necessario fornire Dichiarazione di Conformità dell’impianto corredata da Certificazione di verifica rilasciata da tecnico iscritto ad albo professionale.",
    "noteCertificazioni": [
      "¹Nei casi in cui la dichiarazione di conformità non sia stata prodotta o non sia reperibile, per gli impianti eseguiti precedentemente all’entrata in vigore del D.M. 37/08, potrà essere prodotta dichiarazione di rispondenza ai sensi dell’art. 7, co 6, del D.M. 37/08, certificando con allegata dichiarazione le specifiche competenze del tecnico sottoscrittore, che ha esercitato l’attività professionale per 5 anni nel settore impiantistico a cui si riferisce la dichiarazione.",
      "²I progetti sulla quale vengono rilasciate le varie Dichiarazioni di conformità degli impianti alla regola d’arte, non sono documentazioni da allegare alla S.C.I.A. e da consegnare al Comando VV.F. Tuttavia, tali allegati fanno parte del fascicolo da rendere disponibile presso l’indirizzo indicato nella Segnalazione Certificata di Inizio Attività e dovranno essere esibiti qualora il personale antincendio preposto li chieda in fase di controlli.",
      "³In allegato alla dichiarazione di conformità dovrà essere sempre prodotta visura camerale dell’installatore esplicitante l’abilitazione dello stesso nel settore impiantistico cui si riferisce la dichiarazione.",
    ],
    "conclusioneCompletare": "Sarà quindi necessario completare le opere di messa a norma e produrre le dovute certificazioni.",
    "conclusioneScia": "Successivamente sarà possibile presentare la S.C.I.A. (segnalazione certificata d’inizio attività), corredata dalle certificazioni",
    "conclusioneNonAggravio": " e dalla dichiarazione di non aggravio del rischio antincendio per indicare le modifiche",
    "sanzioni": "Si precisa che la mancata e/o omessa presentazione della SCIA per tutte le attività soggette al D.P.R. 151/11, ai sensi dell’art. 20 del d.lgs. 139/06 prevede sanzioni penali a carico del Titolare dell’attività.",
    "chiusura": "Ritenendo pertanto concluso il nostro incarico e restando comunque a Vs completa disposizione per qualsiasi chiarimento, cogliamo l’occasione per porgere Distinti Saluti.",
  },
}


# Voci di computo collegate alle frasi che prescrivono un intervento (proposte: descrizione, U.M.;
# quantità e prezzi si compilano nell'app). inclusa=False = proposta ma non spuntata.
LAVORAZIONI_AGGIUNTIVE = {
  "74-ct-materiale": [L("Rimozione del materiale depositato nel locale disimpegno.", "a corpo")],
  "74-ct-condizionatori": [L("Rimozione e spostamento delle macchine per il condizionamento presenti nel locale disimpegno.", "a corpo", False)],
  "74-ds-estintore-noman": [L("Manutenzione e/o sostituzione dell’estintore a servizio della centrale termica.", "cad")],
  "74-ds-emergenza": [L("Ripristino del dispositivo di illuminazione di emergenza.", "cad")],
  "74-cf-altezza-nv": [L("Prolungamento della canna fumaria fino a quota superiore ad 1,00 m dal colmo del tetto (se necessario).", "a corpo", False)],
  "75-fv-realizzare": [L("Realizzazione di n° [4] filtri di collegamento tra i vani scala e l’autorimessa con materiali REI [60].", "a corpo")],
  "75-fv-pvc-cartongesso": [L("Compartimentazione della tubazione in PVC passante nel filtro mediante cartongesso REI [60].", "a corpo")],
  "75-ar-corrimano": [L("Fornitura e posa di corrimano laterale lungo la scala e la rampa utilizzate come percorso d’esodo.", "ml")],
  "75-ar-cancello": [L("Modifica del senso di apertura del cancello del passo carrabile secondo il verso dell’esodo.", "a corpo")],
  "75-ar-portone": [L("Rimozione del portone tagliafuoco non più necessario.", "cad")],
  "75-ar-plafoni": [L("Risanamento dei plafoni ammalorati con ripristino della resistenza al fuoco non inferiore a REI [90].", "mq")],
  "75-ar-attacco-nuovo": [L("Fornitura e posa di attacco autopompa UNI 70, completo di cartello d’identificazione.", "cad")],
  "75-ar-coibentazione": [L("Coibentazione delle tubazioni scoperte della rete idranti in autorimessa.", "ml")],
  "75-ds-manichette": [L("Verifica e collaudo delle manichette da parte della ditta manutentrice.", "a corpo")],
  "75-ds-attacco-ammalorato": [L("Manutenzione dell’attacco di mandata per motopompa e fornitura e posa del relativo cartello.", "a corpo")],
  "77-vs-oggetti": [L("Rimozione degli oggetti presenti nel vano scala e nei pianerottoli.", "a corpo")],
  "77-me-idranti-mancanti": [L("Fornitura e posa di idranti UNI 45 completi di cassetta, manichetta e lancia ai piani [primo e terzo].", "cad")],
  "77-me-manichette": [L("Sostituzione ovvero collaudo delle manichette.", "cad")],
  "77-me-prova": [L("Prova di pressione e portata dell’impianto idrico antincendio.", "a corpo")],
  "77-me-prova-negativa": [L("Verifica dell’impianto idrico antincendio da parte di un impiantista a seguito dell’esito negativo della prova idrostatica.", "a corpo")],
  "77-me-attacco": [L("Fornitura e posa cartello per attacco di mandata per motopompa VV.F.", "cad", False)],
  "77-me-attacco-unico": [L("Fornitura e posa cartello per attacco di mandata per motopompa VV.F.", "cad")],
}
for fam in libreria["famiglie"]:
  for sez in fam["sezioni"]:
    for v in sez["voci"]:
      v["lavorazioni"].extend(LAVORAZIONI_AGGIUNTIVE.pop(v["id"], []))
assert not LAVORAZIONI_AGGIUNTIVE, f"voci inesistenti: {list(LAVORAZIONI_AGGIUNTIVE)}"


# ---------------------------------------------------------------------------------------------
# Riorganizzazione delle voci (ottobre 2026): una voce di descrizione + esito + rilievi spuntabili.
# Le voci con "gruppoEsclusivo" si escludono a vicenda dentro la stessa sezione (es. esito della prova).
# I testi sono quelli delle voci precedenti, unificati dove erano quasi uguali.
# ---------------------------------------------------------------------------------------------
import copy
_tutte = {v["id"]: v for f in libreria["famiglie"] for sez in f["sezioni"] for v in sez["voci"]}
def _voce(id_vecchio, nuovo_id=None, **mod):
  v = copy.deepcopy(_tutte[id_vecchio])
  if nuovo_id: v["id"] = nuovo_id
  v.update(mod)
  return v
def _togli(famiglia, ids):
  for sez in famiglia["sezioni"]:
    sez["voci"] = [v for v in sez["voci"] if v["id"] not in ids]

REQUISITI_IDRANTI = ("Ogni idrante dovrà possedere tubazione flessibile lunga [20 m] in nylon UNI 45 e lancia d’erogazione UNI [45] mm, corredati da apposita cartellonistica di ampiezza sufficiente per consentirne un’immediata individuazione. "
  "L’impianto sarà collegato direttamente all’acquedotto comunale e tenuto costantemente sotto pressione, e dovrà garantire una pressione di 2,0 bar ed una portata non inferiore a 120 l/min misurati all’idrante idraulicamente più sfavorito, in condizioni di altimetria e distanza, "
  "con la contemporanea apertura [dei 2 idranti idraulicamente più sfavoriti / del 50% degli idranti][, per un tempo di 30 min].")
ATTACCO_BASE = "Completa l’impianto n° [1] attacco di mandata per motopompa dei VV.F. di tipo UNI 70, posto [nei pressi della rampa carrabile di accesso all’autorimessa / dell’entrata del passo carrabile]."
UNI10779_UNICO = ("Si rammenta, inoltre, che la norma UNI 10779-2014 – RETE IDRANTI – stabilisce che:\n"
  "- La manutenzione degli idranti a muro deve essere svolta almeno due volte all’anno, in conformità alla UNI EN 671-3, da personale competente e qualificato.\n"
  "- Tutte le tubazioni flessibili e semirigide (manichette) devono essere verificate annualmente sottoponendole alla pressione di rete per verificarne l’integrità.\n"
  "- In ogni caso, ogni 5 anni deve essere eseguita la prova di tenuta delle tubazioni flessibili e semirigide (12 bar) come previsto dalla UNI EN 671-3. Se la prova dà esito positivo non vi è l’obbligo di sostituire la tubazione.")
MANICHETTE = ("Al momento del sopralluogo le manichette si presentavano [obsolete,] prive del collaudo e della manutenzione semestrale da parte dell’impresa manutentrice. "
  "Si provveda pertanto alla loro sostituzione, ovvero al collaudo delle stesse, contattando la ditta manutentrice dei presidi.")
SAFECRASH = "In fase di sopralluogo sono stati riscontrati presidi che presentavano il vetro “safe crash” danneggiato o mancante nel corpo scale [A]: si provveda alla sostituzione dei vetri."
MANUT_OK = "Durante il sopralluogo è stata riscontrata la corretta manutenzione semestrale di estintori e idranti."
PROVA_POSITIVA = "Durante il sopralluogo è stata eseguita la prova di pressione e portata dell’impianto idrico antincendio, con esito positivo."

TITOLI_IDRICO = {
  "77-me-prova-negativa": "Prova di pressione e portata: esito negativo", "75-ia-prova-negativa": "Prova di pressione e portata: esito negativo",
  "77-me-prova": "Prova di pressione e portata: non eseguita", "75-ia-prova": "Prova di pressione e portata: non eseguita",
  "77-me-manichette": "Manichette obsolete o prive di manutenzione e collaudo", "75-ds-manichette": "Manichette obsolete o prive di manutenzione e collaudo",
  "77-me-attacco": "Attacco motopompa: cartellonistica da integrare", "77-me-attacco-unico": "Attacco motopompa: a servizio di più colonne",
  "77-me-attacco-safecrash": "Attacco motopompa: presente con vetro safe crash", "75-ar-attacco-nuovo": "Attacco motopompa: da installare",
  "75-ds-attacco-ammalorato": "Attacco motopompa: ammalorato o senza cartellino",
}
def _impianto_idrico(t, descrizione, didascalia, ids_proprie):
  """Voci dell'impianto idrico per il tipo t (75 o 77): descrizione, esito della prova, rilievi."""
  nuova = lambda nome: f"{t}-ia-{nome}"
  il = lambda i, n, **m: _voce(i, n, **m)
  voci = [
    V(nuova("descrizione"), "Impianto idrico antincendio: descrizione e requisiti", descrizione, didascalia),
    V(nuova("prova-positiva"), "Prova di pressione e portata: esito positivo", PROVA_POSITIVA, "Prova di pressione.", gruppoEsclusivo="esito-prova"),
    il("77-me-prova-negativa", ids_proprie.get("negativa"), gruppoEsclusivo="esito-prova"),
    il("77-me-prova", ids_proprie.get("nonEseguita"), gruppoEsclusivo="esito-prova"),
    il("77-me-manichette", ids_proprie.get("manichette"), testo=MANICHETTE, lavorazioni=[L("Sostituzione ovvero collaudo delle manichette.", "cad")]),
    il("77-me-idranti-mancanti", ids_proprie.get("mancanti")),
    il("77-me-safecrash-danneggiati", ids_proprie.get("safecrash"), testo=SAFECRASH),
  ]
  voci.extend(ids_proprie["attacchi"])
  voci.extend(ids_proprie.get("extra", []))
  voci.append(V(ids_proprie["manut"], "Manutenzione semestrale regolare", MANUT_OK, "Presidi antincendio."))
  voci.append(V(ids_proprie["uni"], "Promemoria UNI 10779 (manutenzione idranti e manichette)", UNI10779_UNICO))
  for v in voci:
    v["titolo"] = TITOLI_IDRICO.get(v["id"], v["titolo"])
  return voci

_att = lambda v: {**v, "gruppoEsclusivo": "attacco-motopompa"}
f75 = next(f for f in libreria["famiglie"] if f["id"] == "75")
f77 = next(f for f in libreria["famiglie"] if f["id"] == "77")

# --- 77: la sezione "Mezzi di estinzione" diventa "Impianto idrico antincendio"
voci77 = _impianto_idrico("77",
  "Il vano scala è dotato di rete idranti costituita da una colonna montante dal piano [rialzato] al piano [ottavo] [oppure: con idranti presenti ai piani rialzato, 1°, 3°, 5°, 6° e 7°].\n" + REQUISITI_IDRANTI + "\n" + ATTACCO_BASE,
  "Rete idranti del vano scala.",
  {"negativa": None, "nonEseguita": None, "manichette": None, "mancanti": None, "safecrash": None,
   "attacchi": [_att(_voce("77-me-attacco")), _att(_voce("77-me-attacco-unico")), _att(_voce("77-me-attacco-safecrash"))],
   "extra": [V("77-ia-anomalie", "Anomalie segnalate dalla ditta manutentrice",
     "Dal sopralluogo effettuato dalla ditta manutentrice incaricata sono emerse le seguenti ulteriori criticità:\n[Collegamento irregolare tra acquedotto e autoclave;]\n[Attacco motopompa VVF da 2” di linea non adoperabile;]\n[Rubinetti degli idranti non conformi alla normativa;]\nTutte le anomalie sopra riportate dovranno essere risolte mediante specifici interventi di adeguamento impiantistico, da realizzarsi nel rispetto delle normative antincendio vigenti.",
     "Impianto idrico antincendio.", [L("Interventi di adeguamento impiantistico della rete idranti a cura della ditta manutentrice.", "a corpo")])],
   "manut": "77-me-manutenzione-ok", "uni": "77-me-uni10779"})
sez77 = next(sz for sz in f77["sezioni"] if sz["id"] == "77-me")
sez77["titolo"] = "Impianto idrico antincendio"
sez77["voci"] = voci77

# --- 75: nuova sezione "Impianto idrico antincendio" dopo "Dispositivi di sicurezza"
voci75 = _impianto_idrico("75",
  "L’impianto idrico antincendio è costituito da n° [5] idranti UNI 45, inseriti in apposite cassette con vetro trasparente tipo “safe – crash”, corredati di manichette e lance erogatrici mantenute costantemente collegate.\n" + REQUISITI_IDRANTI + "\n" + ATTACCO_BASE,
  "Idranti dell’autorimessa.",
  {"negativa": "75-ia-prova-negativa", "nonEseguita": "75-ia-prova", "manichette": "75-ds-manichette", "mancanti": "75-ia-idranti-mancanti", "safecrash": "75-ia-safecrash",
   "attacchi": [_att(_voce("75-ar-attacco-nuovo")), _att(_voce("75-ds-attacco-ammalorato"))],
   "extra": [_voce("75-ar-coibentazione")],
   "manut": "75-ds-manutenzione-ok", "uni": "75-ds-uni10779"})
_togli(f75, {"75-ar-rete-requisiti", "75-ar-coibentazione", "75-ar-attacco-nuovo", "75-ds-idranti", "75-ds-idranti-requisiti", "75-ds-uni10779",
             "75-ds-manichette", "75-ds-attacchi", "75-ds-attacco-ammalorato", "75-ds-manutenzione-ok", "75-ds-manutenzione-ok-2"})
_pos = [sz["id"] for sz in f75["sezioni"]].index("75-ds") + 1
f75["sezioni"].insert(_pos, {"id": "75-ia", "titolo": "Impianto idrico antincendio", "voci": voci75})

# --- Porte REI/EI: una voce generica al posto di quelle che differivano solo per locale e classe
PORTA_LAV = lambda locale: [
  L(f"Rimozione porte non a norma{locale}, compreso sopraluce.", "cad"),
  L(f"Fornitura e posa porta [REI/EI classe]{locale}, dimensioni [80 x 205 cm] filo muro, in sostituzione dell’esistente, completa di dispositivo di autochiusura [e maniglione antipanico] e assistenza muraria.", "cad"),
  L("Chiusura del sopraluce con materiali aventi caratteristiche di resistenza al fuoco [REI/EI classe].", "a corpo"),
  L("Tinteggiature aree oggetto d’intervento.", "a corpo", False)]
PORTA_TESTO = ("La porta di [accesso al locale / collegamento tra il filtro ed il vano scala / collegamento tra il corsello ed il vano scala] [in ferro / metallica / grigliata] non rispetta le caratteristiche di resistenza al fuoco richieste[, come previsto dal punto § 8.0 della normativa vigente]. "
  "Si provveda alla sostituzione della porta con modello avente caratteristiche di resistenza al fuoco non inferiori a [REI 30 / REI 60 / REI 120 / EI 120], dotato di dispositivo di autochiusura[ e di maniglione antipanico], e alla chiusura del sopraluce con materiali aventi le medesime caratteristiche.")
def _porta(id_, locale=""):
  return V(id_, "Porta REI/EI da sostituire e chiusura del sopraluce", PORTA_TESTO, "Porta da sostituire.", PORTA_LAV(locale))
GUAINA = ("Al momento del sopralluogo la porta di collegamento tra [il corsello ed il vano scala A], sebbene fosse REI e costantemente revisionata da parte della ditta manutentrice, non sembrava essere in ottimo stato in quanto "
  "[completamente priva della guaina termo-espandente / verniciata con una pittura che ha coperto la guaina termo-espandente, non garantendone più le prestazioni di reazione al fuoco, e che ha inoltre cancellato le informazioni del produttore per poter risalire alle dichiarazioni di conformità]. "
  "Si provveda alla sostituzione della stessa con un modello simile avente caratteristiche di resistenza al fuoco non inferiori a REI [60].")
def _sostituisci(famiglia, ids, nuove):
  """toglie le voci vecchie e mette le nuove al posto della prima trovata"""
  for sez in famiglia["sezioni"]:
    posti = [i for i, v in enumerate(sez["voci"]) if v["id"] in ids]
    if not posti: continue
    primo = posti[0]
    resto = [v for v in sez["voci"] if v["id"] not in ids]
    sez["voci"] = resto[:primo] + nuove + resto[primo:]
    return
  raise AssertionError(ids)
_sostituisci(f75, {"75-fv-porta-guaina", "75-fv-porta-verniciata"}, [V("75-fv-porta-guaina", "Porta REI con guaina termo-espandente mancante o coperta", GUAINA, _tutte["75-fv-porta-guaina"]["didascalia"], [RIM_PORTE, PORTA_REI])])
_sostituisci(f75, {"75-fv-porta-locale", "75-fv-porta-nuova", "75-fv-porta-ferro"}, [_porta("75-fv-porta-sostituire")])
_sostituisci(f77, {"77-vs-lma-porta-80", "77-vs-lma-porta-metallica"}, [_porta("77-vs-lma-porta-80", " di accesso al locale macchine ascensore")])
_sostituisci(f77, {"77-lt-porta-contatori", "77-lt-porta-autoclave", "77-lt-porta-solaio"}, [_porta("77-lt-porta-sostituire", " del locale")])


# --- Alternative che si escludono (nella stessa sezione) e titoli con l'argomento davanti, così le voci dello stesso tema si leggono insieme
ESCLUSIVI = {
  "potenzialita": ["74-ct-pot-ok", "74-ct-pot-diff", "74-ct-pot-scia", "74-ct-pot-progetto"],
  "aerazione-centrale": ["74-ct-aer-ok", "74-ct-aer-fin", "74-ct-aer-porta"],
  "porta-centrale": ["74-ct-autochiusura", "74-ct-porta-verificare", "74-ct-porta-grigliata"],
  "gas-giallo": ["74-ds-gas-giallo", "74-ds-gas-giallo-parz"],
  "valvola-gas": ["74-ds-valvola", "74-ds-valvola-cartello"],
  "cartello-contatore": ["74-cs-contatore", "74-cs-contatore-nuovo"],
  "terminale-canna-fumaria": ["74-cf-altezza-ok", "74-cf-altezza-nv"],
  "sgancio": ["74-ds-sgancio-nuovo", "74-ds-sgancio-ok"],
  "estintore-centrale": ["74-ds-estintore-ok", "74-ds-estintore-noman", "74-ds-estintori-gruppi"],
  "aerazione-vano-scala": ["77-vs-aer-ok", "77-vs-aer-no", "77-vs-aer-altezza"],
  "aerazione-locale-macchine": ["77-vs-lma-aer-ok", "77-vs-lma-aer-no", "77-lm-aer-naturale"],
  "porta-locale-macchine": ["77-vs-lma-porta-80", "77-lm-porta-terrazza"],
  "griglie-autorimessa": ["75-ar-griglie", "75-ar-griglia-ascensore"],
  "segnaletica-esodo": ["75-cs-integrare", "75-cs-installare"],
}
TITOLI = {
  "74-ct-pot-ok": "Potenzialità: conforme al progetto", "74-ct-pot-diff": "Potenzialità: diversa dal progetto (non aggravio)", "74-ct-pot-scia": "Potenzialità: conforme a progetto e S.C.I.A.",
  "74-ct-aer-ok": "Aerazione: presente e dimensionata", "74-ct-aer-fin": "Aerazione: tramite finestre con griglie", "74-ct-aer-334": "Aerazione: aperture senza sacche di gas (§ 3.3.4)",
  "74-ct-autochiusura": "Porta: senza dispositivo di autochiusura",
  "74-ct-murature": "Compartimentazione: murature REI 120 non certificabili", "74-ct-controsoffitto": "Compartimentazione: controsoffitto REI/EI 120",
  "74-ct-canna-disimpegno": "Compartimentazione: canna fumaria nel disimpegno (EI 60)", "74-ct-chiusura-muratura": "Compartimentazione: chiusura muratura della canna fumaria",
  "74-ct-materiale": "Vie libere: materiale depositato nel disimpegno", "74-ct-condizionatori": "Vie libere: macchine per il condizionamento nel disimpegno",
  "74-ct-sfiato": "Vie libere: vecchio tubo di sfiato e materiali ingombranti", "74-ct-sgancio-doppione": "Sgancio: pulsante doppione da rimuovere",
  "74-ds-estintore-ok": "Estintore: presente e manutenuto", "74-ds-estintore-noman": "Estintore: privo di manutenzione", "74-ds-cartellino": "Estintore: cartellino di manutenzione da compilare",
  "74-ds-rilevatore": "Gas: rilevatore fughe collegato all’elettrovalvola", "74-ds-contatore-aerato": "Gas: contatore, alloggiamento aerato", "74-ds-gas-giallo": "Gas: linea da colorare di giallo",
  "74-ds-valvola": "Gas: valvola di intercettazione presente", "74-ds-area-libera": "Vie libere: area di contatore, sgancio ed estintore",
  "74-ds-sgancio-nuovo": "Sgancio: pulsante da installare", "74-ds-sgancio-ok": "Sgancio: pulsante presente e segnalato",
  "74-cf-termometro": "Canna fumaria: termometro presente", "74-cf-camera": "Canna fumaria: camera di raccolta presente",
  "74-cf-altezza-ok": "Canna fumaria: terminale oltre 1 m dal colmo", "74-cf-altezza-nv": "Canna fumaria: terminale non verificabile",
  "74-ct-descrizione": "Impianto: descrizione", "74-ct-nulla-osta": "Pratica VV.F.: nulla osta provvisorio", "74-ct-pot-progetto": "Potenzialità: corrispondenza con il progetto approvato",
  "74-ct-porta-verificare": "Porta: tagliafuoco da verificare (resta aperta)", "74-ct-porta-grigliata": "Porta: grigliata esente da requisiti REI", "74-ct-aer-porta": "Aerazione: porta grigliata e ventole",
  "74-ct-collari": "Compartimentazione: collari su tubazioni in plastica", "74-ct-forometria": "Compartimentazione: forometria o fori da sigillare",
  "74-ct-cartongesso": "Compartimentazione: cassonetto o controsoffitto in cartongesso", "74-ct-intonaco": "Compartimentazione: intonaco ammalorato",
  "74-ct-serbatoio": "Serbatoio a gasolio dismesso: maniglia a strappo",
  "74-ds-estintori-gruppi": "Estintore: numero pari ai gruppi termici", "74-ds-estintore-cartello": "Estintore: cartellonistica da installare",
  "74-ds-gas-giallo-parz": "Gas: verniciatura gialla incompleta", "74-ds-valvola-cartello": "Gas: valvola di intercettazione, cartellonistica da installare",
  "74-ds-presidi-cartello": "Cartellonistica: presidi e centrale termica",
  "74-cs-contatore-nuovo": "Cartellonistica: contatore gas da installare", "74-cs-interruttore": "Cartellonistica: interruttore generale",
  "74-cs-contatore": "Cartellonistica: contatore gas", "74-cs-integrare": "Cartellonistica: integrare sgancio e valvola gas",
  "75-fv-realizzare": "Filtro: da realizzare", "75-fv-esistenti": "Filtro: verifica porte e autochiusure",
  "75-fv-porta-guaina": "Porta REI: guaina termo-espandente mancante o coperta", "75-fv-porta-sostituire": "Porta REI/EI: filtro o locale tecnico da sostituire, con sopraluce",
  "75-fv-aerazione-ostruita": "Aerazione: filtro ostruito", "75-fv-senso-fuga": "Porta: apribile nel senso di fuga (dislivello)",
  "75-fv-pvc-collari": "Compartimentazione: PVC nel filtro, collari", "75-fv-pvc-cartongesso": "Compartimentazione: PVC nel filtro, cartongesso REI",
  "75-fv-griglia-lma": "Aerazione: griglia del locale macchine sul corsello",
  "75-ar-griglia-ascensore": "Aerazione: griglia del locale ascensore sul corsello", "75-ar-griglie": "Aerazione: griglie presenti",
  "75-ar-corrimano": "Vie d’esodo: corrimano su scala e rampa", "75-ar-cancello": "Vie d’esodo: cancello apribile nel senso di fuga",
  "75-ar-posacenere": "Vie d’esodo: posacenere da rimuovere (divieto di fumo)", "75-ar-portone": "Porta: portone tagliafuoco non più necessario",
  "75-ar-plafoni": "Compartimentazione: plafoni ammalorati", "75-ar-pvc-collari": "Compartimentazione: PVC cantine e retro box, collari",
  "75-ar-foro": "Compartimentazione: foro da chiudere con materiali REI",
  "75-ds-estintori": "Estintori: numero e requisiti", "75-ds-estintori-progetto": "Estintori: numero minimo da progetto",
  "75-cs-integrare": "Cartellonistica: vie d’esodo da integrare", "75-cs-installare": "Cartellonistica: vie d’esodo da installare", "75-cs-sgancio": "Cartellonistica: pulsante di sgancio da segnalare",
  "77-vs-aer-ok": "Aerazione: vano scala, presente in sommità", "77-vs-aer-no": "Aerazione: vano scala, assente (rimozione vetri)", "77-vs-aer-altezza": "Aerazione: vano scala, assente con altezza antincendio",
  "77-vs-porta-copertura": "Porta: REI al piano copertura non in progetto", "77-vs-filtro-autorimessa": "Filtro: edificio / autorimessa da realizzare",
  "77-vs-porta-filtro-vano": "Porta: filtro / vano scala da sostituire con REI 120", "77-vs-porte-contrario": "Porta: montate al contrario rispetto all’esodo",
  "77-vs-oggetti": "Vie d’esodo: oggetti lungo le vie",
  "77-vs-lma-aer-ok": "Aerazione: locale macchine, presente", "77-vs-lma-aer-no": "Aerazione: locale macchine, assente", "77-lm-aer-naturale": "Aerazione: locale macchine, naturale permanentemente aperta",
  "77-vs-lma-porta-rei30": "Porta: promemoria REI 30 del locale macchine", "77-vs-lma-porta-80": "Porta REI/EI: locale macchine ascensore, sostituzione e sopraluce (§ 8.0)",
  "77-lm-porta-terrazza": "Porta: non conforme ma accesso da terrazza",
  "77-cs-vie": "Cartellonistica: vie d’esodo a ogni piano", "77-cs-presidi": "Cartellonistica: presidi da corredare",
  "77-lt-porta-sostituire": "Porta REI/EI: locale tecnico (contatori, autoclave, solaio) da sostituire, con sopraluce",
  "77-lt-solaio-estintori": "Estintori: piano solaio da integrare", "77-lt-solaio-cartelli": "Cartellonistica: divieto di deposito e passaggi ribassati (solaio)",
}
# ---------------------------------------------------------------------------------------------
# Fusione delle voci simili e voci nuove da 3 cataloghi di ROA (ottobre 2026).
# Le varianti della stessa frase diventano alternative [a / b] dentro una sola voce; il "conforme" e il
# "da adeguare" restano voci separate (gruppo esclusivo). La voce fusa tiene l'id della prima: le pratiche
# salvate la ritrovano; le istanze delle voci eliminate restano con il loro testo.
# ---------------------------------------------------------------------------------------------
_FAM = {f["id"]: f for f in libreria["famiglie"]}
_RIMOSSE = set()
def _sez(fam, sez_id): return next(s for s in _FAM[fam]["sezioni"] if s["id"] == sez_id)
def _rimuovi(ids):
  for f in libreria["famiglie"]:
    for s in f["sezioni"]:
      s["voci"] = [v for v in s["voci"] if v["id"] not in ids]
  _RIMOSSE.update(ids)
def _vecchie(ids):
  return {i: copy.deepcopy(next(v for f in libreria["famiglie"] for s in f["sezioni"] for v in s["voci"] if v["id"] == i)) for i in ids}
def _fondi(fam, sez_id, ids, voce):
  """Sostituisce le voci `ids` con `voce` (nella posizione della prima presente in `sez_id`, altrimenti in coda)."""
  sez = _sez(fam, sez_id)
  pos = next((i for i, v in enumerate(sez["voci"]) if v["id"] in ids), len(sez["voci"]))
  prima = sum(1 for v in sez["voci"][:pos] if v["id"] in ids)
  _rimuovi([i for i in ids if i != voce["id"]])
  sez["voci"] = [v for v in sez["voci"] if v["id"] != voce["id"]]
  sez["voci"].insert(pos - prima, voce)
def _dopo(fam, sez_id, dopo_id, voci):
  sez = _sez(fam, sez_id)
  pos = next((i + 1 for i, v in enumerate(sez["voci"]) if v["id"] == dopo_id), len(sez["voci"]))
  sez["voci"][pos:pos] = voci
def _mod(id_, **m):
  v = _per_id_tmp()[id_]
  v.update(m)
def _per_id_tmp(): return {v["id"]: v for f in libreria["famiglie"] for s in f["sezioni"] for v in s["voci"]}
def _titolo_libero(*ids):
  for i in ids: TITOLI.pop(i, None)

# ===== Attività 74: fusioni =====
_fondi("74", "74-ct", ["74-ct-pot-ok", "74-ct-pot-scia", "74-ct-pot-progetto"],
  V("74-ct-pot-ok", "Potenzialità: conforme al progetto",
    "[Al momento del sopralluogo / Durante il sopralluogo] è stato possibile verificare la corretta corrispondenza della portata termica della caldaia presente, ovvero pari a [valore] kW, rispetto al progetto approvato dal Comando dei VV.F.",
    "Portata termica riscontrata."))
_fondi("74", "74-ct", ["74-ct-aer-ok", "74-ct-aer-fin", "74-ct-aer-porta", "74-ct-aer-334"],
  V("74-ct-aer-ok", "Aerazione: presente e dimensionata",
    "Durante il sopralluogo è stata riscontrata l’aerazione permanente del locale centrale termica, correttamente dimensionata come previsto nel progetto approvato: [assicurata da due finestre, entrambe dotate di griglie metalliche e mantenute costantemente aperte / realizzata con porta grigliata avente superficie di griglia superiore ad 1 mq e ventole di aerazione / a filo soletta]. Il punto § 3.3.4 della Normativa stabilisce che le aperture di aerazione devono essere realizzate e collocate in modo da evitare la formazione di sacche di gas: al momento del sopralluogo è stata verificata tale prescrizione.",
    "Aerazione presente nel locale centrale termica."))
_fondi("74", "74-ct", ["74-ct-autochiusura", "74-ct-porta-verificare"],
  V("74-ct-autochiusura", "Porta: autochiusura mancante o da verificare",
    "[Il locale centrale termica è prospiciente sull’intercapedine antincendio che comunica con le cantine dell’edificio attraverso un disimpegno.] Al momento del sopralluogo [risultava assente il dispositivo di autochiusura della porta in ferro di accesso al locale centrale termica / la porta tagliafuoco rimaneva aperta, non garantendo così la delimitazione del comparto antincendio / le porte tagliafuoco rimanevano aperte, non garantendo così la delimitazione del comparto antincendio]. Al fine di garantire la compartimentazione della centrale termica, [sarà necessario provvedere all’installazione del dispositivo di autochiusura, come previsto dalla normativa vigente / dovrà essere verificata la porta tagliafuoco, affinché possa chiudersi liberamente / dovranno essere verificate le due porte tagliafuoco, affinché possano chiudersi liberamente].",
    "Porta di accesso alla centrale termica.",
    [L("Ripristino dispositivi di autochiusura.", "cad"), L("Fornitura e posa di congegno di autochiusura.", "cad", False)]))
_fondi("74", "74-ct", ["74-ct-collari", "74-ct-forometria"],
  V("74-ct-forometria", "Compartimentazione: forometrie e tubazioni in plastica",
    "Al fine di garantire la compartimentazione del locale centrale termica sarà necessario [sigillare la forometria esistente / ripristinare tutti i fori presenti nel locale] con materiali aventi caratteristiche di resistenza al fuoco non inferiori a EI 120. Le tubazioni in materiale plastico [insediate nel muro e nella soletta] dovranno essere dotate di collari intumescenti aventi caratteristiche di resistenza al fuoco non inferiori a EI 120.",
    "Fori e tubazioni da compartimentare.",
    [L("Ripristini forometrie esistenti con materiali certificati al fuoco almeno EI 120.", "a corpo"), L("Fornitura e posa collari termoespandenti EI 120.", "cad")]))
_fondi("74", "74-ds", ["74-ds-gas-giallo", "74-ds-gas-giallo-parz"],
  V("74-ds-gas-giallo", "Gas: linea da colorare di giallo",
    "La normativa di riferimento prevede che le tubazioni di adduzione del gas, dal contatore al generatore termico, devono essere contraddistinte con colore giallo [continuo / a bande di 20 cm poste a distanza massima di 1 m l’una dall’altra]. Attualmente tali tubazioni [appaiono verniciate dello stesso colore della facciata condominiale nel tratto esterno al fabbricato / presentano una verniciatura incompleta]. Si provveda dunque a [verniciare l’intera linea di colore giallo, dal contatore al generatore / completare la verniciatura gialla della linea, così da favorirne il riconoscimento].",
    "Linea gas da colorare di giallo.",
    [L("Tinteggiatura linea gas dal contatore al bruciatore in smalto giallo.", "a corpo")]))
_fondi("74", "74-ds", ["74-ds-estintore-ok", "74-ds-estintori-gruppi"],
  V("74-ds-estintore-ok", "Estintori: numero e requisiti",
    "Si ricorda che il numero degli estintori non dovrà mai essere inferiore a n° [1] [oppure: al numero dei gruppi della centrale termica], posizionati in prossimità della centrale termica. Gli estintori dovranno possedere capacità estinguente non inferiore a [21 A – 89 BC / 34 A – 144 B], corredati da apposita cartellonistica di ampiezza sufficiente per consentirne un’immediata individuazione e da cartellino per la manutenzione semestrale ai sensi del D.lgs. 81/08. [Al momento del sopralluogo il presidio risultava presente e correttamente manutenuto, nonché segnalato. / Al momento del sopralluogo è stato riscontrato un solo estintore.]",
    "Estintori a servizio della centrale termica.",
    [L("Fornitura e posa estintore in acciaio, omologato, a polvere, 6 kg, 34A 233BC, con gancio a muro.", "cad", False), L("Fornitura e posa gancio per estintore.", "cad", False)]))
_fondi("74", "74-ds", ["74-ds-estintore-noman", "74-ds-cartellino"],
  V("74-ds-estintore-noman", "Estintori: manutenzione semestrale",
    "[Durante il sopralluogo è stata riscontrata l’assenza di manutenzione sull’estintore posizionato all’interno della centrale termica. Pertanto, si dovrà provvedere alla sua manutenzione e/o sostituzione, se necessario, da parte della ditta manutentrice dei presidi antincendio. / Si ricorda che gli estintori devono essere soggetti a manutenzione semestrale con firma e timbro da apporre su appositi cartellini, ai sensi del D.lgs. 81/08. Sarà pertanto necessario provvedere al controllo periodico dei presidi, compilando il cartellino di manutenzione a corredo.]",
    "Estintore presente privo di manutenzione.",
    [L("Manutenzione e/o sostituzione dell’estintore a servizio della centrale termica.", "cad")]))
_fondi("74", "74-cs", ["74-cs-integrare", "74-cs-contatore-nuovo", "74-cs-interruttore", "74-ds-valvola-cartello", "74-ds-presidi-cartello", "74-ds-estintore-cartello"],
  V("74-cs-integrare", "Cartellonistica D.lgs. 81/08: da installare o integrare",
    "Si provveda ad installare o integrare la cartellonistica, conforme al D.lgs. 81/08, relativa a: [contatore gas;] [valvola di intercettazione del gas;] [pulsante di sgancio elettrico;] [interruttore generale;] [estintore posto all’esterno del locale centrale termica;] [presidi e centrale termica.] [Sostituire i cartelli non conformi e rimuovere quelli di dispositivi non più presenti.]",
    "Cartellonistica da installare.", [CARTELLONISTICA]))
_fondi("74", "74-cf", ["74-cf-termometro", "74-cf-camera"],
  V("74-cf-termometro", "Canna fumaria: termometro e camera di raccolta presenti",
    "Al momento del sopralluogo è stata verificata la presenza [del termometro atto a consentire il rilevamento della temperatura dei fumi sul canale, come prescritto dal D.P.R. 1391/70] [e] [della camera di raccolta posta alla base del tratto verticale del canale dei fumi].",
    "Termometro e camera di raccolta."))
_fondi("74", "74-ct", ["74-ct-materiale", "74-ds-area-libera"],
  V("74-ct-materiale", "Vie libere: divieto di deposito",
    "Si ricorda che [all’interno del locale disimpegno / nelle vicinanze del contatore gas, del pulsante di sgancio e dell’estintore] è assolutamente vietato depositare qualsiasi tipo di materiale e/o sostanza, perché l’area deve essere sempre accessibile in caso di emergenza. Si provveda pertanto alla rimozione di tutto il materiale [e dei cassonetti dei rifiuti] rilevato in fase di sopralluogo.",
    "Materiale presente da rimuovere.", [L("Rimozione del materiale depositato nel locale disimpegno.", "a corpo")]))

# ===== Attività 74: ampliamenti di voci esistenti =====
_mod("74-ct-cartongesso", testo=_per_id_tmp()["74-ct-cartongesso"]["testo"] + "\n[Le tubazioni fognarie o pluviali non deviabili dovranno essere racchiuse in un cassonetto in cartongesso EI 120, con botola d’ispezione EI 120 e dichiarazione di corretta posa.]")
_mod("74-ds-contatore-aerato", testo="Il contatore gas dovrà essere dotato di apposito alloggiamento aerato. [Il contatore dovrà essere accessibile per la verifica, con le chiavi dello sportello in cassetta nell’androne.] [Lo sportello dovrà essere dotato di vetro safe-crash.]")
_mod("74-ct-serbatoio", titolo="Serbatoio a gasolio dismesso: bonifica e rimozione",
     testo="Si provveda alla rimozione [della maniglia a strappo del vecchio serbatoio a gasolio, ormai rimosso / dei dispositivi di sicurezza del vecchio impianto a gasolio dismesso] e, ove presente il serbatoio, alla sua bonifica, inertizzazione e rimozione (divieto per le caldaie a gasolio in vigore a Milano dall’ottobre 2023).")
_mod("74-ds-sgancio-nuovo", testo="Si provveda all’installazione di adeguato pulsante di sgancio [e dell’interruttore elettrico di emergenza] nei pressi della centrale termica corredato da idonea cartellonistica conforme al D.lgs. 81/08.")
_mod("74-ds-emergenza", titolo="Illuminazione di emergenza: verifica",
     testo="All’interno [del disimpegno / del locale] è stata rilevata la presenza dell’illuminazione di emergenza. [Al momento del sopralluogo, però, tale dispositivo non appariva correttamente funzionante (led segnalatore rosso). Si provveda a contattare apposita ditta per la manutenzione ed il ripristino del dispositivo. / Si provveda a trasmettere la documentazione di funzionamento del dispositivo.]")
_titolo_libero("74-ct-serbatoio")

# ===== Attività 74: voci nuove =====
_dopo("74", "74-ct", "74-ct-aer-ok", [
  V("74-ct-aer-ostruita", "Aerazione: griglie ostruite da liberare",
    "Durante il sopralluogo le griglie di aerazione del locale risultavano ostruite da [ante / bidoni / plastica / infissi vetrati]. Si provveda alla rimozione di quanto presente, per garantire l’aerazione permanente su parete esterna[, e alla posa di griglie con alette antipioggia o protezione metallica alettata, senza ridurre la superficie netta aerante].",
    "Griglie di aerazione ostruite.",
    [L("Rimozione delle ostruzioni dalle griglie di aerazione.", "a corpo"), L("Fornitura e posa di griglie alettate per l’aerazione del locale.", "a corpo", False)])])
_dopo("74", "74-ct", "74-ct-autochiusura", [
  V("74-ct-porta-sostituire", "Porta REI: da sostituire",
    "La porta di accesso al locale centrale termica [in ferro] risulta [ammalorata / priva di certificazione REI / assente (telaio privo di porta)]. Sarà necessario sostituirla con porta avente caratteristiche di resistenza al fuoco non inferiori a REI [120], dimensioni minime [0,80 x 2,00] m, dotata di autochiusura, targhetta identificativa e apertura nel verso dell’esodo.",
    "Porta di accesso alla centrale termica.", [RIM_PORTE, PORTA_REI]),
  V("74-ct-porta-regola", "Porta tagliafuoco: posata non a regola d’arte",
    "La porta tagliafuoco [di accesso al locale / dell’intercapedine] risulta posata non a regola d’arte ([telaio non conforme / anta non allineata]). Sarà necessario riposizionarla o sostituirla, con dichiarazione di corretta posa.",
    "Porta tagliafuoco posata non a regola d’arte.", [L("Riposizionamento o sostituzione della porta tagliafuoco posata non a regola d’arte.", "cad")])])
_dopo("74", "74-ct", "74-ct-cartongesso", [
  V("74-ct-linea-gas", "Compartimentazione: linea gas nelle cantine e nei corridoi",
    "La tubazione di adduzione del gas attraversa [i locali cantinati comuni / i corridoi delle cantine] fino al gruppo di misura. Come da progetto approvato dovrà essere protetta con alloggiamento (coppelle o controtubo) avente resistenza al fuoco predeterminata non inferiore a REI [30 / 120] (§ 2.3.3.2), con certificazione dei materiali e dichiarazione di corretta posa.",
    "Tubazione gas nei locali comuni.", [L("Rivestimento con materiale REI [120] della tubazione gas.", "a corpo")]),
  V("74-ct-soletta", "Compartimentazione: soletta o orizzontamento EI 120",
    "Per garantire la compartimentazione della centrale termica sarà necessario riqualificare [la soletta in cemento armato / l’orizzontamento] del locale con caratteristiche non inferiori a EI 120, mediante lastre in calcio fibrosilicato o in gesso rivestito ad alte prestazioni, stuccatura dei giunti e finitura. Il tutto dovrà essere documentato con certificati di conformità dei materiali e dichiarazione di corretta posa.",
    "Soletta della centrale termica.",
    [L("Riqualificazione antincendio con certificazione REI 120 di soletta in cemento armato, costituita da lastra di calcio fibrosilicato ad alte prestazioni in classe A1. Stuccatura dei giunti, stesura di rete in fibra di vetro, mano di isolante inibente e due mani di pittura per interni lavabile bianca.", "mq")]),
  V("74-ct-armatura", "Strutture: armatura a vista da risanare",
    "Sono presenti armature a vista da risanare con trattamento protettivo e malte tissotropiche[; i fori lasciati dai vecchi passaggi dovranno essere chiusi con botole di ispezione EI 120].",
    "Armatura a vista.",
    [L("Risanamento delle armature a vista con trattamento protettivo e malte tissotropiche.", "a corpo"), L("Chiusura dei fori con botole EI 120.", "a corpo", False)]),
  V("74-ct-disimpegno-ok", "Disimpegno: conforme",
    "Il locale disimpegno ha superficie di almeno 2 mq ([valore] mq) e aerazione permanente di almeno 0,5 mq ([valore] mq).",
    "Locale disimpegno."),
  V("74-ct-disimpegno-no", "Disimpegno o intercapedine: mancante o non conforme",
    "[Il disimpegno risulta mancante / L’intercapedine non è ad uso esclusivo ed è comunicante con altri locali]. Sarà necessario [realizzare setti EI 120 con porte EI 120 (apertura nel verso corretto), spostando il pulsante di sgancio e gli interruttori che interferiscono / chiudere porta e finestre / realizzare una nuova parete EI 120 con porta EI 120].",
    "Disimpegno o intercapedine.", [L("Realizzazione di setti EI 120 con porta EI 120.", "a corpo")])])
_dopo("74", "74-ds", "74-ds-gas-giallo", [
  V("74-ds-valvola-installare", "Gas: valvola di intercettazione da installare",
    "Si provveda all’installazione della valvola manuale di intercettazione del gas presso il gruppo di misura, accessibile e segnalata con apposita cartellonistica conforme al D.lgs. 81/08.",
    "Gruppo di misura del gas.", [L("Fornitura e posa valvola manuale di intercettazione gas.", "cad")])])
_dopo("74", "74-cf", "74-cf-termometro", [
  V("74-cf-termometro-sostituire", "Canna fumaria: termometro ammalorato da sostituire",
    "Il termometro presente sul canale dei fumi risulta ammalorato: si provveda alla sua sostituzione.",
    "Termometro ammalorato.", [L("Sostituzione del termometro sul canale dei fumi.", "cad")]),
  V("74-cf-percorso", "Canna fumaria: canale fumi con percorso diverso dal progetto",
    "Il canale dei fumi segue un percorso diverso da quello del progetto approvato[, attraversando locali cantinati]: dovrà essere compartimentato con materiali aventi caratteristiche di resistenza al fuoco non inferiori a REI [120], con certificazioni dei materiali e dichiarazione di corretta posa. [Il tratto danneggiato dovrà essere sostituito tramite la gestione calore.]",
    "Canale fumi.", [L("Compartimentazione del canale fumi con materiali REI [120].", "a corpo")])])
# rare
_dopo("74", "74-ct", "74-ct-nulla-osta", [
  V("74-ct-difformita-area", "Difformità dell’area intorno alla centrale termica",
    "L’area intorno alla centrale termica risulta difforme da quanto riportato nel progetto approvato: sarà necessario aggiornare il progetto prima della presentazione della S.C.I.A.",
    "Area intorno alla centrale termica."),
  V("74-ct-dismessa", "Centrale termica dismessa o cessata",
    "La centrale termica risulta [dismessa (teleriscaldamento) / non più in uso]. Verrà presentata al Comando VV.F. la comunicazione di cessata attività[ e, in fase di S.C.I.A., la dichiarazione di non aggravio del rischio]. Occorrono il libretto d’impianto e i documenti dell’amministratore.",
    "Centrale termica dismessa."),
  V("74-ct-titolari", "Più centrali con titolari diversi",
    "Sono presenti più locali o caldaie con titolari diversi: si valuti la presentazione di S.C.I.A. distinte per ciascun titolare.",
    "Centrali termiche.")])
_dopo("74", "74-ds", "74-ds-rilevatore", [
  V("74-ds-rilevatore-fumi", "Rilevatore di fumi da installare",
    "Si provveda all’installazione di rilevatore di fumi nel locale [centrale termica / disimpegno].",
    "Rilevatore di fumi da installare.", [L("Fornitura e posa rilevatore di fumi.", "cad")])])

# ===== Attività 75: fusioni =====
_fondi("75", "75-ds", ["75-ds-estintori", "75-ds-estintori-progetto"],
  V("75-ds-estintori", "Estintori: numero e requisiti",
    "Il numero degli estintori presenti nell’autorimessa non dovrà mai essere inferiore a n° [8][, come previsto dal progetto approvato]. Al momento del sopralluogo sono stati riscontrati n° [11] estintori.\nTali dispositivi di sicurezza devono possedere capacità estinguente non inferiore a [13 A – 233 B], essere corredati da apposita cartellonistica di ampiezza sufficiente per consentirne un’immediata individuazione e da cartellino relativo alle manutenzioni semestrali obbligatorie ai sensi del D.lgs. 81/08.",
    "Alcuni degli estintori presenti.",
    [L("Fornitura e posa estintore in polvere da 6 KG.", "cad", False)]))
_fondi("75", "75-ar", ["75-ar-griglia-ascensore", "75-fv-griglia-lma"],
  V("75-ar-griglia-ascensore", "Aerazione: griglia del locale macchine sul corsello",
    "[Il locale macchine ascensore è provvisto / I locali macchine ascensore sono provvisti] di una griglia di aerazione sfociante nel corsello. Al fine di garantire la corretta compartimentazione dell’autorimessa sarà necessario provvedere alla sostituzione della stessa con griglia [termo – espandente / antincendio] avente le medesime dimensioni ([95 cm x 50 cm]), ovvero alla sua completa chiusura con materiale avente resistenza al fuoco non inferiore a REI 120.",
    "Aerazione sfociante sul corsello.",
    [L("Rimozione griglia di aerazione del locale macchine ascensore.", "a corpo"),
     L("Fornitura e posa di griglia termo – espandente per l’aerazione del locale macchine ascensore (dimensioni [0,95 m x 0,50 m]), compresa assistenza muraria.", "a corpo"),
     L("Fornitura e posa griglia antincendio [Scala A], dimensioni [43x26] cm, compresa assistenza muraria.", "cad", False)]))
_fondi("75", "75-ar", ["75-ar-pvc-collari", "75-fv-pvc-collari", "75-fv-pvc-cartongesso"],
  V("75-ar-pvc-collari", "Compartimentazione: tubazioni in plastica (collari o cartongesso REI)",
    "Sono presenti tubazioni in PVC passanti [all’interno dei corridoi delle cantine / dei retro dei box / nel filtro del vano scala]. Al fine di garantire la corretta compartimentazione dell’autorimessa sarà necessario provvedere [alla posa di collari termo – espandenti in corrispondenza degli attraversamenti delle murature / alla compartimentazione del tratto mediante cartongesso avente caratteristiche di resistenza al fuoco non inferiori a REI 60].",
    "Tubazioni in PVC passanti nelle murature.",
    [L("Fornitura e posa collari termo – espandenti sulle tubazioni attraversanti le murature sul retro dei box ed i filtri.", "a corpo"),
     L("Compartimentazione della tubazione in PVC passante nel filtro mediante cartongesso REI [60].", "a corpo", False)]))
_fondi("75", "75-cs", ["75-cs-integrare", "75-cs-installare"],
  V("75-cs-integrare", "Cartellonistica: vie d’esodo",
    "Si provveda ad [integrare / installare] la cartellonistica di sicurezza, conforme al D.lgs 81/08, indicante le vie d’esodo ed il relativo percorso per raggiungerle[, bifacciale a bandiera sopra le uscite verso i vani scala].",
    "Corsello box.", [CARTELLONISTICA]))
_fondi("75", "75-ar", ["75-ar-cancello"],
  V("75-ar-cancello", "Vie d’esodo: uscite di emergenza, maniglione e apertura",
    "Le uscite di emergenza [sulle porte dei vani scala / in sommità alle rampe scala / sui portoni scorrevoli] dovranno essere dotate di maniglione antipanico e aprirsi nel senso di fuga, in conformità ai requisiti previsti per le vie di esodo; le porte d’esodo non vanno chiuse a chiave. [Il cancello situato all’inizio del passo carrabile e destinato anche all’esodo di emergenza dovrà aprirsi nel senso di fuga.] [Nei portoni scorrevoli deve essere ricavata una porta di almeno 90 cm.] [Il cancelletto chiuso a chiave va rimosso o dotato di maniglione.]",
    "Porta d’esodo rampa carrabile.",
    [L("Modifica del senso di apertura del cancello del passo carrabile secondo il verso dell’esodo.", "a corpo", False), L("Fornitura e posa di maniglione antipanico.", "cad")]))
_mod("75-ar-portone", testo="A seguito del progetto, presentato al Comando Provinciale dei VV.F. di [Milano], la presenza del [portone tagliafuoco / porta] avente classe di resistenza al fuoco pari a REI [120] non risulta più necessaria. Si provveda pertanto alla rimozione del dispositivo[, lasciando il passaggio libero].")

# ===== Attività 75: voci nuove =====
_dopo("75", "75-ar", "75-ar-griglie", [
  V("75-ar-ventilazione", "Aerazione: ventilazione meccanica dual purpose",
    "Poiché l’aerazione naturale risulta insufficiente[ (aerazione inferiore a 1/25 della superficie in pianta per i box oltre 40 mq)], quale misura compensativa dovrà essere previsto un impianto di ventilazione meccanica “dual purpose” (ventilazione normale e smaltimento fumi).",
    "Aerazione dell’autorimessa.", [L("Realizzazione di impianto di ventilazione meccanica “dual purpose”.", "a corpo")]),
  V("75-ar-aerazioni-cantine", "Aerazione: chiusura di aperture sul corsello",
    "Al fine di garantire la compartimentazione dell’autorimessa sarà necessario chiudere [le aerazioni dei locali cantinati / le forometrie prospicienti il corsello], rimuovendo [i canali di aerazione non previsti] [e i vetri degli infissi del corsello dei box], con materiali aventi resistenza al fuoco non inferiore a REI [120].",
    "Aperture sul corsello.", [L("Chiusura di aerazioni e forometrie sul corsello con materiali REI [120].", "a corpo")])])
_dopo("75", "75-ar", "75-ar-portone", [
  V("75-ar-setto", "Porta: setto da innalzare per la nuova porta",
    "Per posare la nuova porta tagliafuoco [a singola / a doppia anta] di dimensioni [80+40 x 200] cm sarà necessario innalzare il setto divisorio esistente.",
    "Setto divisorio.", [L("Innalzamento del setto divisorio per la posa della porta tagliafuoco.", "a corpo")]),
  V("75-ar-portoni-scorrevoli", "Portoni scorrevoli tra comparti",
    "I portoni scorrevoli tra i comparti risultano [ammalorati / mancanti]. Dovranno essere [sostituiti / installati] portoni REI [90] collegati all’impianto di allarme (rivelatori termovelocimetrici) con rilascio automatico[; il fusibile termico va sostituito con elettromagnete solo dalla casa produttrice o da ditta autorizzata, per non far decadere l’omologa].",
    "Portone scorrevole tra comparti.", [L("Fornitura e posa portone scorrevole REI [90] con rilascio automatico.", "cad")]),
  V("75-ar-porte-manutenzione", "Porte e portoni tagliafuoco: manutenzione",
    "Le porte e i portoni tagliafuoco dovranno essere sottoposti a manutenzione semestrale con targhetta e cartellino[; ripristinare gli elettromagneti, registrare l’autochiusura e rimuovere i fermaporta]. [Quelli in cattivo stato vanno sostituiti con modelli REI 120.]",
    "Porte e portoni tagliafuoco.", [L("Manutenzione di porte e portoni tagliafuoco.", "a corpo")]),
  V("75-ar-uscita", "Vie d’esodo: uscita mancante o dimensioni insufficienti",
    "[Il percorso d’esodo supera i 40 m / L’uscita di emergenza prevista dal progetto non è stata realizzata / Le porte di esodo non rispettano le dimensioni minime di 90 x 200 cm]. Sarà necessario [realizzare una nuova uscita con porta dotata di maniglione antipanico e autochiusura, previe verifiche strutturali del muro da demolire / sostituire le porte con modelli di dimensioni conformi].",
    "Percorso d’esodo.", [L("Realizzazione di nuova uscita di emergenza.", "a corpo", False)]),
  V("75-ar-quadri", "Compartimentazione: quadri elettrici e cassette contatori",
    "I quadri elettrici e le cassette dei contatori presenti dovranno essere inseriti in strutture aventi resistenza al fuoco non inferiore a REI 120.",
    "Quadri elettrici.", [L("Realizzazione di strutture REI 120 per quadri elettrici e cassette contatori.", "a corpo")]),
  V("75-ar-distacco", "Compartimentazione: autorimessa e edifici soprastanti",
    "L’autorimessa dovrà essere compartimentata dagli edifici soprastanti mediante vani di distacco con murature EI [90] e porte EI [120]; le scale protette dovranno avere elementi REI/EI [60] e porte con kit di tenuta ai fumi. [I nuovi tramezzi comportano nuovi punti luce per compensare la luce persa.]",
    "Vano di distacco.", [L("Realizzazione di vani di distacco con murature EI [90] e porte EI [120].", "a corpo")])])
_dopo("75", "75-ar", "75-ar-plafoni", [
  V("75-ar-bande", "Vie d’esodo: bande catarifrangenti",
    "Sui gradini del percorso d’esodo e sui restringimenti o cambi di direzione delle corsie dovranno essere applicate bande catarifrangenti [giallo/nere / rosso/bianche], come da progetto approvato[; specchi parabolici e semaforo di rampa devono essere sempre efficienti].",
    "Bande catarifrangenti.", [L("Fornitura e posa bande catarifrangenti.", "a corpo")]),
  V("75-ar-stoccaggio", "Vie libere: divieto di stoccaggio",
    "Nell’autorimessa è vietato accatastare materiali combustibili e rifiuti. Si provveda a rimuovere [i rifiuti, il perlinato, il linoleum, le pareti in legno e il materiale d’ingombro] e a spostare i bidoni della spazzatura in locale idoneo.",
    "Materiali da rimuovere.", [L("Rimozione dei materiali depositati nell’autorimessa.", "a corpo")]),
  V("75-ar-condizionatori", "Vie libere: macchine di condizionamento nel corsello",
    "Si valuti la rimozione delle macchine di condizionamento presenti nel corsello, per ridurre le sorgenti di innesco.",
    "Macchine di condizionamento.", [L("Rimozione delle macchine di condizionamento dal corsello.", "a corpo", False)]),
  V("75-ar-difformita", "Difformità lievi dal progetto approvato",
    "Sono state riscontrate lievi difformità rispetto al progetto approvato ([porta o locale non previsti / porte tagliafuoco e setti mancanti]). Prima di computare le opere va determinata la destinazione d’uso del locale; verrà valutata la dichiarazione di non aggravio del rischio da allegare alla S.C.I.A., anche per evitare le opere.",
    "Difformità dal progetto.", nonAggravio=True),
  V("75-ar-pavimento", "Pavimentazione sdrucciolevole",
    "La pavimentazione dell’autorimessa scoperta risulta sdrucciolevole: dovrà essere sostituita secondo il § 3.8.1[; la parete con infissi verso l’interrato dovrà essere chiusa con materiale REI 120].",
    "Pavimentazione.", [L("Sostituzione della pavimentazione sdrucciolevole.", "mq", False)]),
  V("75-ar-intumescente", "Pareti in blocchi di calcestruzzo: pittura intumescente",
    "Le pareti in blocchi di calcestruzzo da [9] cm dovranno essere riqualificate con pittura intumescente reattiva (EN 1364-1), previa esecuzione di saggi, per portarle alla resistenza al fuoco richiesta.",
    "Pareti in blocchi.", [L("Applicazione di pittura intumescente reattiva sulle pareti in blocchi.", "mq", False)]),
  V("75-ar-semaforo", "Rampe: impianto semaforico",
    "Alla base e in sommità delle rampe a doppio senso, di dimensioni inferiori alla norma, dovranno essere presenti impianti semaforici sempre efficienti.",
    "Rampa carrabile.", [L("Fornitura e posa di impianto semaforico alla base e in sommità della rampa.", "a corpo", False)]),
  V("75-ar-altezza", "Altezza netta inferiore a 2,40 m",
    "L’altezza netta dell’autorimessa risulta inferiore a 2,40 m nella zona [valore]: caso particolare da valutare nel progetto antincendio.",
    "Altezza netta dell’autorimessa.")])
_dopo("75", "75-ds", "75-ds-estintori", [
  V("75-ds-estintori-eccesso", "Estintori in eccesso o abbandonati",
    "Gli estintori non previsti dal progetto approvato, in eccesso o abbandonati, dovranno essere rimossi.",
    "Estintori in eccesso.", [L("Rimozione degli estintori non previsti dal progetto.", "cad")]),
  V("75-ds-emergenza", "Illuminazione di emergenza: verifica",
    "L’illuminazione di emergenza [è presente e soggetta a manutenzione ordinaria / dovrà essere realizzata e certificata (non inferiore a 5 lux sulle vie d’esodo)]. Si provveda a verificarne il funzionamento, sostituire le lampade esaurite e trasmettere la relativa documentazione.",
    "Illuminazione di emergenza.", [L("Ripristino del dispositivo di illuminazione di emergenza.", "cad", False)]),
  V("75-ds-attivi", "Impianti di protezione attiva: manutenzione",
    "Gli impianti di protezione attiva presenti ([sprinkler / ventilazione meccanica / rilevazione fumo, CO e miscele]) devono essere soggetti a manutenzione semestrale da parte di ditta incaricata, con firma sul registro dei presidi[ e cartellonistica agli accessi].",
    "Impianti di protezione attiva."),
  V("75-ds-sgancio", "Sgancio: pulsante da installare",
    "Si provveda all’installazione del pulsante di sgancio generale presso [l’ingresso / le rampe carrabili] dell’autorimessa[, e di un pulsante per ogni comparto (n° 2)], corredato da idonea cartellonistica conforme al D.lgs. 81/08.",
    "Pulsante di sgancio.",
    [L("Fornitura e posa in opera di pulsante di sgancio in scatola isolante rossa, con grado di protezione IP55, azionabile con la rottura del vetro di protezione.", "cad"),
     L("Segnalazione luminosa a corredo del pulsante di sgancio.", "cad"),
     L("Assistenza muraria per l’installazione ed il tracciamento della linea.", "a corpo"),
     L("Fornitura ed installazione linea in PVC dalla distribuzione principale al pulsante.", "a corpo")]),
  V("75-ds-pompe", "Locale pompe: estintori",
    "Nel locale pompe dovrà essere presente un estintore con capacità estinguente non inferiore a [34 A – 144 B][ e un estintore a CO2 se la potenza elettrica supera i 40 kW].",
    "Locale pompe.", [L("Fornitura e posa estintore nel locale pompe.", "cad", False)])])
_dopo("75", "75-ia", "75-ia-safecrash", [
  V("75-ia-dismissione", "Idranti non richiesti: dismissione (autorimessa fino a 50 auto)",
    "Poiché la capienza dell’autorimessa non supera i 50 autoveicoli [oppure: l’autorimessa si sviluppa su un solo piano interrato] (§ 6.1.0), l’impianto idranti non è richiesto. Si propone la dismissione degli idranti non necessari, con rimozione della cassetta e posa di tappo in ottone.",
    "Idranti non necessari.", [L("Dismissione degli idranti non necessari.", "cad", False)]),
  V("75-ia-progetto", "Progetto dell’impianto idrico antincendio",
    "Dovrà essere redatto il progetto dell’impianto idrico antincendio secondo la norma UNI 10779[, comprensivo di nuova rete, secondo contatore e gruppo di pompaggio].",
    "Impianto idrico antincendio.", [L("Redazione del progetto dell’impianto idrico antincendio.", "a corpo", False)])])
_dopo("75", "75-cs", "75-cs-integrare", [
  V("75-cs-norme", "Cartellonistica: norme di esercizio dell’autorimessa",
    "Si provveda ad installare la cartellonistica con le norme di esercizio e di comportamento all’interno dell’autorimessa [e all’ingresso dell’autorimessa].",
    "Ingresso autorimessa.", [CARTELLONISTICA])])

# ===== Attività 77: fusioni =====
_fondi("77", "77-vs", ["77-vs-aer-no", "77-vs-aer-altezza"],
  V("77-vs-aer-no", "Aerazione: vano scala, assente",
    "Nello stabile è presente n° [1] vano scala, avente altezza antincendio pari a [valore] m. Al momento del sopralluogo non è stata rilevata la presenza dell’aerazione permanente in sommità del vano scala (≥ 1,00 mq). Sarà necessario provvedere alla rimozione degli infissi vetrati presenti fino al raggiungimento di una superficie almeno pari a 1,00 mq, condizione soddisfatta con la rimozione di almeno n°[4] vetri presenti.\nProvvedere inoltre alla fornitura e posa di griglie alettate nella porzione dell’intervento[, dello stesso colore del telaio].",
    "Apertura di aerazione del vano scala.",
    [L("Rimozione vetrata vani scala.", "a corpo"), L("Fornitura e posa “alette in lamiera” per aerazione vano scala.", "a corpo")]))
_fondi("77", "77-lm", ["77-vs-lma-aer-ok", "77-lm-aer-naturale"],
  V("77-vs-lma-aer-ok", "Aerazione: locale macchine, presente",
    "È stata riscontrata [un’apertura d’areazione, all’interno del locale tecnico ascensore, che soddisfa i requisiti necessari (> 1 mq.) per un corretto smaltimento dei fumi in caso di incendio / un’apertura per l’aerazione naturale permanentemente aperta].",
    "Areazione presente nel locale macchine ascensore."))
_fondi("77", "77-me", ["77-me-attacco", "77-me-attacco-unico"],
  V("77-me-attacco", "Attacco motopompa: cartellonistica da integrare",
    "Completa l’impianto idrico antincendio n° [1] attacco di mandata per motopompa dei VV.F.[ di tipo UNI 70], posto [nei pressi dell’entrata del passo carrabile][ e a servizio di entrambe le colonne montanti], corredato da idonea cartellonistica conforme al D.lgs. 81/08[, da porre fuori dalla cassetta per una più rapida individuazione, e da cartellino di manutenzione semestrale].",
    "Attacco di mandata per motopompa VV.F.",
    [L("Fornitura e posa cartello per attacco di mandata per motopompa VV.F.", "cad")], gruppoEsclusivo="attacco-motopompa"))
_mod("77-me-manichette", testo=_per_id_tmp()["77-me-manichette"]["testo"] + " [Le lance in rame non conformi alla UNI 10779 (punto 3.11) vanno sostituite con modelli UNI EN 671-2.]")
_mod("77-cs-vie", testo="Si provveda all’installazione dell’apposita cartellonistica indicante i percorsi e le vie d’esodo ad ogni piano del vano scala [dall’ottavo al piano rialzato][ e nell’atrio condominiale].")
_mod("77-cs-presidi", testo="Si provveda a corredare i presidi (presidi antincendio ad ogni piano, estintori, attacco autopompa) con cartellonistica conforme al D.lgs. 81/08.")
_mod("77-vs-oggetti", testo="È vietato porre qualsiasi genere di materiale lungo le vie d’esodo in modo da non creare intralcio in caso di necessità; pertanto, sarà necessario rimuovere gli oggetti [(fioriere, materiali, oggetti vicino ai presidi antincendio)] nel vano scala e nei pianerottoli dal piano [copertura] al piano [terra].")

# ===== Attività 77: voci nuove =====
_dopo("77", "77-lm", "77-vs-lma-aer-no", [
  V("77-lm-foro-solai", "Foro comunicante con i solai: chiusura",
    "Nel locale macchine ascensore è presente un foro comunicante con i solai: dovrà essere chiuso con materiali aventi resistenza al fuoco non inferiore a REI [30].",
    "Foro comunicante con i solai.", [L("Chiusura del foro comunicante con i solai con materiali REI [30].", "a corpo")]),
  V("77-lm-camini", "Aerazione: camini dei vani corsa",
    "Si provveda a verificare i camini di aerazione dei vani corsa, che devono avere sezione di 0,20 mq e sfociare in atmosfera.",
    "Camini di aerazione.")])
_dopo("77", "77-me", "77-me-safecrash-danneggiati", [
  V("77-me-quadri", "Idranti: oggetti davanti alle cassette",
    "Davanti alle cassette degli idranti sono presenti [quadri / oggetti]: dovranno essere rimossi, perché le cassette siano sempre visibili e accessibili.",
    "Cassetta idranti.", [L("Rimozione di quadri e oggetti davanti alle cassette degli idranti.", "a corpo")]),
  V("77-ia-pressione", "Targhetta di manutenzione: pressione da chiarire",
    "La targhetta di manutenzione riporta una pressione di [3,8] bar, senza specificare se statica o dinamica. Si richiede alla ditta manutentrice il rapporto di funzionalità dell’impianto.",
    "Targhetta di manutenzione."),
  V("77-ia-progetto", "Progetto dell’impianto idrico antincendio",
    "Dovrà essere redatto il progetto dell’impianto idrico antincendio secondo la norma UNI 10779[, comprensivo di gruppo di pompaggio].",
    "Impianto idrico antincendio.", [L("Redazione del progetto dell’impianto idrico antincendio.", "a corpo", False)])])
_dopo("77", "77-vs", "77-vs-porta-copertura", [
  V("77-vs-porte-promemoria", "Porte: il progetto non le prevede (promemoria)",
    "Se il progetto approvato non prevede porte tagliafuoco, non si ravvisa la necessità di sostituirle; si segnala tuttavia che gli ispettori VV.F. potrebbero prescriverle in fase di sopralluogo.",
    "Porte esistenti."),
  V("77-vs-rilevatori", "Rilevatori in sommità: verifica del funzionamento",
    "I rilevatori in sommità collegati agli elettromagneti degli infissi dovranno essere verificati nel funzionamento.",
    "Rilevatori in sommità."),
  V("77-vs-gas-giallo", "Tubazione gas a vista da colorare di giallo",
    "La tubazione del gas a vista dovrà essere colorata di giallo e identificata nel tratto.",
    "Tubazione gas a vista.", [L("Tinteggiatura della tubazione gas a vista in smalto giallo.", "a corpo", False)]),
  V("77-vs-autoscale", "Accostamento autoscale VV.F.",
    "Il Comando ha prescritto l’accostamento delle autoscale dei VV.F.: la prescrizione dovrà essere rispettata.",
    "Accesso dei mezzi di soccorso.")])

# Gruppi esclusivi e titoli: aggiornati alle voci fuse
ESCLUSIVI.update({
  "potenzialita": ["74-ct-pot-ok", "74-ct-pot-diff"],
  "aerazione-centrale": ["74-ct-aer-ok", "74-ct-aer-ostruita"],
  "porta-centrale": ["74-ct-autochiusura", "74-ct-porta-grigliata", "74-ct-porta-sostituire", "74-ct-porta-regola"],
  "valvola-gas": ["74-ds-valvola", "74-ds-valvola-installare"],
  "disimpegno": ["74-ct-disimpegno-ok", "74-ct-disimpegno-no"],
  "aerazione-vano-scala": ["77-vs-aer-ok", "77-vs-aer-no"],
  "aerazione-locale-macchine": ["77-vs-lma-aer-ok", "77-vs-lma-aer-no"],
})
for _g in ("gas-giallo", "cartello-contatore", "estintore-centrale", "segnaletica-esodo"):
  ESCLUSIVI.pop(_g, None)
for _g, _ids in ESCLUSIVI.items():
  ESCLUSIVI[_g] = [i for i in _ids if i not in _RIMOSSE]
for _i in list(TITOLI):
  if _i in _RIMOSSE: TITOLI.pop(_i)
# le voci fuse hanno il titolo scritto qui sopra, non quello vecchio
_titolo_libero("74-ct-pot-ok", "74-ct-aer-ok", "74-ct-autochiusura", "74-ct-forometria", "74-ds-gas-giallo", "74-ds-estintore-ok", "74-ds-estintore-noman",
               "74-cs-integrare", "74-cf-termometro", "74-ct-materiale", "75-ds-estintori", "75-ar-griglia-ascensore", "75-ar-pvc-collari", "75-cs-integrare",
               "75-ar-cancello", "77-vs-aer-no", "77-vs-lma-aer-ok", "77-me-attacco", "75-ar-portone", "74-ds-emergenza")

_per_id = {v["id"]: (sz["id"], v) for f in libreria["famiglie"] for sz in f["sezioni"] for v in sz["voci"]}
for _g, _ids in ESCLUSIVI.items():
  assert len({_per_id[i][0] for i in _ids}) == 1, f"{_g}: le voci devono stare nella stessa sezione"
  for _i in _ids: _per_id[_i][1]["gruppoEsclusivo"] = _g
for _i, _t in TITOLI.items():
  assert _i in _per_id, f"voce inesistente: {_i}"
  _per_id[_i][1]["titolo"] = _t

# ---------------------------------------------------------------------------------------------
# Catalogo del computo: 56 voci tipo delle ROA 2024-2026 (codice, area A-H, descrizione, U.M.), senza prezzi.
# Fonte: scripts/dati/voci_tipo.json. Si aggiungono al computo di una zona dal passo "Riepilogo".
# ---------------------------------------------------------------------------------------------
_TIPI_AREA = {"A": ["74", "75", "77"], "B": ["74", "75", "77"], "C": ["74", "75", "77"], "D": ["75", "77"], "E": ["75", "77"], "F": ["74"], "G": ["75"], "H": ["74", "75", "77"]}
_SU_RICHIESTA = {"F.06", "F.07", "G.05", "G.06", "G.07", "H.07", "H.08"}  # poche occorrenze: solo se richieste dal progetto
def _um(t):
  """"cad." -> "cad"; dove nel computo compaiono due unità ("a corpo / mq") si propone la prima: si cambia dalla riga."""
  t = t.split("/")[0].strip().rstrip(".").lower()
  return t if t in ("cad", "mq", "ml", "kg", "h") else "a corpo"
with open(os.path.join(os.path.dirname(__file__), 'dati', 'voci_tipo.json'), encoding='utf-8') as _f:
  _voci_tipo = json.load(_f)
libreria["catalogoComputo"] = [
  {"cod": v["cod"], "area": v["area"], "descrizione": v["descrizione"], "um": _um(v["um"]),
   "tipi": _TIPI_AREA[v["cod"][0]], **({"suRichiesta": True} if v["cod"] in _SU_RICHIESTA else {})}
  for v in _voci_tipo]

out = os.path.join(os.path.dirname(__file__), '..', 'src', 'data', 'roa-dati.json')
with open(out, 'w', encoding='utf-8') as f:
    json.dump(libreria, f, ensure_ascii=False, indent=2)
n = sum(len(s['voci']) for fam in libreria['famiglie'] for s in fam['sezioni'])
print('scritto', out, 'voci:', n)
