const { getStore } = require("@netlify/blobs");

exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Metodo non permesso" }) };
  }

  const user = context.clientContext && context.clientContext.user;
  if (!user) {
    return { statusCode: 401, body: JSON.stringify({ error: "Devi accedere per pubblicare" }) };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const { lat, lng, tipo, testo, foto, aiMaterial, aiCategory } = body;

    if (!testo || typeof testo !== "string" || !testo.trim()) {
      return { statusCode: 400, body: JSON.stringify({ error: "Testo mancante" }) };
    }

    const displayName = (user.user_metadata && user.user_metadata.full_name) || user.email.split("@")[0];

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
    return {
      statusCode: 201,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...toReturn, isMine: true })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
};
