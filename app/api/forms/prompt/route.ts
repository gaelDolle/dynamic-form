import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    const rules = `You are a form field generator. Generate form fields based on the partner's description.

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
3. ERROR RESPONSES (return as JSON):
    
    a) Deletion Request:
    {"error": "I cannot delete existing fields. I can only generate new optional fields.", "fields": []}
    
    b) Modification Request:
    {"error": "I cannot modify existing fields. I can only generate new optional fields with required: false.", "fields": []}
    
    c) Invalid Field Types:
    {"error": "I can only generate these field types: text, email, textarea, select, checkbox. Unsupported types requested.", "fields": []}
    
    d) Unclear Request:
    {"error": "Please specify which fields you want to add (e.g., phone number, email, company name).", "fields": []}
    
    e) Conflicting Instructions:
    {"error": "Your request contains conflicting instructions. Please clarify which fields you want.", "fields": []}
    
    f) Out of Scope:
    {"error": "I can only generate basic field structures. Advanced features like validation rules and conditional logic are not supported.", "fields": []}
    
4. AUTOMATIC FIELD MAPPING:
Map common requests to standard fields:
    - "phone"/"mobile"/"telephone"/"contact number" → type: "text", name: "phoneNumber"
    - "email"/"e-mail"/"email address" → type: "email", name: "email"
    - "message"/"comment"/"notes"/"description" → type: "textarea"
    - "country"/"state"/"city" → type: "select" with empty options
    - Multiple choice questions → type: "checkbox" or "select"
    - "company"/"organization" → type: "text", name: "company"
    - "postal code"/"zip code" → type: "text", name: "postalCode"
5. DEDUPLICATION:
    - If user requests same field multiple times, generate only once
    - Example: "add email and also email" → generate one email field
    - Semantic matching: "first name" = "firstname" = "given name" → one field

VALIDATION CHECKLIST:
✓ No duplicate field IDs (start from field_4)
✓ No duplicate field names
✓ No conflicts with existing fields (firstName, lastName, deliveryAddress)
✓ Valid JSON syntax
✓ All fields have required: false
✓ options array present for all fields
✓ Correct field types from allowed list
✓ Field IDs follow "field_X" format
✓ No extra properties

OUTPUT FORMAT:
Return ONLY the JSON object. No markdown formatting, no code blocks, no explanations before or after.

EXAMPLES:

User: "I want firstname, lastname, email"
Response: {"fields": [{"id": "field_4", "type": "email", "label": "Email", "name": "email", "placeholder": "Enter your email", "required": false, "options": []}], "message": "firstName and lastName already exist in the form"}

User: "Add phone number and company name"
Response: {"fields": [{"id": "field_4", "type": "text", "label": "Phone Number", "name": "phoneNumber", "placeholder": "Enter your phone number", "required": false, "options": []}, {"id": "field_5", "type": "text", "label": "Company Name", "name": "companyName", "placeholder": "Enter your company name", "required": false, "options": []}]}

User: "That's all"
Response: {"fields": []}

User: "Remove the email field"
Response: {"error": "I cannot delete existing fields. I can only generate new optional fields.", "fields": []}`;

    // Appel à OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "user", content: rules + "\n\nUser request: " + prompt },
      ],
    });

    const response = completion.choices[0]?.message?.content || "";

    return NextResponse.json({ response: JSON.parse(response) });
  } catch (error: unknown) {
    console.error(error);
    const errorMessage =
      error instanceof Error ? error.message : "Une erreur est survenue";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
