import { NextRequest, NextResponse } from "next/server";

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, HEAD",
      "Access-Control-Allow-Headers": "*",
    },
  });
}

export async function POST(req: NextRequest) {
  const urlParam = req.nextUrl.searchParams.get("url");
  if (!urlParam) {
    return new NextResponse("Missing url parameter", { status: 400 });
  }

  let targetUrl = urlParam;
  if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
    targetUrl = "https://" + targetUrl;
  }

  try {
    const body = await req.arrayBuffer();
    const contentType = req.headers.get("content-type") || "application/json";
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": contentType,
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      },
      body,
    });

    const resBuffer = await response.arrayBuffer();
    const resContentType = response.headers.get("content-type") || "application/json";
    return new NextResponse(resBuffer, {
      status: response.status,
      headers: {
        "Content-Type": resContentType,
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, HEAD",
        "Access-Control-Allow-Headers": "*",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 502 });
  }
}

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

    // If it's a binary file, stylesheet, script, font, or JSON, pass through as array buffer with wide CORS
    if (!contentType.includes("text/html")) {
      const buffer = await response.arrayBuffer();
      return new NextResponse(buffer, {
        status: response.status,
        headers: {
          "Content-Type": contentType,
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
          "Access-Control-Allow-Headers": "*",
          "Cross-Origin-Resource-Policy": "cross-origin",
          "Cache-Control": "public, max-age=300",
        },
      });
    }

    // Capture the final URL after any HTTP redirects
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

    const muteParam = req.nextUrl.searchParams.get("mute");
    const shouldMuteAudio = muteParam === "1" || muteParam === "true";

    const hasViewport = /<meta[^>]*name=["']viewport["'][^>]*>/i.test(html);
    const viewportMetaTag = hasViewport ? "" : '\n  <meta name="viewport" content="width=device-width, initial-scale=1">';

    const baseTag = `<base href="${fullBase}">\n  <meta name="referrer" content="no-referrer">${viewportMetaTag}`;
    const bridgeScript = `<script id="cyath-staging-bridge">
(function() {
  var initialTargetUrl = ${JSON.stringify(finalUrl)};
  var targetOrigin = ${JSON.stringify(targetOrigin)};
  var currentTargetUrl = initialTargetUrl;
  var isAudioMuted = ${shouldMuteAudio ? "true" : "false"};
  // Fix SPA router 404: correct pathname before client-side router boots
  try { history.replaceState(null, '', ${JSON.stringify(new URL(finalUrl).pathname || "/")}); } catch(e) {}
  window.__cyathAudioContexts = [];

  // Synchronize location pathname for client-side routers (React Router, Next.js, Vue Router)
  // Prevents SPAs (like shivayur.com) from falling into a 404 catch-all route when seeing /api/proxy
  try {
    var targetUrlObj = new URL(initialTargetUrl);
    var targetPath = (targetUrlObj.pathname || '/') + (targetUrlObj.search || '') + (targetUrlObj.hash || '');
    if (window.location.pathname.indexOf('/api/proxy') !== -1) {
      history.replaceState(null, '', targetPath);
    }
  } catch(e) {}

  // Audio silencing protocol for preview cards and muted canvases
  function applyAudioMute(muted) {
    try {
      if (muted) {
        if (window.__cyathAudioContexts) {
          window.__cyathAudioContexts.forEach(function(ctx) {
            try { ctx.suspend(); } catch(e) {}
          });
        }
        document.querySelectorAll('audio, video').forEach(function(el) {
          try {
            el.muted = true;
            el.volume = 0;
            el.pause();
          } catch(e) {}
        });
      }
    } catch(e) {}
  }

  // Intercept Web Audio API
  try {
    var OrigAC = window.AudioContext || window.webkitAudioContext;
    if (OrigAC) {
      var SilencedAudioContext = function(options) {
        var ctx = new OrigAC(options);
        window.__cyathAudioContexts.push(ctx);
        if (isAudioMuted) {
          try { ctx.suspend(); } catch(e) {}
          var origResume = ctx.resume;
          ctx.resume = function() {
            if (isAudioMuted) return Promise.resolve();
            return origResume ? origResume.apply(this, arguments) : Promise.resolve();
          };
        }
        return ctx;
      };
      SilencedAudioContext.prototype = OrigAC.prototype;
      window.AudioContext = SilencedAudioContext;
      if (window.webkitAudioContext) window.webkitAudioContext = SilencedAudioContext;
    }
  } catch(e) {}

  // Intercept HTML5 media elements
  try {
    var origPlay = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function() {
      if (isAudioMuted) {
        this.muted = true;
        this.volume = 0;
      }
      return origPlay.apply(this, arguments);
    };
  } catch(e) {}

  // Listen for dynamic audio toggle events from parent frame
  window.addEventListener('message', function(ev) {
    if (ev.data && ev.data.type === 'CYATH_SET_AUDIO_MUTED') {
      isAudioMuted = !!ev.data.muted;
      applyAudioMute(isAudioMuted);
    }
  });

  if (isAudioMuted) {
    applyAudioMute(true);
    window.addEventListener('DOMContentLoaded', function() { applyAudioMute(true); });
    window.addEventListener('load', function() { applyAudioMute(true); });
  }

  function extractTargetUrl(rawUrl) {
    if (!rawUrl) return currentTargetUrl;
    try {
      var u = new URL(rawUrl, window.location.origin);
      if (u.pathname.includes('/api/proxy')) {
        var inner = u.searchParams.get('url');
        if (inner) return inner;
      }
    } catch(e) {}
    return rawUrl;
  }

  // Helper to route relative and targetOrigin API/asset requests through Cyath proxy (defeats CORS errors)
  function toProxiedUrl(raw) {
    if (!raw) return raw;
    try {
      var strUrl = typeof raw === 'string' ? raw : raw && raw.url ? raw.url : null;
      if (!strUrl) return raw;
      if (strUrl.indexOf('/api/proxy') !== -1) return raw;

      var resolved = new URL(strUrl, currentTargetUrl).href;
      if (resolved.startsWith('http://') || resolved.startsWith('https://')) {
        // If the request is for the target website origin or relative path, proxy it
        if (resolved.startsWith(targetOrigin) || strUrl.startsWith('/')) {
          var proxied = '/api/proxy?url=' + encodeURIComponent(resolved) + (isAudioMuted ? '&mute=1' : '');
          if (typeof raw === 'object' && raw instanceof Request) {
            return new Request(proxied, raw);
          }
          return proxied;
        }
      }
    } catch(e) {}
    return raw;
  }

  // Intercept dynamic Image src assignments (fixes rotating canvas images and plates)
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

  // Intercept window.fetch to route target origin requests through proxy
  var origFetch = window.fetch;
  if (origFetch) {
    window.fetch = function(input, init) {
      try {
        input = toProxiedUrl(input);
      } catch(e) {}
      return origFetch.call(this, input, init);
    };
  }

  // Intercept XMLHttpRequest
  var origOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url) {
    try {
      if (typeof url === 'string') {
        url = toProxiedUrl(url);
      }
    } catch(e) {}
    return origOpen.apply(this, arguments);
  };

  // Notify parent about current page URL and pathname for multi-page pin tagging
  function notifyParentNavigation(url) {
    try {
      if (!url) url = currentTargetUrl;
      var cleanUrl = extractTargetUrl(url);
      var parsed = new URL(cleanUrl, targetOrigin);
      currentTargetUrl = parsed.href;
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({
          type: 'CYATH_PAGE_NAVIGATED',
          url: parsed.href,
          pathname: parsed.pathname || '/'
        }, '*');
      }
    } catch(e) {}
  }

  // Hook history pushState and replaceState
  var origPushState = history.pushState;
  history.pushState = function(state, title, url) {
    if (url) {
      try {
        var nextTarget = new URL(url, currentTargetUrl).href;
        currentTargetUrl = nextTarget;
        notifyParentNavigation(nextTarget);
      } catch(e) {}
    }
    return origPushState.apply(this, arguments);
  };

  var origReplaceState = history.replaceState;
  history.replaceState = function(state, title, url) {
    if (url) {
      try {
        var nextTarget = new URL(url, currentTargetUrl).href;
        currentTargetUrl = nextTarget;
        notifyParentNavigation(nextTarget);
      } catch(e) {}
    }
    return origReplaceState.apply(this, arguments);
  };

  // Handle standard link clicks
  document.addEventListener('click', function(e) {
    try {
      if (e.defaultPrevented) return;
      var a = e.target.closest('a');
      if (a && a.href) {
        var rawHref = a.getAttribute('href');
        if (!rawHref || rawHref.startsWith('#') || rawHref.startsWith('javascript:') || rawHref.startsWith('mailto:') || rawHref.startsWith('tel:')) return;
        if (a.getAttribute('target') === '_blank') return;

        var fullTargetUrl = new URL(rawHref, currentTargetUrl).href;
        if (fullTargetUrl && (fullTargetUrl.startsWith('http://') || fullTargetUrl.startsWith('https://'))) {
          e.preventDefault();
          currentTargetUrl = fullTargetUrl;
          notifyParentNavigation(fullTargetUrl);
          window.location.href = '/api/proxy?url=' + encodeURIComponent(fullTargetUrl) + (isAudioMuted ? '&mute=1' : '');
        }
      }
    } catch(err) {}
  }, false);

  // Dynamic stage height synchronizer with anti-runaway clamping & debouncing
  var lastSentHeight = 0;
  var resizeDebounceTimer = null;

  function sendHeight() {
    if (resizeDebounceTimer) clearTimeout(resizeDebounceTimer);
    resizeDebounceTimer = setTimeout(function() {
      try {
        var body = document.body;
        var doc = document.documentElement;
        if (!body && !doc) return;
        // Only measure scrollHeight and body offsetHeight; avoid doc.clientHeight/doc.offsetHeight
        // which match the iframe window size and create an irreversible upward growth loop
        var rawHeight = Math.max(
          body ? body.scrollHeight : 0,
          doc ? doc.scrollHeight : 0,
          body ? body.offsetHeight : 0
        );
        var height = Math.min(12000, Math.max(800, rawHeight));
        if (Math.abs(height - lastSentHeight) > 30 && window.parent && window.parent !== window) {
          lastSentHeight = height;
          window.parent.postMessage({ type: 'CYATH_STAGE_RESIZE', height: height }, '*');
        }
      } catch(e) {}
    }, 120);
  }

  window.addEventListener('DOMContentLoaded', function() {
    sendHeight();
    notifyParentNavigation(currentTargetUrl);
  });
  window.addEventListener('load', function() {
    sendHeight();
    notifyParentNavigation(currentTargetUrl);
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
