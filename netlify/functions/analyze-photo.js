// Funzione serverless Netlify: analizza una foto di rifiuto usando l'API Anthropic.
// La chiave API resta SOLO sul server (variabile d'ambiente), mai visibile nel browser.
import { getUser } from "@netlify/identity";

export default async (req, context) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Metodo non consentito" }), { status: 405 });
  }

  const user = await getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Devi accedere per usare l'analisi foto" }), { status: 401 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Chiave API non configurata sul server (variabile ANTHROPIC_API_KEY mancante su Netlify)." }), { status: 500 });
  }

  try {
    const { image } = await req.json();
    if (!image) {
      return new Response(JSON.stringify({ error: "Nessuna immagine ricevuta" }), { status: 400 });
    }

    const match = image.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (!match) {
      return new Response(JSON.stringify({ error: "Formato immagine non valido" }), { status: 400 });
    }
    const mediaType = match[1];
    const base64Data = match[2];

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: mediaType, data: base64Data } },
              {
                type: "text",
                text:
                  "Guarda la foto di un rifiuto/materiale. Rispondi SOLO con un oggetto JSON, senza altro testo, preamboli o markdown, in questo formato esatto: " +
                  '{"material":"breve nome del materiale in italiano, es. \'bottiglia di plastica\'","category":"una tra: plastica, vetro, carta, organico, indifferenziato, ingombranti, pericolosi, altro"}. ' +
                  "Se non è chiaro o non è un rifiuto, usa category 'altro'."
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return new Response(JSON.stringify({ error: "Errore API Anthropic: " + errText }), { status: response.status });
    }

    const data = await response.json();
    const text = (data.content || []).map((b) => b.text || "").join("").trim();
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};("").trim();
    const clean = text.replace(/```json|```/g, "").trim();

    // Validiamo che sia JSON valido prima di restituirlo
    const parsed = JSON.parse(clean);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed)
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
