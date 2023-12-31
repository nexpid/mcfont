import { NextResponse } from "next/server";

export async function GET() {
  const versionsReq = await fetch(
    "https://piston-meta.mojang.com/mc/game/version_manifest_v2.json",
    {
      next: {
        revalidate: 600,
      },
    }
  );
  if (!versionsReq.ok) return new NextResponse(null, { status: 500 });

  const { versions } = await versionsReq.json();

  return NextResponse.json(
    versions.map((x: any) => x.id),
    {
      headers: {
        "Cache-control": "public, max-age=600",
      },
    }
  );
}
