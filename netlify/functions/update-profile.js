import { getUser, admin } from "@netlify/identity";

export default async (req, context) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Metodo non permesso" }), { status: 405 });
  }

  const user = await getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Devi accedere" }), { status: 401 });
  }

  try {
    const { full_name } = await req.json();
    if (!full_name || !full_name.trim()) {
      return new Response(JSON.stringify({ error: "Nome mancante" }), { status: 400 });
    }

    await admin.updateUser(user.id, {
      userMetadata: { ...user.userMetadata, full_name: full_name.trim().slice(0, 30) }
    });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
