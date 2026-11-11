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

    // Capture the final URL after any HTTP 301/302/308 redirects
    const finalUrl = response.url || targetUrl;
    const finalParsed = new URL(finalUrl);
    const targetOrigin = finalParsed.origin;
    const basePath =
      finalParsed.pathname.substring(
        0,
        finalParsed.pathname.lastIndexOf("/") + 1
      ) || "/";
    const fullBase = `${targetOrigin}${basePath}`;

    let html = await response.text();

    // 1. Remove existing <base> tags to avoid conflicts
    html = html.replace(/<base[^>]*>/gi, "");

    // 2. Strip CSP and frame-busting meta headers that block assets, scripts, or fonts
    html = html.replace(/<meta[^>]*http-equiv=["']?Content-Security-Policy["']?[^>]*>/gi, "");
    html = html.replace(/<meta[^>]*http-equiv=["']?X-Frame-Options["']?[^>]*>/gi, "");

    // 3. Rewrite root-relative asset URLs in HTML so scripts, CSS, and images resolve to target origin
    // Rewrite src="/path" -> src="https://target.com/path"
    html = html.replace(/(\ssrc=["'])\/(?!\/)([^"'>]+)(["'])/gi, `$1${targetOrigin}/$2$3`);

    // Rewrite <link href="/path" -> <link href="https://target.com/path"
    html = html.replace(/(<link[^>]*\shref=["'])\/(?!\/)([^"'>]+)(["'])/gi, `$1${targetOrigin}/$2$3`);

    // Rewrite Next.js Turbopack / Webpack dynamic chunks and React Server Component Flight payloads
    html = html.replace(/(["'])\/_next\//g, `$1${targetOrigin}/_next/`);
    html = html.replace(/(["'])\/assets\//g, `$1${targetOrigin}/assets/`);
    html = html.replace(/(["'])\/static\//g, `$1${targetOrigin}/static/`);

    // Rewrite srcset="/path"
    html = html.replace(/(\ssrcset=["'])([^"'>]+)(["'])/gi, (_match, prefix, content, suffix) => {
      const rewritten = content.split(",").map((part: string) => {
        const trimmed = part.trim();
        if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
          return `${targetOrigin}${trimmed}`;
        }
        return trimmed;
      }).join(", ");
      return `${prefix}${rewritten}${suffix}`;
    });

    // 4. Inject <base> tag and client-side bridge script
    const baseTag = `<base href="${fullBase}">\n  <meta name="referrer" content="no-referrer">`;
    const bridgeScript = `<script id="cyath-staging-bridge">
(function() {
  var targetOrigin = ${JSON.stringify(targetOrigin)};

  // 1. Unroll proxy URLs to actual target URL
  function extractTargetUrl(rawUrl) {
    if (!rawUrl) return targetOrigin;
    try {
      var u = new URL(rawUrl, window.location.origin);
      if (u.pathname.includes('/api/proxy')) {
        var inner = u.searchParams.get('url');
        if (inner) return inner;
      }
    } catch(e) {}
    return rawUrl;
  }

  // 2. Intercept dynamic Image src assignments (fixes food plate rotation and image cycling)
  try {
    var imgDesc = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
    if (imgDesc && imgDesc.set) {
      var origImgSet = imgDesc.set;
      Object.defineProperty(HTMLImageElement.prototype, 'src', {
        set: function(val) {
          if (typeof val === 'string' && val.startsWith('/') && !val.startsWith('//') && !val.startsWith('/api/proxy')) {
            val = targetOrigin + val;
          }
          return origImgSet.call(this, val);
        },
        get: imgDesc.get,
        configurable: true
      });
    }
  } catch(e) {}

  // 3. Intercept dynamic Script src assignments (fixes dynamic chunk imports)
  try {
    var scriptDesc = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, 'src');
    if (scriptDesc && scriptDesc.set) {
      var origScriptSet = scriptDesc.set;
      Object.defineProperty(HTMLScriptElement.prototype, 'src', {
        set: function(val) {
          if (typeof val === 'string' && val.startsWith('/') && !val.startsWith('//') && !val.startsWith('/api/proxy')) {
            val = targetOrigin + val;
          }
          return origScriptSet.call(this, val);
        },
        get: scriptDesc.get,
        configurable: true
      });
    }
  } catch(e) {}

  // 4. Intercept window.fetch so relative API and chunk calls hit targetOrigin
  var origFetch = window.fetch;
  if (origFetch) {
    window.fetch = function(input, init) {
      if (typeof input === 'string') {
        if (input.startsWith('/') && !input.startsWith('//') && !input.startsWith('/api/proxy')) {
          input = targetOrigin + input;
        }
      } else if (input && input.url && input.url.startsWith('/') && !input.url.startsWith('//') && !input.url.startsWith('/api/proxy')) {
        input = new Request(targetOrigin + input.url, input);
      }
      return origFetch.call(this, input, init);
    };
  }

  // 5. Intercept XMLHttpRequest
  var origOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url) {
    if (typeof url === 'string' && url.startsWith('/') && !url.startsWith('//') && !url.startsWith('/api/proxy')) {
      url = targetOrigin + url;
    }
    return origOpen.apply(this, arguments);
  };

  // 6. Notify parent about current page URL and pathname for multi-page pin tagging
  function notifyParentNavigation(url) {
    try {
      if (window.parent && window.parent !== window) {
        var cleanUrl = extractTargetUrl(url);
        var parsed = new URL(cleanUrl, targetOrigin);
        window.parent.postMessage({
          type: 'CYATH_PAGE_NAVIGATED',
          url: parsed.href,
          pathname: parsed.pathname || '/'
        }, '*');
      }
    } catch(e) {}
  }

  // 7. Intercept history pushState and replaceState for SPA navigations
  var origPushState = history.pushState;
  history.pushState = function(state, title, url) {
    if (url) {
      var fullUrl = new URL(url, targetOrigin).href;
      notifyParentNavigation(fullUrl);
      return origPushState.call(this, state, title, '/api/proxy?url=' + encodeURIComponent(fullUrl));
    }
    return origPushState.apply(this, arguments);
  };

  var origReplaceState = history.replaceState;
  history.replaceState = function(state, title, url) {
    if (url) {
      var fullUrl = new URL(url, targetOrigin).href;
      notifyParentNavigation(fullUrl);
      return origReplaceState.call(this, state, title, '/api/proxy?url=' + encodeURIComponent(fullUrl));
    }
    return origReplaceState.apply(this, arguments);
  };

  // 8. Intercept internal link navigation to stay within proxy sandbox
  document.addEventListener('click', function(e) {
    try {
      var a = e.target.closest('a');
      if (a && a.href) {
        var rawHref = a.getAttribute('href');
        if (!rawHref || rawHref.startsWith('#') || rawHref.startsWith('javascript:') || rawHref.startsWith('mailto:') || rawHref.startsWith('tel:')) return;
        var fullTargetUrl = new URL(rawHref, targetOrigin).href;
        if (fullTargetUrl && (fullTargetUrl.startsWith('http://') || fullTargetUrl.startsWith('https://'))) {
          e.preventDefault();
          e.stopPropagation();
          notifyParentNavigation(fullTargetUrl);
          window.location.href = '/api/proxy?url=' + encodeURIComponent(fullTargetUrl);
        }
      }
    } catch(err) {}
  }, true);

  // 6. Dynamic stage height synchronizer
  function sendHeight() {
    try {
      var body = document.body;
      var doc = document.documentElement;
      var height = Math.max(
        body ? body.scrollHeight : 0,
        body ? body.offsetHeight : 0,
        doc ? doc.clientHeight : 0,
        doc ? doc.scrollHeight : 0,
        doc ? doc.offsetHeight : 0
      );
      if (height > 200 && window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'CYATH_STAGE_RESIZE', height: height }, '*');
      }
    } catch(e) {}
  }

  window.addEventListener('DOMContentLoaded', function() {
    sendHeight();
    notifyParentNavigation(window.location.href);
  });
  window.addEventListener('load', function() {
    sendHeight();
    notifyParentNavigation(window.location.href);
  });
  window.addEventListener('resize', sendHeight);

  if (typeof MutationObserver !== 'undefined' && document.body) {
    try {
      new MutationObserver(sendHeight).observe(document.body, { childList: true, subtree: true, attributes: true });
    } catch(e) {}
  }
  [200, 600, 1200, 2500, 5000].forEach(function(t) { setTimeout(sendHeight, t); });
})();
</script>`;

    const injectedTags = `${baseTag}\n  ${bridgeScript}`;

    if (/<head[^>]*>/i.test(html)) {
      html = html.replace(/(<head[^>]*>)/i, `$1\n  ${injectedTags}`);
    } else if (/<html[^>]*>/i.test(html)) {
      html = html.replace(/(<html[^>]*>)/i, `$1\n  <head>${injectedTags}</head>`);
    } else {
      html = `${injectedTags}\n${html}`;
    }

    // 5. Neutralize frame-busting scripts
    html = html.replace(/window\.top\s*!==\s*window\.self/g, "false");
    html = html.replace(/top\.location\s*=/g, "/* frame-neutralized */ void ");

    return new NextResponse(html, {
      status: response.status,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Cross-Origin-Resource-Policy": "cross-origin",
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
