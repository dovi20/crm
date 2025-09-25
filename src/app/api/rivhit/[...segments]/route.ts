import { NextResponse } from "next/server";
import { mockResponse } from "../mock";

const RIVHIT_BASE = "https://api.rivhit.co.il/online/RivhitOnlineAPI.svc";
const API_TOKEN = process.env.NEXT_RIVHIT_API_TOKEN ?? "";
const USE_MOCK = (process.env.NEXT_RIVHIT_USE_MOCK ?? "").toLowerCase() === "true";

// Helper: build target URL from path segments
function buildTargetUrl(segments: string[]) {
  // segments might contain e.g. ["Customer.List"] or ["Status.LastRequest", "JSON"]
  const path = segments.join("/");
  return `${RIVHIT_BASE}/${path}`;
}

export async function POST(req: Request, { params }: { params: Promise<{ segments: string[] }> }) {
  try {
    const { segments } = await params;

    // Use mock when explicitly enabled or when no token is configured
    if (USE_MOCK || !API_TOKEN) {
      const incoming = (await req.json().catch(() => ({}))) || {};
      return mockResponse(segments, incoming);
    }

    const targetUrl = buildTargetUrl(segments);

    const incoming = (await req.json().catch(() => ({}))) || {};
    const payload = {
      api_token: API_TOKEN,
      ...incoming,
    };

    const resp = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      // keep default Next fetch settings
    });

    // Rivhit may return 204 with no content (NO_DATA_FOUND)
    if (resp.status === 204) {
      const out204 = NextResponse.json(
        {
          error_code: 204,
          client_message: "NO_DATA_FOUND",
          debug_message: "No data found",
          data: {},
        },
        { status: 200 }
      );
      out204.headers.set("X-Rivhit-Mode", "real");
      return out204;
    }

    const text = await resp.text();
    // Try JSON first
    try {
      const json = JSON.parse(text);
      const out = NextResponse.json(json, { status: 200 });
      out.headers.set("X-Rivhit-Mode", "real");
      return out;
    } catch {
      // Non-JSON response
      return new NextResponse(text, {
        status: resp.status,
        headers: {
          "Content-Type": resp.headers.get("Content-Type") || "text/plain",
          "X-Rivhit-Mode": "real",
        },
      });
    }
  } catch (err: unknown) {
    const outErr = NextResponse.json(
      {
        error_code: -1,
        client_message: "Internal proxy error",
        debug_message: String((err as Error)?.message ?? err),
        data: {},
      },
      { status: 500 }
    );
    outErr.headers.set("X-Rivhit-Mode", USE_MOCK || !API_TOKEN ? "mock" : "real");
    return outErr;
  }
}
