import { NextRequest, NextResponse } from "next/server";
import { allowedPreviewUrl, fetchPreview, previewBoundary, readPreviewBody } from "@/lib/reviews/upstream";

function previewHeaders(contentType: string, appOrigin: string, sandbox: string) {
  return {
    "Content-Type": contentType,
    "Cache-Control": "private, no-store",
    "Content-Security-Policy": "sandbox " + sandbox + "; frame-ancestors " + appOrigin +
      "; object-src 'none'; worker-src 'none'; form-action 'none'",
    "Cross-Origin-Resource-Policy": "cross-origin",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
    "Access-Control-Allow-Origin": "*",
  };
}

export async function GET(req: NextRequest) {
  const boundary = previewBoundary(req);
  if (!boundary) return new NextResponse("The isolated preview service is unavailable.", { status: 404 });

  const { appOrigin, sandbox } = boundary;
  const headers = previewHeaders("text/html; charset=utf-8", appOrigin, sandbox);
  const failure = (status: number) => new NextResponse(
    '<!doctype html><title>Preview unavailable</title><body style="background:#09090b;color:#fff;font:16px system-ui;padding:2rem">' +
    '<h1>Preview unavailable</h1><p>Use Open original preview, or ask the studio for an accessible HTTPS preview or a PDF.</p>',
    { status, headers },
  );

  try {
    const raw = req.nextUrl.searchParams.get("url");
    if (!raw || raw.length > 4096) return failure(400);
    let target: URL;
    try { target = new URL(raw); } catch { return failure(400); }
    if (!allowedPreviewUrl(target, appOrigin, req.nextUrl.origin)) return failure(403);
    const { response, url } = await fetchPreview(target, appOrigin, req.nextUrl.origin,
      req.headers.get("accept") || "text/html,*/*");
    if (!response.ok) {
      await response.body?.cancel();
      return failure(502);
    }
    const contentType = response.headers.get("content-type") || "application/octet-stream";
    const content = await readPreviewBody(response);
    if (!contentType.toLowerCase().includes("text/html")) {
      return new NextResponse(content.buffer as ArrayBuffer, {
        headers: previewHeaders(contentType, appOrigin, sandbox),
      });
    }
    const finalUrl = url.href;
    const targetOrigin = url.origin;
    const fullBase = new URL(".", url).href;
    let html = new TextDecoder().decode(content);

    html = html.replace(/<base[^>]*>/gi, "");
    html = html.replace(/<meta[^>]*http-equiv=["']?Content-Security-Policy["']?[^>]*>/gi, "");
    html = html.replace(/<meta[^>]*http-equiv=["']?X-Frame-Options["']?[^>]*>/gi, "");

    const muteParam = req.nextUrl.searchParams.get("mute");
    const shouldMuteAudio = muteParam === "1" || muteParam === "true";

    const hasViewport = /<meta[^>]*name=["']viewport["'][^>]*>/i.test(html);
    const viewportMetaTag = hasViewport ? "" : '\n  <meta name="viewport" content="width=device-width, initial-scale=1">';

    const baseTag = `<base href="${fullBase}">\n  <meta name="referrer" content="no-referrer">${viewportMetaTag}`;
    const bridgeScript = `<script id="cyath-staging-bridge">
(function() {
  var parentOrigin = ${JSON.stringify(appOrigin)};
  var initialTargetUrl = ${JSON.stringify(finalUrl)};
  var targetOrigin = ${JSON.stringify(targetOrigin)};
  var currentTargetUrl = initialTargetUrl;
  var isAudioMuted = ${shouldMuteAudio ? "true" : "false"};
  window.__cyathAudioContexts = [];

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
        }, parentOrigin);
      }
    } catch(e) {}
  }

  // Hook history.pushState and history.replaceState immediately
  // CRITICAL: Resolves relative URLs to window.location.origin so browser <base> tag never triggers SecurityError
  var origPushState = history.pushState ? history.pushState.bind(history) : function() {};
  var origReplaceState = history.replaceState ? history.replaceState.bind(history) : function() {};

  function makeSafeHistoryUrl(rawUrl) {
    if (!rawUrl) return window.location.href;
    try {
      var resolved = new URL(rawUrl, currentTargetUrl);
      return window.location.origin + (resolved.pathname || '/') + (resolved.search || '') + (resolved.hash || '');
    } catch(e) {
      return window.location.href;
    }
  }

  history.pushState = function(state, title, url) {
    try {
      if (url) {
        var nextTarget = new URL(url, currentTargetUrl).href;
        currentTargetUrl = nextTarget;
        notifyParentNavigation(nextTarget);
        return origPushState(state, title, makeSafeHistoryUrl(url));
      }
      return origPushState(state, title, url);
    } catch(err) {}
  };

  history.replaceState = function(state, title, url) {
    try {
      if (url) {
        var nextTarget = new URL(url, currentTargetUrl).href;
        currentTargetUrl = nextTarget;
        notifyParentNavigation(nextTarget);
        return origReplaceState(state, title, makeSafeHistoryUrl(url));
      }
      return origReplaceState(state, title, url);
    } catch(err) {}
  };

  // Synchronize location pathname for client-side routers (React Router, Next.js, Vue Router)
  try {
    history.replaceState(null, '', initialTargetUrl);
  } catch(e) {}

  // Suppress third-party tracker unhandled errors and rejections that could trip root error boundaries
  window.addEventListener('error', function(event) {
    if (event && (event.error && event.error.name === 'SecurityError' || String(event.message).includes('SecurityError') || String(event.message).includes('Usercentrics') || String(event.message).includes('usercentrics'))) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);

  window.addEventListener('unhandledrejection', function(event) {
    if (event && event.reason) {
      var reasonStr = (event.reason.message || event.reason.stack || String(event.reason)).toLowerCase();
      if (reasonStr.includes('analytics') || reasonStr.includes('gtm') || reasonStr.includes('sentry') || reasonStr.includes('datadog') || reasonStr.includes('segment') || reasonStr.includes('usercentrics') || reasonStr.includes('securityerror')) {
        event.preventDefault();
      }
    }
  });

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
    if (ev.source === window.parent && ev.origin === parentOrigin && ev.data && ev.data.type === 'CYATH_SET_AUDIO_MUTED') {
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

  function isSameDomainOrSubdomain(u1, u2) {
    try {
      var h1 = new URL(u1).hostname.toLowerCase().replace(/^www\./, '');
      var h2 = new URL(u2).hostname.toLowerCase().replace(/^www\./, '');
      return h1 === h2 || h1.endsWith('.' + h2) || h2.endsWith('.' + h1);
    } catch(e) {
      return false;
    }
  }

  // Helper to route relative and targetOrigin API/asset requests through Cyath proxy (defeats CORS errors & SPA 404s)
  function toProxiedUrl(raw) {
    if (!raw) return raw;
    try {
      var strUrl = typeof raw === 'string' ? raw : (raw instanceof URL ? raw.href : (raw && raw.url ? raw.url : null));
      if (!strUrl) return raw;
      if (strUrl.indexOf('/api/proxy') !== -1) return raw;

      var currentOrigin = window.location.origin;

      // If URL points to Cyath's host origin but is not /api/proxy, rewrite to targetOrigin
      if (strUrl.startsWith(currentOrigin)) {
        strUrl = targetOrigin + strUrl.slice(currentOrigin.length);
      } else if (strUrl.startsWith('/')) {
        strUrl = targetOrigin + strUrl;
      }

      var resolved = new URL(strUrl, currentTargetUrl).href;
      if (resolved.startsWith('http://') || resolved.startsWith('https://')) {
        // If the request is for the target website origin or subdomains, proxy it
        if (isSameDomainOrSubdomain(resolved, targetOrigin)) {
          var proxied = window.location.origin + '/api/proxy?url=' + encodeURIComponent(resolved) + (isAudioMuted ? '&mute=1' : '');
          if (typeof raw === 'object' && raw instanceof Request) {
            return new Request(proxied, raw);
          }
          return proxied;
        }
      }
    } catch(e) {}
    return raw;
  }

  // Intercept window.location.assign and replace to prevent escaping proxy into Cyath routes
  try {
    var origAssign = window.Location ? window.Location.prototype.assign : null;
    var origReplace = window.Location ? window.Location.prototype.replace : null;
    if (origAssign) {
      window.Location.prototype.assign = function(url) {
        var proxied = toProxiedUrl(url);
        return origAssign.call(this, proxied);
      };
    }
    if (origReplace) {
      window.Location.prototype.replace = function(url) {
        var proxied = toProxiedUrl(url);
        return origReplace.call(this, proxied);
      };
    }
  } catch(e) {}

  // Modern Navigation API interceptor to catch programmatic redirects, origin enforcers, and framebusting
  try {
    if (typeof window.navigation !== 'undefined' && window.navigation.addEventListener) {
      window.navigation.addEventListener('navigate', function(event) {
        try {
          var dest = event.destination ? event.destination.url : '';
          if (!dest) return;
          if (dest.startsWith('#') || dest.startsWith('about:')) return;

          var currentOrigin = window.location.origin;
          var isProxied = dest.indexOf('/api/proxy') !== -1;

          if (!isProxied) {
            var parsedDest = new URL(dest, currentTargetUrl);
            if (parsedDest.origin === targetOrigin || isSameDomainOrSubdomain(parsedDest.href, targetOrigin)) {
              event.preventDefault();
              if (event.userInitiated) {
                currentTargetUrl = parsedDest.href;
                notifyParentNavigation(parsedDest.href);
                window.location.href = currentOrigin + '/api/proxy?url=' + encodeURIComponent(parsedDest.href) + (isAudioMuted ? '&mute=1' : '');
              }
            }
          }
        } catch(navErr) {}
      });
    }
  } catch(e) {}

  // Mock Kasada anti-bot SDK so it does not throw or trigger redirects
  try {
    window.KPSDK = {
      configure: function() {},
      load: function() { return Promise.resolve(); },
      getChallenge: function() { return Promise.resolve(''); }
    };
  } catch(e) {}

  // Stub ServiceWorker registration to prevent foreign service workers caching localhost
  try {
    if (navigator.serviceWorker) {
      navigator.serviceWorker.register = function() {
        return Promise.reject(new Error("ServiceWorkers disabled in review stage"));
      };
    }
  } catch(e) {}

  // Intercept dynamic Image src assignments (fixes relative images & rotating plates)
  try {
    var imgDesc = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
    if (imgDesc && imgDesc.set) {
      var origImgSet = imgDesc.set;
      Object.defineProperty(HTMLImageElement.prototype, 'src', {
        set: function(val) {
          if (typeof val === 'string' && !val.includes('/api/proxy')) {
            if (val.startsWith('/') && !val.startsWith('//')) {
              val = targetOrigin + val;
            } else if (val.startsWith(window.location.origin)) {
              val = targetOrigin + val.slice(window.location.origin.length);
            }
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

  // In Comment mode: completely disable website button clicks, links, and forms
  // In Browse mode: handle standard link navigations through proxy
  document.addEventListener('click', function(e) {
    if (currentInteractionMode === 'comment') {
      // If clicking directly on an existing cyath pin or inspector, allow selection
      if (e.target && (e.target.closest('#cyath-pins-layer') || e.target.id === 'cyath-hover-inspector')) {
        return;
      }
      // Stop all website buttons, links, inputs, and toggles from triggering
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return;
    }

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
          window.location.href = window.location.origin + '/api/proxy?url=' + encodeURIComponent(fullTargetUrl) + (isAudioMuted ? '&mute=1' : '');
        }
      }
    } catch(err) {}
  }, true);

  document.addEventListener('submit', function(e) {
    if (currentInteractionMode === 'comment') {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    }
  }, true);

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
        var rawHeight = Math.max(
          body ? body.scrollHeight : 0,
          doc ? doc.scrollHeight : 0,
          body ? body.offsetHeight : 0
        );
        var height = Math.min(16000, Math.max(800, rawHeight));
        if (Math.abs(height - lastSentHeight) > 15 && window.parent && window.parent !== window) {
          lastSentHeight = height;
          window.parent.postMessage({ type: 'CYATH_STAGE_RESIZE', height: height }, parentOrigin);
        }
      } catch(e) {}
    }, 60);
  }

  window.addEventListener('DOMContentLoaded', function() {
    sendHeight();
    notifyParentNavigation(currentTargetUrl);
    window.parent.postMessage({ type: 'CYATH_STAGE_READY' }, parentOrigin);
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

  // --- CYATH MARKUP.IO ELEMENT ANCHOR ENGINE ---
  var currentInteractionMode = 'browse';
  var stagedPins = [];
  var activePinId = null;
  var pinsLayer = null;
  var hoverInspector = null;

  function initPinsLayer() {
    if (!document.body) return null;
    if (pinsLayer && document.body.contains(pinsLayer)) return pinsLayer;
    pinsLayer = document.createElement('div');
    pinsLayer.id = 'cyath-pins-layer';
    pinsLayer.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:2147483640;overflow:visible;';
    document.body.appendChild(pinsLayer);

    hoverInspector = document.createElement('div');
    hoverInspector.id = 'cyath-hover-inspector';
    hoverInspector.style.cssText = 'position:absolute;pointer-events:none;z-index:2147483630;display:none;border:1.5px dashed #ffffff;background:rgba(255,255,255,0.06);border-radius:4px;box-shadow:0 0 16px rgba(255,255,255,0.25);';
    document.body.appendChild(hoverInspector);
    return pinsLayer;
  }

  function getCssSelector(el) {
    if (!el || el === document.body || el === document.documentElement) return 'body';
    if (el.id && !el.id.startsWith('cyath-')) {
      try { return '#' + CSS.escape(el.id); } catch(e) { return '#' + el.id; }
    }
    var path = [];
    var curr = el;
    while (curr && curr.nodeType === 1 && curr !== document.body && curr !== document.documentElement) {
      var tag = curr.tagName.toLowerCase();
      var parent = curr.parentElement;
      if (parent) {
        var siblings = Array.prototype.filter.call(parent.children, function(c) {
          return c.tagName === curr.tagName;
        });
        if (siblings.length > 1) {
          var idx = Array.prototype.indexOf.call(siblings, curr) + 1;
          tag += ':nth-of-type(' + idx + ')';
        }
      }
      path.unshift(tag);
      curr = parent;
    }
    return path.join(' > ');
  }

  function renderPins() {
    if (!document.body) return;
    initPinsLayer();
    if (!pinsLayer) return;
    pinsLayer.innerHTML = '';

    stagedPins.forEach(function(pin) {
      if (!pin) return;
      var isResolved = pin.status === 'resolved';
      var isActive = pin.id === activePinId;
      var isBox = pin.annotationType === 'box' && typeof pin.widthPercent === 'number';

      var pinEl = document.createElement('div');
      pinEl.className = 'cyath-dom-pin';
      pinEl.dataset.pinId = pin.id;

      // MarkUp.io Element Binding lookup
      var targetEl = null;
      if (pin.domAnchor && pin.domAnchor.selector) {
        try { targetEl = document.querySelector(pin.domAnchor.selector); } catch(e) {}
      }

      var posX = 0;
      var posY = 0;
      var scrollX = window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft || 0;
      var scrollY = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;

      if (targetEl && targetEl.offsetParent !== null) {
        var rect = targetEl.getBoundingClientRect();
        var elOffX = typeof pin.domAnchor.elementOffsetXPercent === 'number' ? pin.domAnchor.elementOffsetXPercent : 50;
        var elOffY = typeof pin.domAnchor.elementOffsetYPercent === 'number' ? pin.domAnchor.elementOffsetYPercent : 50;
        posX = rect.left + scrollX + (rect.width * elOffX / 100);
        posY = rect.top + scrollY + (rect.height * elOffY / 100);
      } else if (typeof pin.domAnchor === 'object' && typeof pin.domAnchor.docX === 'number' && typeof pin.domAnchor.docY === 'number') {
        posX = pin.domAnchor.docX;
        posY = pin.domAnchor.docY;
      } else {
        var docW = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth, window.innerWidth);
        var docH = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight, window.innerHeight);
        posX = (pin.xPercent / 100) * docW;
        posY = (pin.yPercent / 100) * docH;
      }

      if (isBox) {
        var docW = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth, window.innerWidth);
        var docH = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight, window.innerHeight);
        var boxW = (pin.widthPercent / 100) * docW;
        var boxH = (pin.heightPercent / 100) * docH;

        pinEl.style.cssText = 'position:absolute;left:' + posX + 'px;top:' + posY + 'px;width:' + boxW + 'px;height:' + boxH + 'px;pointer-events:auto;cursor:pointer;border:' + (isActive ? '2px solid #ffffff' : isResolved ? '1px dashed rgba(255,255,255,0.3)' : '1.5px dashed rgba(255,255,255,0.7)') + ';background:' + (isActive ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.25)') + ';border-radius:6px;box-shadow:' + (isActive ? '0 0 24px rgba(255,255,255,0.5)' : 'none') + ';z-index:' + (isActive ? 2147483647 : 2147483642) + ';';
        
        var badge = document.createElement('div');
        badge.style.cssText = 'position:absolute;top:-10px;left:-10px;width:20px;height:20px;border-radius:50%;background:' + (isActive ? '#ffffff' : '#000000') + ';color:' + (isActive ? '#000000' : '#ffffff') + ';border:1.5px solid #ffffff;display:flex;align-items:center;justify-content:center;font-family:monospace;font-size:10px;font-weight:bold;box-shadow:0 2px 8px rgba(0,0,0,0.8);';
        badge.innerText = isResolved ? '✓' : pin.number;
        pinEl.appendChild(badge);
      } else {
        pinEl.className = 'cyath-dom-pin' + (isActive ? ' cyath-active-pulse' : '');
        pinEl.style.cssText = 'position:absolute;left:' + posX + 'px;top:' + posY + 'px;transform:translate(-50%, -50%);width:' + (isActive ? '28px' : '24px') + ';height:' + (isActive ? '28px' : '24px') + ';border-radius:50%;pointer-events:auto;cursor:pointer;background:' + (isActive ? '#ffffff' : '#000000') + ';color:' + (isActive ? '#000000' : '#ffffff') + ';border:2px solid #ffffff;display:flex;align-items:center;justify-content:center;font-family:monospace;font-size:' + (isActive ? '12px' : '11px') + ';font-weight:bold;box-shadow:' + (isActive ? '0 0 24px rgba(255,255,255,0.7), 0 0 0 2px rgba(255,255,255,0.5)' : '0 4px 14px rgba(0,0,0,0.85)') + ';z-index:' + (isActive ? 2147483647 : 2147483642) + ';transition:transform 0.18s cubic-bezier(0.16, 1, 0.3, 1);';
        pinEl.innerText = isResolved ? '✓' : pin.number;
      }

      pinEl.onclick = function(e) {
        e.stopPropagation();
        e.preventDefault();
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({ type: 'CYATH_PIN_SELECTED', pinId: pin.id }, parentOrigin);
        }
      };

      pinsLayer.appendChild(pinEl);
    });
  }

  // Hover element inspector for comment mode
  var lastCursorTime = 0;
  document.addEventListener('mousemove', function(e) {
    var now = Date.now();
    if (now - lastCursorTime > 40) {
      lastCursorTime = now;
      try {
        var bodyWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 1);
        var bodyHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight || 1);
        var scrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
        var curX = (e.clientX / bodyWidth) * 100;
        var curY = ((e.clientY + scrollY) / bodyHeight) * 100;
        window.parent.postMessage({ type: 'CYATH_CURSOR_MOVE', xPercent: curX, yPercent: curY }, parentOrigin);
      } catch(err) {}
    }

    if (currentInteractionMode !== 'comment') {
      if (hoverInspector) hoverInspector.style.display = 'none';
      return;
    }
    var target = document.elementFromPoint(e.clientX, e.clientY);
    if (!target || target === document.body || target === document.documentElement || target.id === 'cyath-hover-inspector' || target.closest('#cyath-pins-layer')) {
      if (hoverInspector) hoverInspector.style.display = 'none';
      return;
    }
    initPinsLayer();
    if (!hoverInspector) return;
    var rect = target.getBoundingClientRect();
    var scrollX = window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft || 0;
    var scrollY = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    hoverInspector.style.display = 'block';
    hoverInspector.style.left = (rect.left + scrollX) + 'px';
    hoverInspector.style.top = (rect.top + scrollY) + 'px';
    hoverInspector.style.width = rect.width + 'px';
    hoverInspector.style.height = rect.height + 'px';
  }, true);

  // Tap, click, or drag to place element-anchored feedback.
  var dragStartCoords = null;
  document.addEventListener('pointerdown', function(e) {
    if (!e.isPrimary || e.button !== 0 || currentInteractionMode !== 'comment') return;
    if (e.target && (e.target.closest('#cyath-pins-layer') || e.target.id === 'cyath-hover-inspector')) return;
    dragStartCoords = { x: e.clientX, y: e.clientY };
  }, true);

  document.addEventListener('pointercancel', function() { dragStartCoords = null; }, true);
  document.addEventListener('pointerup', function(e) {
    if (!e.isPrimary || currentInteractionMode !== 'comment' || !dragStartCoords) return;
    var target = document.elementFromPoint(e.clientX, e.clientY);
    if (!target || target.closest('#cyath-pins-layer')) {
      dragStartCoords = null;
      return;
    }

    var dx = Math.abs(e.clientX - dragStartCoords.x);
    var dy = Math.abs(e.clientY - dragStartCoords.y);
    if (e.pointerType === 'touch' && (dx > 12 || dy > 12)) { dragStartCoords = null; return; }
    var rect = target.getBoundingClientRect();
    var scrollX = window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft || 0;
    var scrollY = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;

    var selector = getCssSelector(target);
    var offsetXPercent = rect.width > 0 ? ((e.clientX - rect.left) / rect.width) * 100 : 50;
    var offsetYPercent = rect.height > 0 ? ((e.clientY - rect.top) / rect.height) * 100 : 50;

    var docW = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth, window.innerWidth);
    var docH = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight, window.innerHeight);

    var docX = e.clientX + scrollX;
    var docY = e.clientY + scrollY;

    var isBox = dx > 15 && dy > 15;
    var boxX = Math.min(dragStartCoords.x, e.clientX) + scrollX;
    var boxY = Math.min(dragStartCoords.y, e.clientY) + scrollY;
    var boxW = dx;
    var boxH = dy;

    if (window.parent && window.parent !== window) {
      window.parent.postMessage({
        type: 'CYATH_ELEMENT_PIN_DROPPED',
        annotationType: isBox ? 'box' : 'point',
         viewportWidth: window.innerWidth,
         viewportHeight: window.innerHeight,
         scrollDepth: Math.max(0, Math.min(100, Math.round((scrollY / Math.max(1, docH - window.innerHeight)) * 100))),
        xPercent: Math.max(0, Math.min(100, Math.round(((isBox ? boxX : docX) / (docW || 1)) * 1000) / 10)),
        yPercent: Math.max(0, Math.min(100, Math.round(((isBox ? boxY : docY) / (docH || 1)) * 1000) / 10)),
        widthPercent: isBox ? Math.max(1, Math.round((boxW / (docW || 1)) * 1000) / 10) : undefined,
        heightPercent: isBox ? Math.max(1, Math.round((boxH / (docH || 1)) * 1000) / 10) : undefined,
        domAnchor: {
          selector: selector,
          tagName: target.tagName,
          textContent: (target.innerText || '').slice(0, 50).trim(),
          elementOffsetXPercent: Math.round(offsetXPercent * 10) / 10,
          elementOffsetYPercent: Math.round(offsetYPercent * 10) / 10,
          docX: Math.round(docX),
          docY: Math.round(docY)
        }
      }, parentOrigin);
    }

    if (hoverInspector) hoverInspector.style.display = 'none';
    dragStartCoords = null;
    e.preventDefault();
    e.stopPropagation();
  }, true);

  // Prevent button/link clicks inside staging site when in Comment mode
  document.addEventListener('click', function(e) {
    if (currentInteractionMode === 'comment') {
      if (e.target && e.target.closest('#cyath-pins-layer')) return;
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return false;
    }
  }, true);

  // Re-anchor pins dynamically on scroll, resize, and mutations (MarkUp.io dynamic tracking)
  function trackBoundElements() {
    if (pinsLayer && stagedPins.length > 0) {
      renderPins();
    }
  }

  window.addEventListener('scroll', trackBoundElements, { passive: true });
  window.addEventListener('resize', trackBoundElements);

  window.addEventListener('message', function(ev) {
    if (ev.source !== window.parent || ev.origin !== parentOrigin || !ev.data) return;
    if (ev.data.type === 'CYATH_PING') {
      window.parent.postMessage({ type: 'CYATH_STAGE_READY' }, parentOrigin);
    }
    if (ev.data.type === 'CYATH_PARENT_SCROLL') {
      window.__cyathParentScrollTop = ev.data.scrollTop || 0;
      window.dispatchEvent(new Event('scroll'));
      document.dispatchEvent(new Event('scroll'));
    }
    if (ev.data.type === 'CYATH_NAV_BACK') {
      try { history.back(); } catch(e) {}
    }
    if (ev.data.type === 'CYATH_NAV_FORWARD') {
      try { history.forward(); } catch(e) {}
    }
    if (ev.data.type === 'CYATH_NAV_RELOAD') {
      try { window.location.reload(); } catch(e) {}
    }
    if (ev.data.type === 'CYATH_SET_MODE') {
      currentInteractionMode = ev.data.mode || 'browse';
      if (hoverInspector && currentInteractionMode !== 'comment') {
        hoverInspector.style.display = 'none';
      }
    }
    if (ev.data.type === 'CYATH_SYNC_PINS') {
      stagedPins = Array.isArray(ev.data.pins) ? ev.data.pins : [];
      activePinId = ev.data.activePinId || null;
      renderPins();
    }
  });
})();
</script>`;

    const stageSyncStyle = `<style id="cyath-stage-sync">
html, body {
  overflow-y: visible !important;
  height: auto !important;
  min-height: 100% !important;
  -ms-overflow-style: none !important;
  scrollbar-width: none !important;
}
html::-webkit-scrollbar, body::-webkit-scrollbar, *::-webkit-scrollbar {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
}
* {
  scrollbar-width: none !important;
  -ms-overflow-style: none !important;
}
@keyframes cyathPinPulse {
  0% { box-shadow: 0 0 0 0 rgba(255,255,255,0.8), 0 0 16px rgba(255,255,255,0.4); transform: translate(-50%, -50%) scale(0.92); }
  60% { box-shadow: 0 0 0 10px rgba(255,255,255,0), 0 0 25px rgba(255,255,255,0.25); transform: translate(-50%, -50%) scale(1.06); }
  100% { box-shadow: 0 0 0 0 rgba(255,255,255,0), 0 0 14px rgba(255,255,255,0.2); transform: translate(-50%, -50%) scale(1); }
}
.cyath-active-pulse { animation: cyathPinPulse 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
</style>`;
    // Neutralize frame-busting scripts in target HTML before injecting bridge
    html = html.replace(/window\.top\s*!==\s*window\.self/g, "false");
    html = html.replace(/top\.location\s*=/g, "/* frame-neutralized */ void ");
    html = html.replace(/parent\.location\s*=/g, "/* frame-neutralized */ void ");

    const injectedTags = `${baseTag}\n  ${stageSyncStyle}\n  ${bridgeScript}`;

    if (/<head[^>]*>/i.test(html)) {
      html = html.replace(/(<head[^>]*>)/i, (_, head) => `${head}\n  ${injectedTags}`);
    } else if (/<html[^>]*>/i.test(html)) {
      html = html.replace(/(<html[^>]*>)/i, (_, root) => `${root}\n  <head>${injectedTags}</head>`);
    } else {
      html = `${injectedTags}\n${html}`;
    }

    return new NextResponse(html, { headers });
  } catch {
    return failure(502);
  }
}
