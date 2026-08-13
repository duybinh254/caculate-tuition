import { NextRequest, NextResponse } from "next/server";
import { createClass, getClasses, validateClassInput } from "@/lib/data/classes";

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export async function GET() {
  try {
    const classes = await getClasses();
    return NextResponse.json({ classes });
  } catch (err) {
    return NextResponse.json({ error: errorMessage(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const input = validateClassInput(await req.json());
    const created = await createClass(input);
    return NextResponse.json({ class: created }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: errorMessage(err) }, { status: 400 });
  }
}
