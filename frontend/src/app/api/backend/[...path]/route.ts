import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_API_URL ?? "http://localhost:3000/api";

const FORWARDED_HEADERS = [
  "authorization",
  "cookie",
  "content-type",
  "accept-language",
  "x-request-id",
];

async function proxy(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  const targetUrl = `${BACKEND_URL}/${path.join("/")}${request.nextUrl.search}`;

  const headers = new Headers();
  for (const header of FORWARDED_HEADERS) {
    const value = request.headers.get(header);
    if (value) headers.set(header, value);
  }

  let body: BodyInit | undefined;
  if (request.method !== "GET" && request.method !== "HEAD") {
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("multipart/form-data")) {
      // Forward binary multipart body as ArrayBuffer to avoid UTF-8 corruption
      body = await request.arrayBuffer();
    } else {
      body = await request.text();
      if (!headers.has("content-type")) {
        headers.set("content-type", "application/json");
      }
    }
  }

  const response = await fetch(targetUrl, {
    method: request.method,
    headers,
    body,
  });

  const contentType = response.headers.get("Content-Type") ?? "application/json";

  // Stream binary responses (xlsx, octet-stream) directly
  if (
    contentType.includes("application/vnd.openxml") ||
    contentType.includes("application/octet-stream")
  ) {
    const buffer = await response.arrayBuffer();
    return new NextResponse(buffer, {
      status: response.status,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": response.headers.get("Content-Disposition") ?? "",
      },
    });
  }

  const text = await response.text();
  return new NextResponse(text, {
    status: response.status,
    headers: { "Content-Type": contentType },
  });
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const PUT = proxy;
export const DELETE = proxy;
