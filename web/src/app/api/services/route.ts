import { NextResponse } from "next/server";
import { services } from "@/lib/store";

export async function GET() {
  return NextResponse.json(services);
}
