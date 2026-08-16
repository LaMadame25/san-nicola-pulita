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
    const { id, testo } = await req.json();
    if (!id || !testo || !testo.trim()) {
      return new Response(JSON.stringify({ error: "Parametri non validi" }), { status: 400 });
    }

    const store = getStore({ name: "sannicola-posts", consistency: "strong" });
    const data = (await store.get("all", { type: "json" })) || [];
    const post = data.find(p => p.id === id);
    if (!post) {
      return new Response(JSON.stringify({ error: "Post non trovato" }), { status: 404 });
    }

    const displayName = (user.userMetadata && user.userMetadata.full_name) || user.email.split("@")[0];
    post.commenti.push({ autore: displayName, testo: testo.trim().slice(0, 300) });
    await store.setJSON("all", data);

    return new Response(JSON.stringify({ id: post.id, commenti: post.commenti }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
