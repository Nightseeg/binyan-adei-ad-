import { GoogleGenAI, Type } from "@google/genai";
import { Profile, AIResponse, Gender } from "../types";

const apiKey = process.env.API_KEY;

// Fallback if key is missing (dev mode safety)
const ai = new GoogleGenAI({ apiKey: apiKey || 'dummy-key' });

export const findMatchesForProfile = async (
  targetProfile: Profile,
  database: Profile[]
): Promise<AIResponse> => {
  if (!apiKey) {
    console.error("API Key is missing");
    throw new Error("Clé API manquante. Impossible de générer des suggestions.");
  }

  // Filter database for opposite gender
  const potentialMatches = database.filter(
    (p) => p.gender !== targetProfile.gender && p.id !== targetProfile.id
  );

  if (potentialMatches.length === 0) {
    return { suggestions: [] };
  }

  const prompt = `
    Agis comme un expert Shadchan (entremetteur) très perspicace et sensible.
    
    Voici le profil principal (le chercheur):
    - Nom: ${targetProfile.firstName}
    - Age: ${targetProfile.age}
    - Niveau Religieux: ${targetProfile.religiousLevel}
    - Ville: ${targetProfile.city}
    - A propos: ${targetProfile.aboutMe}
    - Recherche: ${targetProfile.lookingFor}

    Voici une liste de candidats potentiels (base de données):
    ${JSON.stringify(potentialMatches.map(p => ({
      id: p.id,
      name: p.firstName,
      age: p.age,
      religiousLevel: p.religiousLevel,
      city: p.city,
      about: p.aboutMe
    })))}

    Tâche : Analyse la compatibilité religieuse, l'âge, la localisation et la personnalité.
    Sélectionne les 3 meilleurs profils compatibles.
    Pour chaque match, donne un pourcentage de compatibilité et une explication courte mais précise (en français) de pourquoi c'est un bon shidduch.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  candidateId: { type: Type.STRING },
                  matchPercentage: { type: Type.NUMBER },
                  reasoning: { type: Type.STRING },
                },
                required: ["candidateId", "matchPercentage", "reasoning"]
              }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) return { suggestions: [] };
    
    return JSON.parse(text) as AIResponse;

  } catch (error) {
    console.error("Error generating matches:", error);
    throw new Error("Erreur lors de l'analyse IA.");
  }
};