import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const ver = req.nextUrl.searchParams.get("version"),
    asset = req.nextUrl.searchParams.get("asset");
  if (!ver || !asset) return new NextResponse(null, { status: 400 });

  const res = await fetch(
    `https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/${encodeURI(
      ver
    )}/assets/${encodeURI(asset)}`
  );
  if (!res.ok) return new NextResponse(null, { status: 500 });

  const headers = new Headers();
  if (asset.endsWith(".json"))
    headers.set("content-type", "application/json; charset=utf-8");
  else headers.set("content-type", res.headers.get("content-type")!);

  const data = await res.arrayBuffer();
  headers.append("content-length", data.byteLength.toString());
  return new NextResponse(data, {
    status: res.status,
    headers,
  });
}
