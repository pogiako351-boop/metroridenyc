import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

/**
 * MetroRide NYC — Web HTML template
 *
 * Handles:
 *  - PWA manifest + apple-touch-icon / favicon linking
 *  - Service worker registration (sw.js) with Network-First/Cache-First
 *  - beforeinstallprompt capture with localStorage persistence
 *  - NYC theme meta tags (#121212 background, #D4AF37 accent)
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />

        {/* ── PWA / Theme ─────────────────────────────────── */}
        <meta name="theme-color" content="#121212" />
        <meta name="background-color" content="#121212" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="MetroRide NYC" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="MetroRide NYC" />

        {/* ── SEO ─────────────────────────────────────────── */}
        <meta
          name="description"
          content="MetroRide NYC — Live NYC subway arrivals, OMNY tap tracking, and AI-powered transit alerts. Independent. Zero-footprint."
        />
        <meta name="keywords" content="NYC subway, MTA status, OMNY, subway arrivals, transit" />

        {/* ── Open Graph ──────────────────────────────────── */}
        <meta property="og:title" content="MetroRide NYC" />
        <meta property="og:description" content="Live NYC subway arrivals & OMNY tracking" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/assets/images/metroride-nyc-icon.png" />

        {/* ── Icons ───────────────────────────────────────── */}
        <link rel="icon" href="/assets/images/metroride-nyc-icon.png" type="image/png" />
        <link rel="shortcut icon" href="/assets/images/metroride-nyc-icon.png" />
        <link rel="apple-touch-icon" href="/assets/images/metroride-nyc-icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/assets/images/metroride-nyc-icon.png" />

        {/* ── PWA Manifest ────────────────────────────────── */}
        <link rel="manifest" href="/manifest.json" />

        {/* ── Expo Router recommended reset ───────────────── */}
        <ScrollViewStyleReset />

        {/* ── Global styles ───────────────────────────────── */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              html, body, #root {
                margin: 0;
                padding: 0;
                background: #121212;
                color: #FFFFFF;
                -webkit-tap-highlight-color: transparent;
                overscroll-behavior: none;
              }

              /* PWA Install Banner */
              #pwa-install-banner {
                display: none;
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                z-index: 9999;
                background: #1E1E1E;
                border-top: 1px solid #2E2E2E;
                padding: 16px 20px;
                padding-bottom: calc(16px + env(safe-area-inset-bottom));
                flex-direction: row;
                align-items: center;
                gap: 14px;
                box-shadow: 0 -8px 32px rgba(0,0,0,0.6);
                animation: slideUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
              }
              #pwa-install-banner.visible {
                display: flex;
              }
              @keyframes slideUp {
                from { transform: translateY(100%); opacity: 0; }
                to   { transform: translateY(0);    opacity: 1; }
              }

              #pwa-install-banner .banner-icon {
                width: 48px;
                height: 48px;
                border-radius: 12px;
                flex-shrink: 0;
              }
              #pwa-install-banner .banner-text {
                flex: 1;
              }
              #pwa-install-banner .banner-title {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                font-weight: 700;
                font-size: 15px;
                color: #FFFFFF;
                margin: 0 0 2px;
              }
              #pwa-install-banner .banner-subtitle {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                font-weight: 400;
                font-size: 12px;
                color: #888888;
                margin: 0;
              }
              #pwa-install-banner .banner-btn {
                background: #D4AF37;
                color: #000000;
                border: none;
                border-radius: 20px;
                padding: 9px 18px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                font-weight: 700;
                font-size: 13px;
                cursor: pointer;
                white-space: nowrap;
                flex-shrink: 0;
              }
              #pwa-install-banner .banner-btn:active {
                opacity: 0.8;
              }
              #pwa-install-banner .banner-dismiss {
                background: none;
                border: none;
                color: #888888;
                font-size: 20px;
                cursor: pointer;
                padding: 4px;
                line-height: 1;
                flex-shrink: 0;
              }
            `,
          }}
        />

        {/* ── Service Worker + PWA Install Banner Script ─── */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                'use strict';

                /* ── Service Worker Registration ─────────────────── */
                if ('serviceWorker' in navigator) {
                  window.addEventListener('load', function () {
                    navigator.serviceWorker
                      .register('/sw.js', { scope: '/' })
                      .then(function (reg) {
                        console.log('[MetroRide SW] Registered, scope:', reg.scope);
                      })
                      .catch(function (err) {
                        console.warn('[MetroRide SW] Registration failed:', err);
                      });
                  });
                }

                /* ── PWA Install Banner (beforeinstallprompt) ─────── */
                var DISMISS_KEY = 'metroride-nyc-v1-install-dismissed';
                var deferredPrompt = null;

                // Don't show if previously dismissed
                if (localStorage.getItem(DISMISS_KEY)) return;

                window.addEventListener('beforeinstallprompt', function (e) {
                  e.preventDefault();
                  deferredPrompt = e;

                  var banner = document.getElementById('pwa-install-banner');
                  if (banner) banner.classList.add('visible');
                });

                window.addEventListener('appinstalled', function () {
                  var banner = document.getElementById('pwa-install-banner');
                  if (banner) banner.classList.remove('visible');
                  localStorage.setItem(DISMISS_KEY, '1');
                  deferredPrompt = null;
                });

                window._metroInstall = function () {
                  if (!deferredPrompt) return;
                  deferredPrompt.prompt();
                  deferredPrompt.userChoice.then(function (choice) {
                    if (choice.outcome === 'accepted') {
                      localStorage.setItem(DISMISS_KEY, '1');
                    }
                    deferredPrompt = null;
                    var banner = document.getElementById('pwa-install-banner');
                    if (banner) banner.classList.remove('visible');
                  });
                };

                window._metroDismissBanner = function () {
                  var banner = document.getElementById('pwa-install-banner');
                  if (banner) banner.classList.remove('visible');
                  localStorage.setItem(DISMISS_KEY, '1');
                };
              })();
            `,
          }}
        />
      </head>
      <body>
        {children}

        {/* PWA Install Banner — shown when beforeinstallprompt fires */}
        <div id="pwa-install-banner" role="dialog" aria-label="Install MetroRide NYC">
          {/* img is valid in +html.tsx — this is a web-only template, not a RN component */}
          <img
            className="banner-icon"
            src="/assets/images/metroride-nyc-icon.png"
            alt="MetroRide NYC"
          />
          <div className="banner-text">
            <p className="banner-title">Add to Home Screen</p>
            <p className="banner-subtitle">MetroRide NYC · Subway companion</p>
          </div>
          <button className="banner-btn" onClick={() => (window as any)._metroInstall?.()}>
            Install
          </button>
          <button className="banner-dismiss" aria-label="Dismiss" onClick={() => (window as any)._metroDismissBanner?.()}>
            ×
          </button>
        </div>
      </body>
    </html>
  );
}
