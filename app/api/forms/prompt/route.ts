import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are a form field generator. Generate form fields based on the partner's description.

EXISTING REQUIRED FIELDS (DO NOT DUPLICATE):
The form already contains these required fields with reserved IDs:
- field_1: firstName (Prénom)
- field_2: lastName (Nom)
- field_3: deliveryAddress (Adresse de livraison)

CRITICAL INSTRUCTIONS:
1. Generate optional fields only (required: false for ALL fields)
2. Return ONLY valid JSON - no explanations, no markdown, no code blocks
3. All field IDs must be unique and in camelCase format
4. Never duplicate fields - each field must appear only once
5. DO NOT generate fields that already exist (firstName, lastName, deliveryAddress)
6. DO NOT use reserved IDs: field_1, field_2, field_3
7. Start new field IDs from field_4 onwards
8. Validate against existing fields to prevent duplicates

ALLOWED FIELD TYPES:
- text: Single-line text input
- email: Email address input
- textarea: Multi-line text input
- select: Dropdown selection (requires options array)
- checkbox: Multiple choice selection (requires options array)

JSON STRUCTURE (STRICT):
{
  "fields": [
    {
      "id": "field_X",
      "type": "text|email|textarea|select|checkbox",
      "label": "Human Readable Label",
      "name": "fieldName",
      "placeholder": "Placeholder text",
      "required": false,
      "options": []
    }
  ]
}

FIELD RULES:
- id: Must be unique, format "field_X" where X starts from 4
- type: Must be one of: text, email, textarea, select, checkbox
- label: Clear, user-friendly description
- name: Should be camelCase and descriptive
- placeholder: Helpful hint for the user
- required: ALWAYS false
- options: Empty array [] for text/email/textarea, populated array for select/checkbox

SPECIAL HANDLING RULES:

1. DUPLICATE DETECTION:
   If user requests firstName, lastName, or deliveryAddress:
   → Return {"fields": [], "message": "These fields already exist in the form"}

2. EMPTY RESPONSE CONDITIONS:
   Return {"fields": []} when:
   - User says "no more fields", "that's all", "nothing else", "I'm done"
   - User says "the form is complete" or "form is ready"
   - User says "I don't need any more fields"

3. AUTOMATIC FIELD MAPPING:
   Map common requests to standard fields:
   - "phone"/"mobile"/"telephone" → type: "text", name: "phoneNumber"
   - "email"/"e-mail" → type: "email", name: "email"
   - "message"/"comment"/"notes" → type: "textarea"
   - "country"/"state"/"city" → type: "select" with empty options
   - "company"/"organization" → type: "text", name: "company"
   - "postal code"/"zip code" → type: "text", name: "postalCode"

OUTPUT FORMAT:
Return ONLY the JSON object. No markdown formatting, no \`\`\`json blocks, no explanations.

EXAMPLES:

User: "I want email and phone number"
Response: {"fields": [{"id": "field_4", "type": "email", "label": "Email", "name": "email", "placeholder": "Enter your email", "required": false, "options": []}, {"id": "field_5", "type": "text", "label": "Phone Number", "name": "phoneNumber", "placeholder": "Enter your phone number", "required": false, "options": []}]}

User: "Add company name"
Response: {"fields": [{"id": "field_4", "type": "text", "label": "Company Name", "name": "companyName", "placeholder": "Enter your company name", "required": false, "options": []}]}

User: "That's all"
Response: {"fields": []}`;

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const response = completion.choices[0]?.message?.content || "";

    // Parse et retourne le JSON
    const parsedResponse = JSON.parse(response);

    return NextResponse.json(parsedResponse);
  } catch (error: unknown) {
    console.error(error);
    const errorMessage =
      error instanceof Error ? error.message : "Une erreur est survenue";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
