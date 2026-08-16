import { getStore } from "@netlify/blobs";
import { getUser } from "@netlify/identity";

export default async (req, context) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Metodo non permesso" }), { status: 405 });
  }

  const user = await getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Devi accedere per pubblicare" }), { status: 401 });
  }

  try {
    const body = await req.json();
    const { lat, lng, tipo, testo, foto, aiMaterial, aiCategory } = body;

    if (!testo || typeof testo !== "string" || !testo.trim()) {
      return new Response(JSON.stringify({ error: "Testo mancante" }), { status: 400 });
    }

    const displayName = (user.userMetadata && user.userMetadata.full_name) || user.email.split("@")[0];

    const newPost = {
      id: "p" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      autore: displayName,
      authorEmail: user.email,
      lat: typeof lat === "number" ? lat : 41.0500,
      lng: typeof lng === "number" ? lng : 14.3330,
      tipo: tipo || "Discussione / idea",
      testo: testo.trim().slice(0, 500),
      foto: foto || null,
      quando: "adesso",
      stato: "Segnalato",
      hidden: false,
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

    const { authorEmail, ...toReturn } = newPost;
    return new Response(JSON.stringify({ ...toReturn, isMine: true }), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
