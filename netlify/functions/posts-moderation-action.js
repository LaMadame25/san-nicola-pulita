const { getStore } = require("@netlify/blobs");

exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Metodo non permesso" }) };
  }

  const user = context.clientContext && context.clientContext.user;
  const roles = (user && user.app_metadata && user.app_metadata.roles) || [];

  if (!user || !roles.includes("admin")) {
    return { statusCode: 403, body: JSON.stringify({ error: "Solo per amministratori" }) };
  }

  try {
    const { id, action } = JSON.parse(event.body || "{}");
    if (!id || (action !== "delete" && action !== "restore")) {
      return { statusCode: 400, body: JSON.stringify({ error: "Parametri non validi" }) };
    }

    const store = getStore({ name: "sannicola-posts", consistency: "strong" });
    let data = (await store.get("all", { type: "json" })) || [];

    if (action === "delete") {
      data = data.filter(p => p.id !== id);
    } else {
      const post = data.find(p => p.id === id);
      if (post) post.hidden = false;
    }

    await store.setJSON("all", data);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
