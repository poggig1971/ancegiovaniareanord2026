# Aggiornamento del modulo iscrizioni — accompagnatore pagante

Data: 4 settembre 2026 · Interventi su `index.html`, `apps-script-iscrizioni.gs`,
`iscrizioni-modulo-config.csv`.

Copia integrale dei file precedenti: cartella `backup_pre-accompagnatore_20260904_1020`.

---

## Che cosa è stato introdotto

**Dati del partecipante** — una casella «Partecipa un accompagnatore»; alla sua
selezione compaiono i campi *Cognome* e *Nome* dell'accompagnatore, che divengono
obbligatori.

**Esigenze alimentari dell'accompagnatore** — sezione richiudibile autonoma,
speculare a quella del partecipante, visibile soltanto in presenza della casella
selezionata. Il consenso al trattamento è richiesto ove siano indicate esigenze
proprie oppure dell'accompagnatore.

**Adesione alle attività** — sulle sole attività a pagamento compare una terza
scelta, «Sì, ACCOMPAGNATORE», accanto a «Sì, partecipo» e «No, non partecipo»:

| Attività | Quota partecipante | Quota accompagnatore |
|---|---|---|
| 22 ott. — Cena al Ristorante Arcadia | € 60,00 | € 60,00 |
| 23 ott. — Aperitivo, Cena e Centralino Club | € 100,00 | € 100,00 |
| 24 ott. — Visita al Museo | € 18,00 | € 18,00 |
| 24 ott. — Pranzo | pagamento in loco | pagamento in loco |
| 23 ott. — Light Lunch | gratuito | gratuito |
| 23 ott. — XVI Convegno Area Nord | gratuito | gratuito |

Il Light Lunch e il Convegno del 23 ottobre ammettono l'accompagnatore a titolo
gratuito: la scelta è registrata nella colonna «Attività accompagnatore» del
foglio, senza concorrere al bonifico. Il solo Consiglio Nazionale Giovani, in
quanto organo statutario, non lo ammette.

**Ospiti** — l'esenzione riguarda il solo partecipante: la quota dell'eventuale
accompagnatore resta dovuta. In tal caso il modulo richiede il bonifico della sola
quota dell'accompagnatore e la relativa contabile, con causale dedicata
(es. `VERNAZZA EDOARDO Convegno Area Nord OTT26 ACC VISITA24`).

**Riepilogo e promemoria** — il totale espone la ripartizione fra quota del
partecipante e quota dell'accompagnatore; la stessa ripartizione compare nel
messaggio di posta elettronica di conferma.

---

## Operazioni da eseguire — nell'ordine

### 1. Foglio «Modulo»

Il foglio contiene ora **sei nuove righe** e **una nuova colonna J
(«Accompagnatore»)**. Procedura consigliata:

1. Aprire il foglio, scheda **Modulo**
2. **File → Importa** → caricare `iscrizioni-modulo-config.csv`
   - Posizione di importazione: **Sostituisci foglio corrente**
   - Tipo di separatore: **Rilevamento automatico**

La colonna J indica quali attività ammettono l'accompagnatore (`SI` / `NO`). Se
non venisse compilata, lo script applica in automatico il criterio delle sole
attività a pagamento: il risultato è il medesimo.

### 2. Foglio «Iscrizioni» — allineamento delle intestazioni

Il foglio contiene già le adesioni pervenute: **non va ricreato**. Occorre
inserire le otto nuove colonne nelle posizioni corrette.

1. **Estensioni → Apps Script**
2. Cancellare il codice presente e incollare il nuovo `apps-script-iscrizioni.gs`
3. Salvare
4. Selezionare la funzione **`aggiornaIntestazioni`** e premere **Esegui**

La funzione inserisce le sole colonne mancanti spostando a destra il contenuto
esistente: **le iscrizioni già registrate restano allineate alle proprie
intestazioni**. Il confronto ignora maiuscole, accenti e virgolette, sicché nessuna
colonna già presente viene duplicata.

Colonne inserite (verificate sul file `MACROAREA ISCRIZIONI.xlsx`, 985 righe):

| Posizione | Intestazione |
|---|---|
| 8 | Partecipa un accompagnatore |
| 9 | Cognome dell'accompagnatore |
| 10 | Nome dell'accompagnatore |
| 13 | Esigenze alimentari dell'accompagnatore |
| 14 | Se «Altro», specificare — accompagnatore |
| 27 | Attività accompagnatore |
| 28 | Quota partecipante |
| 29 | Quota accompagnatore |

Il foglio passa da 29 a 37 colonne. **Si raccomanda di duplicare il foglio
(`File → Crea una copia`) prima di eseguire la funzione.**

### 3. Nuova distribuzione dello script

Le modifiche al codice non sono attive finché non si aggiorna la distribuzione:

**Distribuisci → Gestisci distribuzioni →** (icona matita) **→ Versione: Nuova
versione → Distribuisci**

L'URL `/exec` non cambia: nessun intervento su `index.html` è richiesto per questo.

### 4. Pubblicazione del sito

`index.html` è già aggiornato: è sufficiente il consueto rilascio su Vercel.

---

## Verifiche consigliate dopo il rilascio

1. Modulo aperto senza casella selezionata → nessun riferimento all'accompagnatore
2. Casella selezionata → compaiono i campi del nominativo, la sezione alimentare
   e le tre scelte sulle sole quattro attività a pagamento
3. Partecipante con cena e serata per sé e per l'accompagnatore → totale € 320,00
   (€ 160,00 + € 160,00)
4. Nominativo presente nel foglio **Ospiti** con accompagnatore alla sola visita al
   museo → totale € 18,00, contabile richiesta
5. Invio di prova → controllo della riga scritta nel foglio e del promemoria ricevuto
