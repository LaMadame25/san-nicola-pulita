// Funzione serverless Netlify: analizza una foto di rifiuto usando l'API Anthropic.
// La chiave API resta SOLO sul server (variabile d'ambiente), mai visibile nel browser.

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Metodo non consentito" }) };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Chiave API non configurata sul server (variabile ANTHROPIC_API_KEY mancante su Netlify)." })
    };
  }

  try {
    const { image } = JSON.parse(event.body || "{}");
    if (!image) {
      return { statusCode: 400, body: JSON.stringify({ error: "Nessuna immagine ricevuta" }) };
    }

    const match = image.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (!match) {
      return { statusCode: 400, body: JSON.stringify({ error: "Formato immagine non valido" }) };
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
      return { statusCode: response.status, body: JSON.stringify({ error: "Errore API Anthropic: " + errText }) };
    }

    const data = await response.json();
    const text = (data.content || []).map((b) => b.text || "").join("").trim();
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
