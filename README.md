# VUKA Lite - Press Start. Run. Done. No subscription.

    npm install
    npm run dev                  # http://localhost:3000
    npm run build && npm start   # service worker / PWA install only run in production

Structure: app/ (login, /, finish, connect, dashboard, feed, run/[id], profile) · components/ · lib/ (gpx parser, geo, stats, mock, watches, share, idb) · hooks/useTracker.js · public/ (manifest, sw.js, icons).
Demo sign-in: phone -> any 4-digit code. All data stays on-device (localStorage + IndexedDB).
