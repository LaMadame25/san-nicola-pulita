# San Nicola Pulita — Backend condiviso (Netlify Blobs)

## Cosa fa
Prima, ogni post/like/commento viveva solo nel browser di chi lo scriveva — chiudendo la
pagina spariva, e ogni persona vedeva dati diversi. Ora 4 funzioni "server" salvano tutto
in un archivio condiviso (**Netlify Blobs**, gratuito e già incluso nel tuo piano Netlify):

- `posts-list.js` — restituisce tutti i post (e li inizializza al primissimo avvio)
- `posts-create.js` — salva una nuova segnalazione/discussione
- `posts-like.js` — aggiorna il numero di like condiviso
- `posts-comment.js` — aggiunge un commento condiviso

Netlify Blobs non richiede configurazione: appena il sito è collegato al tuo account
Netlify, le funzioni ci accedono automaticamente, senza chiavi da inserire.

## Come pubblicare (serve la CLI, come per l'IA foto — vedi sotto)
1. Apri il terminale nella cartella di questo progetto
2. `npm install` (scarica la libreria `@netlify/blobs`)
3. `netlify login` (se non l'hai già fatto)
4. `netlify deploy --prod` — collega il sito esistente ("friendly-buttercream...")

Da questo momento, tutte le segnalazioni/like/commenti sono visibili a chiunque apra il
sito, non solo a chi li ha scritti.

## Limite da tenere a mente
Le foto vengono salvate come testo dentro il post (base64): funziona, ma con **molte**
foto l'archivio cresce in fretta. Se il progetto cresce, il prossimo passo utile sarà
spostare le foto su **Netlify Blobs a parte** (store dedicato) invece che dentro il post
stesso — te lo ricordo quando sarà il momento.

---

# Come attivare l'analisi IA delle foto — guida passo passo

## 1. Procurati la chiave API Anthropic
1. Vai su **console.anthropic.com** e registrati (o accedi)
2. Aggiungi un metodo di pagamento in **Settings → Billing** (anche pochi euro bastano per iniziare — imposta un limite di spesa mensile qui per stare tranquillo)
3. Vai su **Settings → API Keys → Create Key**
4. Dai un nome alla chiave (es. "San Nicola Pulita") e creala
5. **Copiala subito** — Anthropic la mostra una sola volta. Se la perdi, dovrai crearne un'altra.

## 2. Carica questo pacchetto su Netlify (NON con il drag-and-drop semplice)
Il drag-and-drop di netlify.com/drop funziona solo per siti senza funzioni. Ora che abbiamo una funzione serverless, serve un metodo diverso:

**Opzione consigliata — Netlify CLI (dal computer, non dal telefono):**
1. Installa Node.js se non ce l'hai già (nodejs.org)
2. Apri il terminale nella cartella di questo progetto
3. Esegui: `npm install -g netlify-cli`
4. Esegui: `netlify login` (si apre il browser per autorizzare)
5. Esegui: `netlify deploy --prod`
6. Segui le istruzioni a schermo (la prima volta ti chiede di creare un nuovo sito o collegare quello esistente — collega quello che hai già, "friendly-buttercream...")

## 3. Aggiungi la chiave API su Netlify (mai nel codice!)
1. Vai su **app.netlify.com** → il tuo sito → **Site settings → Environment variables**
2. Clicca **Add a variable**
3. Nome: `ANTHROPIC_API_KEY`
4. Valore: la chiave che hai copiato al punto 1 (inizia con `sk-ant-...`)
5. Salva, poi rifai il deploy (`netlify deploy --prod`) perché la variabile venga letta

## 4. Testa
Apri il sito pubblico, vai su "Segnala", carica una foto — dovresti vedere l'analisi vera.

---

**Perché non basta il semplice trascinamento su netlify.com/drop?**
Quel metodo carica solo file statici (HTML/CSS/JS che gira nel browser). La funzione che analizza le foto deve girare *sul server* per tenere nascosta la chiave — per questo serve un deploy "vero" con la CLI, che carica anche la cartella `netlify/functions`.

**Attenzione ai costi:** ogni foto analizzata costa una piccola frazione di centesimo. Con un limite di spesa mensile impostato su console.anthropic.com non rischi sorprese.
