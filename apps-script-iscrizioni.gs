/**
 * XVI CONVEGNO AREA NORD GIE ANCE — Torino, 22-23 ottobre 2026
 * ------------------------------------------------------------------
 * Backend delle iscrizioni, interamente pilotato dal foglio «Modulo»:
 *   - titoli, sottotitoli, domande, opzioni e prezzi si modificano dal foglio,
 *     senza intervenire sul codice né sul sito;
 *   - le adesioni sono registrate nel foglio «Iscrizioni» con numero progressivo;
 *   - la contabile del bonifico è archiviata nella cartella Drive indicata;
 *   - al partecipante è inviato il promemoria da giovani@ancepiemonte.it.
 *
 * ISTRUZIONI DI INSTALLAZIONE (eseguire con l'account giovani@ancepiemonte.it)
 * ------------------------------------------------------------------
 * 1. Nel foglio delle iscrizioni creare la scheda «Modulo» e importarvi il file
 *    iscrizioni-modulo-config.csv (File → Importa → Inserisci nuovo foglio).
 * 2. Estensioni → Apps Script: incollare questo codice e salvare.
 * 3. Esegui → funzione «setup» → autorizzare gli accessi (Fogli, Drive, Gmail).
 * 4. Distribuisci → Nuova distribuzione → tipo «App web»:
 *       Esegui come:            Me (giovani@ancepiemonte.it)
 *       Chi ha accesso all'app: Tutti
 *    Copiare l'URL che termina con /exec.
 * 5. Incollare l'URL in index.html nella costante ISCRIZIONI_ENDPOINT.
 *
 * A ogni modifica del CODICE occorre aggiornare la distribuzione.
 * Le modifiche al FOGLIO «Modulo» sono invece immediate.
 */

const CONFIG = {
  SHEET_ID:         '10bEs-HFJUwouf7jDV4vbpPeoG8iMtLQ_6-SR8bysecs',
  FOGLIO_MODULO:    'Modulo',
  FOGLIO_RISPOSTE:  'Iscrizioni',
  DRIVE_FOLDER_ID:  '14HeVzp_Bp7gWnvBQW9cQ7gFO72VMS73S',
  MITTENTE_NOME:    'ANCE Giovani Area Nord',
  SEGRETERIA_EMAIL: 'giovani@ancepiemonte.it',
  ANNO:             '2026',
  MAX_FILE_MB:      5,
  FUSO:             'Europe/Rome'
};

/** Colonne attese nel foglio «Modulo». */
const COL = { ORDINE: 0, ID: 1, TIPO: 2, ETICHETTA: 3, DESCRIZIONE: 4,
              OPZIONI: 5, PREZZO: 6, OBBLIGATORIA: 7, ATTIVA: 8 };

/** Colonne di servizio aggiunte in coda al foglio «Iscrizioni». */
const COLONNE_FINALI = ['TOTALE da bonificare', 'Causale bonifico', 'Contabile allegata',
                        'Nome file contabile', 'Link contabile su Drive',
                        'E-mail promemoria inviata', 'Pagamento verificato', 'Note'];

/* ========================= LETTURA CONFIGURAZIONE ========================= */

/** Restituisce la struttura del modulo leggendo il foglio «Modulo». */
function leggiConfigurazione_() {
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  const sh = ss.getSheetByName(CONFIG.FOGLIO_MODULO);
  if (!sh) throw new Error('Foglio «' + CONFIG.FOGLIO_MODULO + '» non trovato.');

  const dati = sh.getDataRange().getValues();
  const voci = [];
  for (let i = 1; i < dati.length; i++) {            // riga 1 = intestazioni
    const r = dati[i];
    const tipo = String(r[COL.TIPO] || '').trim().toLowerCase();
    if (!tipo) continue;
    if (String(r[COL.ATTIVA] || 'SI').trim().toUpperCase() === 'NO') continue;

    voci.push({
      ordine: Number(r[COL.ORDINE]) || i,
      id: String(r[COL.ID] || '').trim(),
      tipo: tipo,
      etichetta: String(r[COL.ETICHETTA] || '').trim(),
      descrizione: String(r[COL.DESCRIZIONE] || '').trim(),
      opzioni: String(r[COL.OPZIONI] || '').split('|').map(function (s) { return s.trim(); })
                 .filter(function (s) { return s; }),
      prezzo: Number(String(r[COL.PREZZO] || '0').toString().replace(',', '.')) || 0,
      prezzoTesto: String(r[COL.PREZZO] == null ? '' : r[COL.PREZZO]).trim(),
      obbligatoria: String(r[COL.OBBLIGATORIA] || 'NO').trim().toUpperCase() === 'SI'
    });
  }
  voci.sort(function (a, b) { return a.ordine - b.ordine; });
  return voci;
}

/** Sole voci che raccolgono un dato (escluse quelle puramente descrittive). */
function campiDato_(voci) {
  const descrittivi = { titolo: 1, sottotitolo: 1, informativa: 1 };
  return voci.filter(function (v) { return v.id && !descrittivi[v.tipo]; });
}

const MESI = { gennaio: '01', febbraio: '02', marzo: '03', aprile: '04', maggio: '05',
               giugno: '06', luglio: '07', agosto: '08', settembre: '09', ottobre: '10',
               novembre: '11', dicembre: '12' };

/**
 * Intestazione compatta per il foglio delle risposte.
 * «23 ottobre 2026, ore 10:00 — Consiglio Nazionale…» diventa «23/10 Consiglio Nazionale…».
 * ATTENZIONE: se si modifica questa regola cambiano le intestazioni generate.
 */
function titoloColonna_(v) {
  let t = String(v.etichetta || v.id || '').trim();
  const m = t.match(/^\s*(\d{1,2})\s+([A-Za-zàèéìòù]+)\s+(\d{4})\s*,?\s*/);
  if (m) {
    const gg = ('0' + m[1]).slice(-2);
    const mm = MESI[m[2].toLowerCase()] || '';
    t = t.substring(m[0].length)
         .replace(/^ore\s+[\d.:]+\s*[—–-]?\s*/i, '')
         .replace(/^[—–-]\s*/, '').trim();
    t = gg + '/' + mm + ' ' + t;
  }
  if (v.tipo === 'consenso') t = 'Consenso: ' + t;
  if (t.length > 58) t = t.substring(0, 55).trim() + '…';
  return t;
}

const PAROLE_VUOTE = { di:1, del:1, dello:1, della:1, dei:1, delle:1, al:1, allo:1, alla:1,
                       ai:1, agli:1, alle:1, il:1, lo:1, la:1, i:1, gli:1, le:1, un:1, una:1,
                       e:1, ed:1, a:1, in:1, per:1, con:1, su:1, da:1, presso:1 };

/**
 * Sigla sintetica dell'attività, per la causale del bonifico.
 * «22 ottobre 2026, ore 20:00 — Cena al Ristorante Arcadia» → CENA22
 * Non è impiegato alcun carattere barra, che taluni sistemi bancari rifiutano.
 */
function sigla_(v) {
  const et = String(v.etichetta || '');
  const g = et.match(/^\s*(\d{1,2})\s+[A-Za-zàèéìòù]+\s+\d{4}/);
  const giorno = g ? g[1] : '';
  const resto = et.replace(/^\s*\d{1,2}\s+[A-Za-zàèéìòù]+\s+\d{4}\s*,?\s*/, '')
                  .replace(/^ore\s+[\d.:]+\s*[—–-]?\s*/i, '')
                  .replace(/^[—–-]\s*/, '');
  const parole = resto.replace(/[^0-9A-Za-zÀ-ÿ\s]/g, ' ').split(/\s+/).filter(function (s) { return s; });
  let chiave = '';
  for (let i = 0; i < parole.length; i++) {
    if (!PAROLE_VUOTE[parole[i].toLowerCase()]) { chiave = parole[i]; break; }
  }
  chiave = chiave.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]/g, '');
  return (chiave.toUpperCase() + giorno).trim();
}

/** Causale: chi paga, per quale evento e per quali attività. */
function causale_(cognome, nome, sigle) {
  const chi = (String(cognome || '') + ' ' + String(nome || '')).trim().toUpperCase();
  return (chi + ' Convegno Area Nord OTT26' + (sigle.length ? ' ' + sigle.join(' ') : '')).trim();
}

/* ============================== SETUP ============================== */

function setup() {
  const voci = leggiConfigurazione_();
  const sh = getFoglioRisposte_(voci);
  DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);   // verifica accesso alla cartella
  SpreadsheetApp.flush();
  Logger.log('Voci del modulo lette: %s', voci.length);
  Logger.log('Foglio risposte: %s (righe: %s)', sh.getName(), sh.getLastRow());
  Logger.log('Installazione completata. Procedere con la distribuzione come App web.');
}

/** Foglio risposte: le intestazioni sono generate dalla configurazione. */
function getFoglioRisposte_(voci) {
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  let sh = ss.getSheetByName(CONFIG.FOGLIO_RISPOSTE);
  if (!sh) sh = ss.insertSheet(CONFIG.FOGLIO_RISPOSTE);

  if (sh.getLastRow() === 0) {
    const testate = ['N. iscrizione', 'Data e ora invio']
      .concat(campiDato_(voci).map(titoloColonna_))
      .concat(COLONNE_FINALI);
    sh.getRange(1, 1, 1, testate.length).setValues([testate])
      .setFontWeight('bold').setBackground('#0056A0').setFontColor('#ffffff');
    sh.setFrozenRows(1);
    sh.setColumnWidth(1, 110);
    sh.setColumnWidth(2, 140);
  }
  return sh;
}

/* ============================ ENDPOINT WEB ============================ */

/** Il sito richiama questo indirizzo per costruire il modulo. */
function doGet(e) {
  try {
    const voci = leggiConfigurazione_();
    return json_({ ok: true, voci: voci });
  } catch (err) {
    return json_({ ok: false, errore: err.message });
  }
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) throw new Error('Richiesta priva di dati.');
    const d = JSON.parse(e.postData.contents);
    const risposte = d.risposte || {};

    const voci = leggiConfigurazione_();
    const campi = campiDato_(voci);

    /* ---------- validazione lato server ---------- */
    campi.forEach(function (v) {
      if (!v.obbligatoria) return;
      const val = risposte[v.id];
      const vuoto = (val === undefined || val === null || val === '' ||
                     (Array.isArray(val) && !val.length) || val === false);
      if (vuoto && v.tipo !== 'file') {
        throw new Error('Campo obbligatorio mancante: ' + (v.etichetta || v.id));
      }
    });

    const email = String(risposte.email || '').trim();
    if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(email)) throw new Error('Indirizzo e-mail non valido.');

    /* ---------- totale calcolato dai prezzi del foglio ---------- */
    let totale = 0; const sigle = [];
    campi.forEach(function (v) {
      if (v.prezzo > 0 && String(risposte[v.id]).toUpperCase() === 'SI') {
        totale += v.prezzo; sigle.push(sigla_(v));
      }
    });

    const haFile = !!(d.file && d.file.dati);
    if (totale > 0 && !haFile) {
      throw new Error('La contabile del bonifico è obbligatoria per le attività a pagamento.');
    }

    /* ---------- scrittura protetta (numero progressivo) ---------- */
    const lock = LockService.getScriptLock();
    if (!lock.tryLock(30000)) throw new Error('Sistema momentaneamente occupato: riprovare tra qualche istante.');

    let esito;
    try {
      const sh = getFoglioRisposte_(voci);
      const numero = CONFIG.ANNO + '-' + Utilities.formatString('%03d', sh.getLastRow());
      const cognome = String(risposte.cognome || '').trim().toUpperCase();
      const nome = String(risposte.nome || '').trim();
      const causale = causale_(cognome, nome, sigle);

      let fileNome = '', fileUrl = '';
      if (haFile) {
        const salvato = salvaContabile_(d.file, numero, cognome, nome);
        fileNome = salvato.nome; fileUrl = salvato.url;
      }

      const adesso = new Date();
      const riga = [numero, adesso].concat(
        campi.map(function (v) {
          const val = risposte[v.id];
          if (Array.isArray(val)) return val.join('; ');
          if (val === true) return 'SI';
          if (val === false || val === undefined || val === null) return '';
          return val;
        })
      ).concat([
        totale, causale, haFile ? 'SI' : 'NO', fileNome, fileUrl,
        '', '', ''
      ]);

      sh.appendRow(riga);
      const rigaScritta = sh.getLastRow();
      const colEmail = 2 + campi.length + 6;   // 6ª colonna di servizio

      let emailEsito;
      try {
        inviaPromemoria_(voci, campi, risposte, numero, causale, totale, fileNome);
        emailEsito = 'SI ' + Utilities.formatDate(new Date(), CONFIG.FUSO, 'dd/MM/yyyy HH:mm');
      } catch (err) {
        emailEsito = 'NO — ' + err.message;
      }
      sh.getRange(rigaScritta, colEmail).setValue(emailEsito);

      esito = { ok: true, numero: numero, totale: totale, causale: causale,
                emailInviata: emailEsito.indexOf('SI') === 0 };
    } finally {
      lock.releaseLock();
    }
    return json_(esito);

  } catch (err) {
    return json_({ ok: false, errore: err.message });
  }
}

/* ========================= FUNZIONI DI SERVIZIO ========================= */

function salvaContabile_(file, numero, cognome, nome) {
  const ammessi = ['pdf', 'jpg', 'jpeg', 'png', 'heic'];
  const tipo = String(file.tipo || '').toLowerCase();
  const daTipo = { 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/jpg': 'jpg',
                   'image/png': 'png', 'image/heic': 'heic' }[tipo];
  const est = daTipo || String(file.nome || '').split('.').pop().toLowerCase();
  if (ammessi.indexOf(est) === -1) throw new Error('Formato non ammesso: sono accettati PDF, JPG, PNG.');

  const bytes = Utilities.base64Decode(file.dati);
  if (bytes.length > CONFIG.MAX_FILE_MB * 1024 * 1024) {
    throw new Error('Il file supera ' + CONFIG.MAX_FILE_MB + ' MB.');
  }

  const pulito = function (s) {
    return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '')
                    .replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  };
  const nomeFile = numero + '_' + pulito(cognome) + '_' + pulito(nome) + '.' + est;
  const blob = Utilities.newBlob(bytes, tipo || 'application/octet-stream', nomeFile);
  const salvato = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID).createFile(blob);
  return { nome: nomeFile, url: salvato.getUrl() };
}

function inviaPromemoria_(voci, campi, risposte, numero, causale, totale, fileNome) {
  const eur = function (n) { return '€ ' + Number(n).toFixed(2).replace('.', ','); };
  const esc = function (s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  };

  /* attività: tutte le voci a scelta Sì/No con risposta affermativa */
  let righeAttivita = '';
  voci.forEach(function (v) {
    if (v.tipo !== 'sino') return;
    if (String(risposte[v.id]).toUpperCase() !== 'SI') return;
    const costo = v.prezzo > 0 ? eur(v.prezzo) : 'nessun costo';
    righeAttivita +=
      '<tr><td style="padding:10px 12px;border-bottom:1px solid #e6e6e6">' +
        '<strong>' + esc(v.etichetta) + '</strong>' +
        (v.descrizione ? '<br><span style="color:#666;font-size:13px">' + esc(v.descrizione) + '</span>' : '') +
      '</td>' +
      '<td style="padding:10px 12px;border-bottom:1px solid #e6e6e6;text-align:right;white-space:nowrap">' +
        costo + '</td></tr>';
  });
  if (!righeAttivita) {
    righeAttivita = '<tr><td colspan="2" style="padding:12px;color:#666">Nessuna attività selezionata.</td></tr>';
  }

  /* dati anagrafici: tutte le voci non "sino" e non file/consenso */
  let righeDati = '';
  campi.forEach(function (v) {
    if (['sino', 'file', 'consenso'].indexOf(v.tipo) !== -1) return;
    let val = risposte[v.id];
    if (Array.isArray(val)) val = val.join(', ');
    if (val === undefined || val === null || val === '') return;
    righeDati +=
      '<tr><td style="padding:6px 0;color:#666;width:40%">' + esc(v.etichetta) + '</td>' +
      '<td style="padding:6px 0">' + esc(val) + '</td></tr>';
  });

  /* riquadro bonifico: i dati sono presi dalle voci «informativa» del foglio */
  let testoInformativa = '';
  voci.forEach(function (v) {
    if (v.tipo === 'informativa') {
      testoInformativa += '<div style="font-weight:700;color:#0056A0;margin-bottom:6px">' +
                          esc(v.etichetta) + '</div>' +
                          '<div style="font-size:14px;line-height:1.8;color:#333">' +
                          esc(v.descrizione).replace(/\n/g, '<br>') + '</div>';
    }
  });

  const bonifico = totale > 0
    ? '<div style="margin:22px 0;padding:16px 18px;background:#FFF8E0;border-left:4px solid #FF8C00">' +
        '<div style="font-size:16px;font-weight:700;color:#B03020;margin-bottom:10px">' +
        (fileNome ? 'Bonifico ' + eur(totale) : 'Importo da bonificare: ' + eur(totale)) + '</div>' +
        testoInformativa +
        '<div style="margin-top:10px;font-size:14px;color:#333">Causale: <strong>' + esc(causale) + '</strong></div>' +
        (fileNome ? '<div style="margin-top:10px;font-size:13px;color:#1a5e1a">' +
                    'Contabile ricevuta correttamente (' + esc(fileNome) + ').</div>' : '') +
        '<div style="margin-top:10px;font-size:13px;color:#8a6d00">' +
        'L\'importo riguarda esclusivamente le attività selezionate. Il soggiorno alberghiero ' +
        'non vi è compreso: la prenotazione è a carico del partecipante e si salda direttamente ' +
        'alla struttura.</div>' +
      '</div>'
    : '<div style="margin:22px 0;padding:14px 18px;background:#eef6ff;border-left:4px solid #0077C0;font-size:14px;color:#333">' +
      'Le attività selezionate non prevedono alcun costo: non è richiesto alcun bonifico.</div>';

  const html =
    '<div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;color:#222">' +
      '<div style="background:#0056A0;padding:22px 24px;color:#fff">' +
        '<div style="font-size:19px;font-weight:700">XVI Convegno Area Nord GIE ANCE</div>' +
        '<div style="font-size:14px;margin-top:6px;opacity:.92">Torino, 22-23 ottobre 2026</div>' +
      '</div>' +
      '<div style="padding:24px">' +
        '<p style="font-size:15px">Gentile ' + esc(risposte.nome) + ' ' + esc(String(risposte.cognome).toUpperCase()) + ',</p>' +
        '<p style="font-size:15px;line-height:1.6">si conferma la ricezione della Sua iscrizione. ' +
        'Di seguito il riepilogo dei dati trasmessi, da conservare come promemoria.</p>' +
        '<div style="margin:20px 0;padding:14px 18px;background:#f4f7fa;border:1px solid #dde5ec">' +
          '<div style="font-size:13px;color:#666">Numero di iscrizione</div>' +
          '<div style="font-size:22px;font-weight:700;color:#0056A0">' + numero + '</div>' +
        '</div>' +
        '<table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px">' + righeDati + '</table>' +
        '<div style="font-size:15px;font-weight:700;color:#0056A0;margin:22px 0 8px">Attività confermate</div>' +
        '<table style="width:100%;border-collapse:collapse;font-size:14px;border-top:2px solid #0056A0">' +
          righeAttivita + '</table>' +
        bonifico +
        '<p style="font-size:13px;color:#666;line-height:1.7;margin-top:24px;padding-top:16px;border-top:1px solid #e6e6e6">' +
          'Per qualsiasi variazione si prega di scrivere a ' +
          '<a href="mailto:' + CONFIG.SEGRETERIA_EMAIL + '" style="color:#0056A0">' + CONFIG.SEGRETERIA_EMAIL + '</a>.</p>' +
        '<p style="font-size:13px;color:#666">Cordiali saluti,<br><strong>Segreteria organizzativa</strong><br>' +
        CONFIG.MITTENTE_NOME + '</p>' +
      '</div></div>';

  MailApp.sendEmail({
    to: String(risposte.email).trim(),
    subject: 'Iscrizione ' + numero + ' — XVI Convegno Area Nord GIE ANCE',
    htmlBody: html,
    name: CONFIG.MITTENTE_NOME,
    replyTo: CONFIG.SEGRETERIA_EMAIL
  });
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
