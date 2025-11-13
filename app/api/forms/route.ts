import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    id: "form_1",
    //fields: DEFAULT_REQUIRED_FIELDS,
  });
}

export async function POST(req: Request) {
  try {
    // TODO: logique de sauvegarde
  } catch (error: unknown) {
    console.error(error);
    const errorMessage =
      error instanceof Error ? error.message : "Une erreur est survenue";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
