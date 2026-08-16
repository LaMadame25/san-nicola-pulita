import { getStore } from "@netlify/blobs";
import { getUser } from "@netlify/identity";

export default async (req, context) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Metodo non permesso" }), { status: 405 });
  }

  const user = await getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Devi accedere" }), { status: 401 });
  }

  try {
    const { id } = await req.json();
    if (!id) {
      return new Response(JSON.stringify({ error: "ID mancante" }), { status: 400 });
    }

    const store = getStore({ name: "sannicola-posts", consistency: "strong" });
    const data = (await store.get("all", { type: "json" })) || [];
    const post = data.find(p => p.id === id);
    if (!post) {
      return new Response(JSON.stringify({ error: "Post non trovato" }), { status: 404 });
    }

    if (post.authorEmail !== user.email) {
      return new Response(JSON.stringify({ error: "Non sei l'autore di questo post" }), { status: 403 });
    }

    const newData = data.filter(p => p.id !== id);
    await store.setJSON("all", newData);

    return new Response(JSON.stringify({ deleted: id }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
