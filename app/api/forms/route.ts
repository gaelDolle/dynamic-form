import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    id: "form_1",
    fields: [
      {
        id: "field_1",
        type: "text",
        label: "Prénom",
        name: "firstName",
        placeholder: "Votre prénom",
        required: true,
        options: [],
      },
      {
        id: "field_2",
        type: "text",
        label: "Nom",
        name: "lastName",
        placeholder: "Votre nom",
        required: true,
        options: [],
      },
      {
        id: "field_3",
        type: "text",
        label: "Adresse de livraison",
        name: "deliveryAddress",
        placeholder: "Votre adresse de livraison",
        required: true,
        options: [],
      },
    ],
  });
}

export async function POST(req: Request) {
  try {
    // TODO
    // const { prompt } = await req.json();
    // if (!prompt) {
    //   return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    // }
    // // Appel à OpenAI
    // const completion = await openai.chat.completions.create({
    //   model: "gpt-4o-mini", // ou "gpt-4-turbo"
    //   messages: [{ role: "user", content: prompt }],
    // });
    // const response = completion.choices[0]?.message?.content || "";
    // return NextResponse.json({ response });
  } catch (error: unknown) {
    console.error(error);
    const errorMessage =
      error instanceof Error ? error.message : "Une erreur est survenue";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
