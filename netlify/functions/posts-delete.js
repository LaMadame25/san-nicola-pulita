import { getStore } from "@netlify/blobs";

export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Metodo non permesso", { status: 405 });
  }

  try {
    const { id, autore } = await req.json();
    if (!id) {
      return new Response(JSON.stringify({ error: "ID mancante" }), { status: 400 });
    }

    const store = getStore({ name: "sannicola-posts", consistency: "strong" });
    const data = (await store.get("all", { type: "json" })) || [];
    const post = data.find(p => p.id === id);
    if (!post) {
      return new Response(JSON.stringify({ error: "Post non trovato" }), { status: 404 });
    }

    // Controllo semplice: il nome inviato deve corrispondere all'autore del post.
    // NOTA: il login dell'app è "finto" (solo nome, senza password), quindi
    // questo blocca solo gli errori accidentali, non un utente malintenzionato
    // che scriva apposta lo stesso nome. Una protezione vera richiederebbe un login reale.
    if (post.autore !== autore) {
      return new Response(JSON.stringify({ error: "Non sei l'autore di questo post" }), { status: 403 });
    }

    const newData = data.filter(p => p.id !== id);
    await store.setJSON("all", newData);

    return new Response(JSON.stringify({ deleted: id }), {
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
