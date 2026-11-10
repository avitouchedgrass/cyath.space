import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const urlParam = req.nextUrl.searchParams.get("url");
  if (!urlParam) {
    return new NextResponse("Missing url parameter", { status: 400 });
  }

  let targetUrl = urlParam;
  if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
    targetUrl = "https://" + targetUrl;
  }

  try {
    const parsedTarget = new URL(targetUrl);
    const origin = parsedTarget.origin;
    const basePath =
      parsedTarget.pathname.substring(
        0,
        parsedTarget.pathname.lastIndexOf("/") + 1
      ) || "/";
    const fullBase = `${origin}${basePath}`;

    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
    });

    const contentType = response.headers.get("content-type") || "text/html";

    // If it's a binary file or non-HTML, pass through as array buffer
    if (!contentType.includes("text/html")) {
      const buffer = await response.arrayBuffer();
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": contentType,
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    let html = await response.text();

    // 1. Inject <base href="..."> so relative paths (CSS, images, fonts, JS) load from target origin
    const baseTag = `<base href="${fullBase}">`;
    if (/<head[^>]*>/i.test(html)) {
      html = html.replace(/(<head[^>]*>)/i, `$1\n  ${baseTag}`);
    } else if (/<html[^>]*>/i.test(html)) {
      html = html.replace(/(<html[^>]*>)/i, `$1\n  <head>${baseTag}</head>`);
    } else {
      html = `${baseTag}\n${html}`;
    }

    // 2. Neutralize classic frame-busting scripts
    html = html.replace(/window\.top\s*!==\s*window\.self/g, "false");
    html = html.replace(/top\.location\s*=/g, "/* frame-neutralized */ void ");

    return new NextResponse(html, {
      status: response.status,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=60, s-maxage=60",
      },
    });
  } catch (err: any) {
    return new NextResponse(
      `<!DOCTYPE html><html><body style="background:#09090b;color:#f43f5e;font-family:system-ui,sans-serif;padding:48px 24px;text-align:center;">
        <h3 style="font-size:16px;font-weight:600;margin-bottom:8px;">Unable to load staging preview</h3>
        <p style="color:#71717a;font-size:12px;margin-bottom:16px;">Target site refused proxy connection (${err?.message || "Network error"})</p>
        <a href="${targetUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:8px 16px;background:#27272a;color:#fff;border-radius:8px;font-size:12px;text-decoration:none;">Open live site directly &rarr;</a>
      </body></html>`,
      {
        status: 502,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }
    );
  }
}

