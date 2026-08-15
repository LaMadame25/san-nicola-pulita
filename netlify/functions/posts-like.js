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
    const { id, direction } = JSON.parse(event.body || "{}");
    if (!id || (direction !== 1 && direction !== -1)) {
      return { statusCode: 400, body: JSON.stringify({ error: "Parametri non validi" }) };
    }

    const store = getStore({ name: "sannicola-posts", consistency: "strong" });
    const data = (await store.get("all", { type: "json" })) || [];
    const post = data.find(p => p.id === id);
    if (!post) {
      return { statusCode: 404, body: JSON.stringify({ error: "Post non trovato" }) };
    }

    post.like = Math.max(0, (post.like || 0) + direction);
    await store.setJSON("all", data);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: post.id, like: post.like })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
