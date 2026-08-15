const { getStore } = require("@netlify/blobs");

exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Metodo non permesso" }) };
  }

  const user = context.clientContext && context.clientContext.user;
  if (!user) {
    return { statusCode: 401, body: JSON.stringify({ error: "Devi accedere" }) };
  }

  try {
    const { id, testo } = JSON.parse(event.body || "{}");
    if (!id || !testo || !testo.trim()) {
      return { statusCode: 400, body: JSON.stringify({ error: "Parametri non validi" }) };
    }

    const store = getStore({ name: "sannicola-posts", consistency: "strong" });
    const data = (await store.get("all", { type: "json" })) || [];
    const post = data.find(p => p.id === id);
    if (!post) {
      return { statusCode: 404, body: JSON.stringify({ error: "Post non trovato" }) };
    }

    const displayName = (user.user_metadata && user.user_metadata.full_name) || user.email.split("@")[0];
    post.commenti.push({ autore: displayName, testo: testo.trim().slice(0, 300) });
    await store.setJSON("all", data);

    return {
      statusCode: 200,
      headers: { "Content-Type":
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
