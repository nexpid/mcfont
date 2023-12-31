import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const ver = req.nextUrl.searchParams.get("version");
  if (!ver) return new NextResponse(null, { status: 400 });

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
  const version = versions.find((x: any) => x.id === ver);
  if (!version) return new NextResponse(null, { status: 400 });

  const filesReq = await fetch(
    `https://api.github.com/repos/InventivetalentDev/minecraft-assets/git/trees/${encodeURI(
      version.id
    )}?recursive=1`,
    {
      next: {
        revalidate: 600,
      },
    }
  );
  if (!filesReq.ok) return new NextResponse(null, { status: 500 });

  const { tree: files } = await filesReq.json();

  return NextResponse.json(
    files
      .filter(
        (x: any) =>
          x.path.startsWith("assets/minecraft/") &&
          !x.path.endsWith("_list.json") &&
          !x.path.endsWith("_all.json") &&
          x.type === "blob"
      )
      .map((x: any) => x.path.split("/").slice(1).join("/")),
    {
      headers: {
        "Cache-control": "public, max-age=600",
      },
    }
  );
}
