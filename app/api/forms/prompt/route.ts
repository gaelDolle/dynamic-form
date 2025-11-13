import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are a form field generator. Generate form fields based on the partner's description.

CRITICAL: Return ONLY valid JSON. No explanations, no markdown blocks, no text before or after the JSON object.

EXISTING REQUIRED FIELDS (DO NOT DUPLICATE):
- field_1: firstName (Prénom)
- field_2: lastName (Nom)
- field_3: deliveryAddress (Adresse de livraison)

CONTEXT AWARENESS:
You will receive "Current optional fields" showing all fields already generated.
- When ADDING fields: Return ALL existing fields PLUS new ones
- When REMOVING fields: Return ALL existing fields EXCEPT the removed ones

FIELD OPERATIONS:

1. ADD FIELDS:
   - When user says "ajoute X", add X to existing fields
   - Return existing fields + new field(s)

2. REMOVE FIELDS:
   - When user says "supprime/supprimer/enlève/retire X", remove X
   - Match by field meaning (e.g., "supprime cp" removes postalCode)
   - Return remaining fields only (exclude removed field)
   - Only optional fields can be removed

3. DUPLICATE HANDLING:
   - Same prompt: "ajoute cp et cp" → add only ONE cp
   - Different prompts: "ajoute cp" (when cp exists) → add cp2

AUTOMATIC FIELD MAPPING:
- "phone"/"telef"/"téléphone" → name: "phoneNumber"
- "email" → name: "email"
- "cp"/"postal code"/"code postal" → name: "postalCode"
- "company"/"société" → name: "company"
- "message"/"notes" → name: "message"

JSON STRUCTURE (MANDATORY):
{
  "fields": [
    {
      "id": "field_X",
      "type": "text|email|textarea|select|checkbox",
      "label": "Label",
      "name": "fieldName",
      "placeholder": "Placeholder",
      "required": false,
      "options": []
    }
  ]
}

YOUR RESPONSE MUST:
1. Start with { and end with }
2. Be valid JSON only
3. Contain no other text

EXAMPLES:

Request: "supprime le cp"
Current: [{"id": "field_4", "name": "phoneNumber"}, {"id": "field_5", "name": "postalCode"}]
Response: {"fields": [{"id": "field_4", "type": "text", "name": "phoneNumber", "label": "Téléphone", "placeholder": "Votre numéro", "required": false, "options": []}]}`;

export async function POST(req: Request) {
  try {
    const { prompt, history } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    // Construire le tableau de messages avec l'historique
    const messages: Array<{
      role: "system" | "user" | "assistant";
      content: string;
    }> = [{ role: "system", content: SYSTEM_PROMPT }];

    // Ajouter l'historique de conversation si fourni
    if (history && Array.isArray(history)) {
      messages.push(...history);
    }

    // Ajouter le message actuel de l'utilisateur
    messages.push({ role: "user", content: prompt?.trim() });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.7,
      max_tokens: 2000,
    });

    const response = completion.choices[0]?.message?.content || "";
    const parsedResponse = JSON.parse(response);

    return NextResponse.json({
      fields: parsedResponse.fields || [],
    });
  } catch (error: unknown) {
    console.error(error);
    const errorMessage =
      error instanceof Error ? error.message : "Une erreur est survenue";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
