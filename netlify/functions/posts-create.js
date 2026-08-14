import { getStore } from "@netlify/blobs";

export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Metodo non permesso", { status: 405 });
  }

  try {
    const body = await req.json();
    const { autore, lat, lng, tipo, testo, foto, aiMaterial, aiCategory } = body;

    if (!testo || typeof testo !== "string" || !testo.trim()) {
      return new Response(JSON.stringify({ error: "Testo mancante" }), { status: 400 });
    }

    const newPost = {
      id: "p" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      autore: autore && autore.trim() ? autore.trim() : "Anonimo",
      lat: typeof lat === "number" ? lat : 41.0500,
      lng: typeof lng === "number" ? lng : 14.3330,
      tipo: tipo || "Discussione / idea",
      testo: testo.trim().slice(0, 500),
      foto: foto || null,
      quando: "adesso",
      stato: "Segnalato",
      like: 0,
      commenti: [],
      aiMaterial: aiMaterial || null,
      aiCategory: aiCategory || null,
      createdAt: Date.now()
    };

    const store = getStore({ name: "sannicola-posts", consistency: "strong" });
    const data = (await store.get("all", { type: "json" })) || [];
    data.unshift(newPost);
    await store.setJSON("all", data);

    return new Response(JSON.stringify(newPost), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
