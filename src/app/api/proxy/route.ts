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
    const fullBase = `${targetOrigin}/`;

    let html = await response.text();

    // 1. Remove existing <base> tags to avoid conflicts
    html = html.replace(/<base[^>]*>/gi, "");

    // 2. Strip CSP and frame-busting meta headers that block assets, scripts, or fonts
    html = html.replace(/<meta[^>]*http-equiv=["']?Content-Security-Policy["']?[^>]*>/gi, "");
    html = html.replace(/<meta[^>]*http-equiv=["']?X-Frame-Options["']?[^>]*>/gi, "");

    // 3. Inject <base> tag and client-side bridge script
    // NOTE: We preserve script src attributes as root-relative so Turbopack and Webpack chunk
    // manifests match exactly without hanging. The browser resolves them naturally against fullBase.
    const baseTag = `<base href="${fullBase}">\n  <meta name="referrer" content="no-referrer">`;
    const bridgeScript = `<script id="cyath-staging-bridge">
(function() {
  var targetOrigin = ${JSON.stringify(targetOrigin)};

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

  // Intercept dynamic Image src assignments (fixes rotating canvas images and food plates)
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

  // Intercept window.fetch so relative API calls reach targetOrigin
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

  // Intercept XMLHttpRequest
  var origOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url) {
    if (typeof url === 'string' && url.startsWith('/') && !url.startsWith('//') && !url.startsWith('/api/proxy')) {
      url = targetOrigin + url;
    }
    return origOpen.apply(this, arguments);
  };

  // Notify parent about current page URL and pathname for multi-page pin tagging
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

  // Hook history pushState and replaceState WITHOUT mangling the URL passed to client routers
  var origPushState = history.pushState;
  history.pushState = function(state, title, url) {
    var res = origPushState.apply(this, arguments);
    if (url) {
      var fullUrl = new URL(url, targetOrigin).href;
      notifyParentNavigation(fullUrl);
    }
    return res;
  };

  var origReplaceState = history.replaceState;
  history.replaceState = function(state, title, url) {
    var res = origReplaceState.apply(this, arguments);
    if (url) {
      var fullUrl = new URL(url, targetOrigin).href;
      notifyParentNavigation(fullUrl);
    }
    return res;
  };

  // Handle standard link clicks for non-SPA links in bubbling phase (does not interfere with Next.js client routing)
  document.addEventListener('click', function(e) {
    try {
      if (e.defaultPrevented) return;
      var a = e.target.closest('a');
      if (a && a.href) {
        var rawHref = a.getAttribute('href');
        if (!rawHref || rawHref.startsWith('#') || rawHref.startsWith('javascript:') || rawHref.startsWith('mailto:') || rawHref.startsWith('tel:')) return;
        var currentBase = extractTargetUrl(window.location.href);
        var fullTargetUrl = new URL(rawHref, currentBase).href;
        if (fullTargetUrl && (fullTargetUrl.startsWith('http://') || fullTargetUrl.startsWith('https://'))) {
          e.preventDefault();
          notifyParentNavigation(fullTargetUrl);
          window.location.href = '/api/proxy?url=' + encodeURIComponent(fullTargetUrl);
        }
      }
    } catch(err) {}
  }, false);

  // Dynamic stage height synchronizer
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

    // Neutralize frame-busting scripts
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
