import { getStore } from "@netlify/blobs";
import { getUser } from "@netlify/identity";

const STATI_VALIDI = ["Segnalato", "In carico", "Risolto"];

export default async (req, context) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const user = await getUser();
  if (!user) {
    return new Response("Non autenticato", { status: 401 });
  }
  const roles = user.roles || [];
  if (!roles.includes("admin")) {
    return new Response("Solo un admin può aggiornare lo stato", { status: 403 });
  }

  const { id, stato } = await req.json();
  if (!id || !STATI_VALIDI.includes(stato)) {
    return new Response("Dati non validi", { status: 400 });
  }

  const store = getStore("sannicola-posts");
  const posts = (await store.get("all", { type: "json" })) || [];

  const idx = posts.findIndex((p) => p.id === id);
  if (idx === -1) {
    return new Response("Segnalazione non trovata", { status: 404 });
  }

  posts[idx].stato = stato;
  await store.setJSON("all", posts);

  return new Response(JSON.stringify(posts[idx]), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
