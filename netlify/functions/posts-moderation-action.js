import { getStore } from "@netlify/blobs";
import { getUser } from "@netlify/identity";

export default async (req, context) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Metodo non permesso" }), { status: 405 });
  }

  const user = await getUser();
  const roles = (user && user.roles) || [];

  if (!user || !roles.includes("admin")) {
    return new Response(JSON.stringify({ error: "Solo per amministratori" }), { status: 403 });
  }

  try {
    const { id, action } = await req.json();
    if (!id || (action !== "delete" && action !== "restore")) {
      return new Response(JSON.stringify({ error: "Parametri non validi" }), { status: 400 });
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

    return new Response(JSON.stringify({ id, action }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
