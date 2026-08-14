import { getStore } from "@netlify/blobs";

export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Metodo non permesso", { status: 405 });
  }

  try {
    const { id, autore, testo } = await req.json();
    if (!id || !testo || !testo.trim()) {
      return new Response(JSON.stringify({ error: "Parametri non validi" }), { status: 400 });
    }

    const store = getStore({ name: "sannicola-posts", consistency: "strong" });
    const data = (await store.get("all", { type: "json" })) || [];
    const post = data.find(p => p.id === id);
    if (!post) {
      return new Response(JSON.stringify({ error: "Post non trovato" }), { status: 404 });
    }

    const comment = { autore: autore && autore.trim() ? autore.trim() : "Anonimo", testo: testo.trim().slice(0, 300) };
    post.commenti.push(comment);
    await store.setJSON("all", data);

    return new Response(JSON.stringify({ id: post.id, commenti: post.commenti }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
