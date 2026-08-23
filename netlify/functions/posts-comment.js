import { getStore } from "@netlify/blobs";
import { getUser } from "@netlify/identity";

export default async (req, context) => {
  const user = await getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Devi accedere" }), { status: 401 });
  }

  const store = getStore({ name: "sannicola-posts", consistency: "strong" });

  if (req.method === "POST") {
    try {
      const { id, testo } = await req.json();
      if (!id || !testo || !testo.trim()) {
        return new Response(JSON.stringify({ error: "Parametri non validi" }), { status: 400 });
      }
      const data = (await store.get("all", { type: "json" })) || [];
      const post = data.find(p => p.id === id);
      if (!post) {
        return new Response(JSON.stringify({ error: "Post non trovato" }), { status: 404 });
      }
      const displayName = (user.userMetadata && user.userMetadata.full_name) || user.email.split("@")[0];
      post.commenti.push({
        id: "c" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
        autore: displayName,
        authorEmail: user.email,
        testo: testo.trim().slice(0, 300)
      });
      await store.setJSON("all", data);
      const commentiPubblici = post.commenti.map(({ authorEmail, ...c }) => c);
      return new Response(JSON.stringify({ id: post.id, commenti: commentiPubblici }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
  }

  if (req.method === "DELETE") {
    try {
      const { id, commentId } = await req.json();
      if (!id || !commentId) {
        return new Response(JSON.stringify({ error: "Parametri non validi" }), { status: 400 });
      }
      const data = (await store.get("all", { type: "json" })) || [];
      const post = data.find(p => p.id === id);
      if (!post) {
        return new Response(JSON.stringify({ error: "Post non trovato" }), { status: 404 });
      }
      const comment = post.commenti.find(c => c.id === commentId);
      if (!comment) {
        return new Response(JSON.stringify({ error: "Commento non trovato" }), { status: 404 });
      }
      const isOwner = comment.authorEmail === user.email;
      const isAdmin = (user.roles || []).includes("admin");
      if (!isOwner && !isAdmin) {
        return new Response(JSON.stringify({ error: "Non puoi cancellare questo commento" }), { status: 403 });
      }
      post.commenti = post.commenti.filter(c => c.id !== commentId);
      await store.setJSON("all", data);
      const commentiPubblici = post.commenti.map(({ authorEmail, ...c }) => c);
      return new Response(JSON.stringify({ id: post.id, commenti: commentiPubblici }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
  }

  return new Response(JSON.stringify({ error: "Metodo non permesso" }), { status: 405 });
};
