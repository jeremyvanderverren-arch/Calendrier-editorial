import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize Gemini Client Lazily
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Helper: safe JSON parsing
function safeJsonParse(text: string) {
  try {
    // Remove markdown code block wrappers if any
    const cleanText = text.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
    return JSON.parse(cleanText);
  } catch (err) {
    console.error("JSON parse error on text:", text, err);
    throw new Error("Le modèle a renvoyé un format invalide. Veuillez réessayer.");
  }
}

// Endpoint 1: Structurer des idées brutes en publications spécifiques
app.post("/api/gemini/parse-ideas", async (req, res) => {
  try {
    const { rawInput, currentDateString } = req.body;
    if (!rawInput) {
      return res.status(400).json({ error: "Input text is required" });
    }

    const systemPrompt = `Tu es un expert en marketing et calendrier éditorial. L'utilisateur te fournit des idées en vrac de publications. Ton rôle est de les analyser et de générer une ou plusieurs publications structurées.
Pour chaque publication, génère les champs suivants :
- date : une date pertinente au format YYYY-MM-DD (proche de la date actuelle qui est : ${currentDateString || "votre date courante"}). Évite de tout planifier le même jour.
- title : titre ou sujet de la publication (court et clair).
- channel : le canal idéal choisi parmi [LinkedIn, Blog, Newsletter, Instagram].
- persona : le public cible ou persona marketing le plus adapté.
- status : choisi parmi [Idée, En rédaction, En révision, Planifié, Publié]. Par défaut, mets "Idée" ou "En rédaction".
- copywriting : un texte d'accroche ou premier jet rédigé avec un style copywriting minimaliste (phrases courtes, impactantes, sans superlatifs ni adjectifs clichés comme "révolutionnaire", "innovant", "unique"). Focus sur le bénéfice utilisateur.
- kpi : le KPI de succès visé choisi parmi [Trafic, Engagement, Leads].

Retourne ABSOLUMENT un tableau d'objets JSON valides décrivant ces publications.`;

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Voici les idées brutes de l'utilisateur :\n"${rawInput}"`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              date: { type: Type.STRING, description: "Format YYYY-MM-DD" },
              title: { type: Type.STRING },
              channel: { type: Type.STRING, description: "LinkedIn, Blog, Newsletter, ou Instagram" },
              persona: { type: Type.STRING },
              status: { type: Type.STRING, description: "Idée, En rédaction, En révision, Planifié, Publié" },
              copywriting: { type: Type.STRING },
              kpi: { type: Type.STRING, description: "Trafic, Engagement, ou Leads" }
            },
            required: ["date", "title", "channel", "persona", "status", "copywriting", "kpi"]
          }
        }
      }
    });

    const text = response.text || "[]";
    const structuredPosts = safeJsonParse(text);
    res.json({ publications: structuredPosts });
  } catch (error: any) {
    console.error("Error parsing ideas:", error);
    res.status(500).json({ error: error?.message || "Internal server error" });
  }
});

// Endpoint 2: Optimiser le Copywriting d'un post
app.post("/api/gemini/optimize-copy", async (req, res) => {
  try {
    const { copywriting, channel, persona, title } = req.body;
    if (!copywriting) {
      return res.status(400).json({ error: "Copywriting is required" });
    }

    const systemPrompt = `Tu es un copywriter de classe mondiale spécialisé dans le marketing digital. Ton but est d'optimiser le texte proposé par l'utilisateur.
Règles strictes :
1. Style minimaliste : des phrases courtes, rythmées et percutantes.
2. Éliminer les clichés : bannis absolument les mots de remplissage, de marketing paresseux et les adjectifs galvaudés (interdit : "révolutionnaire", "innovant", "unique", "révolution", "boulverser", "disrupter").
3. Orientation bénéfice : focalise-toi sur le problème résolu et le bénéfice pour le Persona cible indiqué.
4. Adapté au canal : le ton doit correspondre au format et aux codes du canal sélectionné (LinkedIn professionnel, Newsletter intime et directe, Instagram visuel et engageant, Blog structuré et pédagogique).
5. Ne renvoie que le texte optimisé final, sans commentaires additionnels ni métadonnées d'explication. Pas de "Voici le texte optimisé...". Uniquement le post final à copier-coller.`;

    const userMessage = `Sujet : ${title || "Inconnu"}
Canal : ${channel || "LinkedIn"}
Public cible (Persona) : ${persona || "Professionnels"}
Texte original à optimiser :
"${copywriting}"`;

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userMessage,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      }
    });

    res.json({ optimizedText: response.text?.trim() || copywriting });
  } catch (error: any) {
    console.error("Error optimizing copy:", error);
    res.status(500).json({ error: error?.message || "Internal server error" });
  }
});

// Endpoint 3: Valider l'intégralité du calendrier pour les conflits de canaux ou de ciblage
app.post("/api/gemini/validate-calendar", async (req, res) => {
  try {
    const { publications } = req.body;
    if (!publications || !Array.isArray(publications)) {
      return res.status(400).json({ error: "Publications array is required" });
    }

    const systemPrompt = `Tu es le garant de la cohérence de la stratégie marketing. Tu dois analyser un calendrier éditorial et détecter s'il y a des anomalies, des conflits de planification ou des manquements de ciblage.
Règles de validation :
1. Surcharge de canal : Signale s'il y a plus d'une publication planifiée sur un MÊME canal durant le MÊME jour (ex: 2 posts LinkedIn le 2026-06-18). Suggère de décaler l'une des publications pour l'équilibre éditorial.
2. Incohérence Persona / Message : Regarde si le texte d'un post est inapproprié ou inadapté pour le Persona ou le Canal (ex: un ton trop familier / Instagram-like pour un persona d'investigateur B2B, ou un article de blog extrêmement technique pour une cible débutante).
3. Diversité des KPI : Examine si tous les posts ciblent le même KPI (ex: que du "Trafic"), suggère de diversifier pour équilibrer le tunnel marketing (Engagement, Leads).

Retourne une liste d'alertes au format JSON. Chaque alerte doit posséder :
- type : "warning" (pour un conflit majeur comme une surcharge de date) ou "info" (pour une suggestion d'optimisation).
- message : explication claire et humaine du problème en français.
- suggestion : ce que le marketeur doit faire pour résoudre le problème.
- publicationId : l'identifiant (id) de la publication affectée (si applicable).`;

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Voici le calendrier éditorial actuel au format JSON :\n${JSON.stringify(publications)}`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, description: "warning ou info" },
              message: { type: Type.STRING },
              suggestion: { type: Type.STRING },
              publicationId: { type: Type.STRING, description: "L'identifiant unique (id) de la publication concernée" }
            },
            required: ["type", "message", "suggestion"]
          }
        }
      }
    });

    const text = response.text || "[]";
    const alerts = safeJsonParse(text);
    res.json({ alerts });
  } catch (error: any) {
    console.error("Error validating calendar:", error);
    res.status(500).json({ error: error?.message || "Internal server error" });
  }
});

// Serve frontend assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
