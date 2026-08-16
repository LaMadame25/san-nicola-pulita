import { getStore } from "@netlify/blobs";
import { getUser } from "@netlify/identity";

export default async (req, context) => {
  const user = await getUser();
  const roles = (user && user.roles) || [];

  if (!user || !roles.includes("admin")) {
    return new Response(JSON.stringify({ error: "Solo per amministratori" }), { status: 403 });
  }

  try {
    const store = getStore({ name: "sannicola-posts", consistency: "strong" });
    const data = (await store.get("all", { type: "json" })) || [];
    const hidden = data.filter(p => p.hidden);

    return new Response(JSON.stringify(hidden), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
