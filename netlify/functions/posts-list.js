
const { getStore } = require("@netlify/blobs");

// Post "di partenza" — servono solo a non mostrare un'app vuota al primissimo avvio.
const SEED_POSTS = [
  {
    id: "p1", autore: "Marco89", authorEmail: null,
    lat: 41.0525, lng: 14.3278,
    tipo: "Materiale pericoloso",
    testo: "Da settimane c'è un accumulo di materiale infiammabile e cavi elettrici abbandonati vicino alla rotonda. Qualcuno può controllare? È pericoloso soprattutto di sera.",
    foto: null, quando: "2 giorni fa", stato: "Segnalato", hidden: false,
    like: 14, commenti: [{ autore: "Giulia.98", testo: "Confermo, ci passo ogni giorno ed è sempre peggio." }]
  },
  {
    id: "p2", autore: "Anna_SN", authorEmail: null,
    lat: 41.0489, lng: 14.3368,
    tipo: "Cassonetti pieni",
    testo: "Cassonetti stracolmi da giorni, la raccolta sembra saltata questa settimana.",
    foto: null, quando: "5 giorni fa", stato: "In carico", hidden: false,
    like: 8, commenti: []
  },
  {
    id: "p3", autore: "Luca.rossi", authorEmail: null,
    lat: 41.0468, lng: 14.3312,
    tipo: "Rifiuti ingombranti",
    testo: "Mobili abbandonati sul marciapiede, finalmente rimossi ieri. Bel lavoro!",
    foto: null, quando: "1 settimana fa", stato: "Risolto", hidden: false,
    like: 21, commenti: [{ autore: "Marco89", testo: "Finalmente, grazie a chi ha segnalato" }]
  }
];

exports.handler = async (event, context) => {
  try {
    const store = getStore({ name: "sannicola-posts", consistency: "strong" });
    let data = await store.get("all", { type: "json" });

    if (!data) {
      data = SEED_POSTS;
      await store.setJSON("all", data);
    }

    const requester = context.clientContext && context.clientContext.user;

    const visible = data
      .filter(p => !p.hidden)
      .map(p => {
        const { authorEmail, reports, ...rest } = p;
        return { ...rest, isMine: !!(requester && authorEmail && authorEmail === requester.email) };
      });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(visible)
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
};
