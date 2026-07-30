# Modulo iscrizioni — istruzioni di attivazione

Tre passaggi, da eseguire **con l'account giovani@ancepiemonte.it**.

---

## Passaggio 1 — Preparare il foglio

1. Aprire il foglio delle iscrizioni:
   `https://docs.google.com/spreadsheets/d/10bEs-HFJUwouf7jDV4vbpPeoG8iMtLQ_6-SR8bysecs`
2. **File → Importa** → caricare `iscrizioni-modulo-config.csv`
   - Posizione di importazione: **Inserisci nuovo foglio**
   - Rinominare il foglio così creato in esattamente **`Modulo`**

Il foglio `Iscrizioni`, che raccoglierà le adesioni, viene creato automaticamente
con le intestazioni corrette al primo avvio: non occorre predisporlo.

---

## Passaggio 2 — Installare lo script

1. Nel foglio: **Estensioni → Apps Script**
2. Cancellare il codice presente e incollare il contenuto di `apps-script-iscrizioni.gs`
3. Salvare (icona del dischetto)
4. In alto scegliere la funzione **`setup`** e premere **Esegui**
   - Google chiederà l'autorizzazione per Fogli, Drive e Gmail: concederla
   - comparirà l'avviso «App non verificata»: *Avanzate → Apri comunque*
     (è normale per gli script personali)
5. **Distribuisci → Nuova distribuzione**
   - tipo: **App web**
   - Esegui come: **Me (giovani@ancepiemonte.it)**
   - Chi ha accesso: **Tutti**
   - Premere **Distribuisci** e **copiare l'URL** che termina con `/exec`

---

## Passaggio 3 — Collegare il sito

Aprire `index.html` e sostituire il segnaposto con l'URL copiato:

```javascript
const ISCRIZIONI_ENDPOINT = 'INCOLLARE_QUI_URL_APPS_SCRIPT';
```

diventa, ad esempio:

```javascript
const ISCRIZIONI_ENDPOINT = 'https://script.google.com/macros/s/AKfycb…/exec';
```

Quindi pubblicare:

```bash
cd C:\Users\Gianluca\macroareanord
git add -A
git commit -m "Modulo iscrizioni collegato"
git push
```

---

## Come modificare titoli, domande e prezzi

Tutto si governa dal foglio **`Modulo`**: le modifiche sono immediate,
non serve toccare il sito né ridistribuire lo script.

| Colonna | A cosa serve |
|---------|--------------|
| **Ordine** | Numero che determina la sequenza. Conviene procedere per decine (10, 20, 30…) così da poter inserire voci intermedie senza rinumerare. |
| **ID** | Nome tecnico del campo. **Non modificare** gli ID esistenti: sono richiamati dal codice. Vuoto per titoli e testi informativi. |
| **Tipo** | Vedere la tabella sottostante. |
| **Etichetta** | Il testo della domanda o del titolo. |
| **Descrizione** | Sottotitolo o testo di aiuto sotto la domanda. |
| **Opzioni** | Elenco delle scelte, separate dal carattere `\|`. |
| **Prezzo** | Importo dell'attività. Se maggiore di zero concorre al totale del bonifico. |
| **Obbligatoria** | `SI` / `NO`. |
| **Attiva** | `NO` nasconde la voce senza cancellarla. |

### Tipi disponibili

| Tipo | Effetto |
|------|---------|
| `titolo` | Titolo di sezione (con eventuale sottotitolo nella Descrizione) |
| `sottotitolo` | Solo testo descrittivo |
| `informativa` | Riquadro evidenziato, usato per i dati del bonifico |
| `testo` | Campo di testo |
| `email` | Campo di posta elettronica, con controllo di validità |
| `tel` | Campo telefonico |
| `select` | Menù a tendina (voci nella colonna Opzioni) |
| `checkbox` | Scelta multipla (voci nella colonna Opzioni) |
| `sino` | «Sì, partecipo» / «No, non partecipo». Usa la colonna Prezzo |
| `file` | Caricamento della contabile |
| `consenso` | Casella di conferma |

### Esempi pratici

**Variare un prezzo:** modificare la colonna Prezzo della riga interessata.
Il totale sul sito e nell'email si aggiorna da sé.

**Aggiungere un'attività:** nuova riga con Ordine intermedio (es. 165),
un ID nuovo e mai usato (es. `visitaGuidata`), Tipo `sino`, il prezzo e `SI`
in Obbligatoria e Attiva.
*Avvertenza:* aggiungendo un campo cambia il numero di colonne del foglio
`Iscrizioni`. Se sono già presenti adesioni, conviene aggiungere la nuova
colonna a mano nella posizione corrispondente, per non disallineare i dati
già raccolti.

**Sospendere un'attività:** porre `NO` nella colonna Attiva.

---

## Cosa succede a ogni iscrizione

1. Al partecipante è attribuito un **numero progressivo** (`2026-001`, `2026-002`…).
2. I dati sono scritti nel foglio **`Iscrizioni`**.
3. La contabile è archiviata nella cartella Drive **Macroarea contabili**,
   con nome `2026-001_COGNOME_NOME.pdf`; il collegamento è riportato nel foglio.
4. Al partecipante è inviato il **promemoria** da giovani@ancepiemonte.it con
   riepilogo, importo, IBAN e causale.
5. Il totale è calcolato dal sito **e ricontrollato dal servizio**: eventuali
   manomissioni della pagina non alterano l'importo registrato.

La contabile è richiesta soltanto se il totale è maggiore di zero; in assenza
di attività a pagamento il campo non viene nemmeno mostrato.

---

## Verifiche consigliate al primo avvio

1. Aprire la sezione **Iscrizioni** del sito: il modulo deve comparire con i
   titoli e le domande del foglio.
2. Effettuare **un'iscrizione di prova** con un proprio indirizzo, selezionando
   almeno un'attività a pagamento e allegando un PDF qualsiasi. Verificare che:
   - compaia il numero di iscrizione;
   - la riga sia presente nel foglio `Iscrizioni`;
   - il file sia nella cartella Drive con il nome corretto;
   - l'email di promemoria sia recapitata.
3. Cancellare la riga di prova e il file di prova.

### Se il modulo non si carica

Le distribuzioni Apps Script possono richiedere qualche minuto per attivarsi.
Verificare inoltre che:

- la distribuzione sia impostata su «Chi ha accesso: **Tutti**»;
- l'URL termini con `/exec` (non con `/dev`);
- dopo ogni modifica al **codice** sia stata aggiornata la distribuzione.

Per una diagnosi rapida è possibile aprire l'URL `/exec` direttamente nel
browser: deve restituire un testo che inizia con `{"ok":true,"voci":[…`.

---

## Limiti da conoscere

- **Dimensione della contabile:** massimo 5 MB. Modificabile nel codice
  (`MAX_FILE_MB`), tenendo presente che file molto grandi rallentano l'invio.
- **Invio di posta:** Google Workspace consente un numero elevato ma non
  illimitato di messaggi al giorno. Per le dimensioni attese del convegno non
  vi sono criticità.
- **Nessun controllo sui posti:** come richiesto, non sono previsti limiti di
  capienza.
- **Il pagamento non è verificato automaticamente:** la contabile è una
  dichiarazione del partecipante. La riconciliazione resta a cura della
  segreteria, che può annotarla nella colonna «Pagamento verificato».
