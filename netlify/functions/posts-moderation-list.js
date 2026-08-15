const { getStore } = require("@netlify/blobs");

exports.handler = async (event, context) => {
  const user = context.clientContext && context.clientContext.user;
  const roles = (user && user.app_metadata && user.app_metadata.roles) || [];

  if (!user || !roles.includes("admin")) {
    return { statusCode: 403, body: JSON.stringify({ error: "Solo per amministratori" }) };
  }

  try {
    const store = getStore({ name: "sannicola-posts", consistency: "strong" });
    const data = (await store.get("all", { type: "json" })) || [];
    const hidden = data.filter(p => p.hidden);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(hidden)
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
