import { getStore } from "@netlify/blobs";
import { getUser } from "@netlify/identity";

const MIN_INTERVAL_MS = 30 * 1000; // tempo minimo di attesa tra due segnalazioni dello stesso utente
const MAX_FOTOS = 4; // deve corrispondere a MAX_FOTOS in index.html

export default async (req, context) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Metodo non permesso" }), { status: 405 });
  }

  const user = await getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Devi accedere per pubblicare" }), { status: 401 });
  }

  const rateStore = getStore({ name: "sannicola-ratelimit", consistency: "strong" });
  const lastTime = await rateStore.get(user.email, { type: "text" });
  const now = Date.now();
  if (lastTime && (now - Number(lastTime)) < MIN_INTERVAL_MS) {
    const waitSec = Math.ceil((MIN_INTERVAL_MS - (now - Number(lastTime))) / 1000);
    return new Response(JSON.stringify({ error: `Aspetta ${waitSec} secondi prima di pubblicare un'altra segnalazione` }), { status: 429 });
  }

  try {
    const body = await req.json();
    const { lat, lng, via, comune, tipo, testo, fotos, foto, aiMaterial, aiCategory } = body;

    if (!testo || typeof testo !== "string" || !testo.trim()) {
      return new Response(JSON.stringify({ error: "Testo mancante" }), { status: 400 });
    }

    // Compatibilità: accetta sia il nuovo campo "fotos" (array, multi-foto)
    // sia il vecchio campo "foto" (singolo, usato da versioni precedenti del frontend).
    let fotoList = [];
    if (Array.isArray(fotos)) {
      fotoList = fotos.filter(f => typeof f === "string" && f.trim());
    } else if (typeof foto === "string" && foto.trim()) {
      fotoList = [foto];
    }
    fotoList = fotoList.slice(0, MAX_FOTOS);

    const comuneValido = comune === "San Marco Evangelista" ? "San Marco Evangelista" : "San Nicola la Strada";
    const defaultCoords = comuneValido === "San Marco Evangelista"
      ? { lat: 41.0370, lng: 14.3398 }
      : { lat: 41.0500, lng: 14.3330 };

    const displayName = (user.userMetadata && user.userMetadata.full_name) || user.email.split("@")[0];

    const newPost = {
      id: "p" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      autore: displayName,
      authorEmail: user.email,
      lat: typeof lat === "number" ? lat : defaultCoords.lat,
      lng: typeof lng === "number" ? lng : defaultCoords.lng,
      via: (typeof via === "string" && via.trim()) ? via.trim().slice(0, 100) : null,
      comune: comuneValido,
      tipo: tipo || "Discussione / idea",
      testo: testo.trim().slice(0, 500),
      fotos: fotoList,
      // "foto" (singolare) resta popolato con la prima immagine per compatibilità
      // con eventuale codice più vecchio (es. moderazione, mappa) che legge ancora questo campo.
      foto: fotoList[0] || null,
      quando: "adesso",
      stato: "Segnalato",
      hidden: false,
      like: 0,
      commenti: [],
      aiMaterial: aiMaterial || null,
      aiCategory: aiCategory || null,
      createdAt: now
    };

    const store = getStore({ name: "sannicola-posts", consistency: "strong" });
    const data = (await store.get("all", { type: "json" })) || [];
    data.unshift(newPost);
    await store.setJSON("all", data);
    await rateStore.set(user.email, String(now));

    const { authorEmail, ...toReturn } = newPost;
    return new Response(JSON.stringify({ ...toReturn, isMine: true }), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
