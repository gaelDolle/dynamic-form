import { NextRequest, NextResponse } from "next/server";
import { MCC_FORMS } from "../../../../components/form/mcc-forms";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ codemcc: string }> }
) {
  try {
    const { codemcc } = await params;

    if (!codemcc) {
      return NextResponse.json(
        { error: "Missing codemcc parameter" },
        { status: 400 }
      );
    }

    const form = MCC_FORMS[codemcc];

    if (!form) {
      return NextResponse.json(
        { error: `No form found for MCC code: ${codemcc}` },
        { status: 404 }
      );
    }

    return NextResponse.json(form);
  } catch (error: unknown) {
    console.error(error);
    const errorMessage =
      error instanceof Error ? error.message : "Une erreur est survenue";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
