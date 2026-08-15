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
    const { id } = JSON.parse(event.body || "{}");
    if (!id) {
      return { statusCode: 400, body: JSON.stringify({ error: "ID mancante" }) };
    }

    const store = getStore({ name: "sannicola-posts", consistency: "strong" });
    const data = (await store.get("all", { type: "json" })) || [];
    const post = data.find(p => p.id === id);
    if (!post) {
      return { statusCode: 404, body: JSON.stringify({ error: "Post non trovato" }) };
    }

    // Confronto sicuro: l'email dell'autore del post deve combaciare con l'email
    // verificata contenuta nel token di accesso — non un nome scritto a mano dal client.
    if (post.authorEmail !== user.email) {
      return { statusCode: 403, body: JSON.stringify({ error: "Non sei l'autore di questo post" }) };
    }

    const newData = data.filter(p => p.id !== id);
    await store.setJSON("all", newData);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deleted: id })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
