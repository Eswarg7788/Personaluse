/* ============================
   Service Worker — Home App v5
   ============================ */

const CACHE_NAME = 'home-app-v5';
const ASSETS = [
    '/',
    '/index.html',
    '/css/style.css',
    '/js/app.js',
    '/js/dashboard.js',
    '/js/tasks.js',
    '/js/messages.js',
    '/js/expenses.js',
    '/js/reminders.js',
    '/js/habits.js',
    '/js/calendar.js',
    '/js/backup.js',
    '/js/charts.js',
    '/js/notes.js',
    '/js/goals.js',
    '/js/pomodoro.js',
    '/js/wishlist.js',
    '/js/income.js',
    '/js/contacts.js',
    '/js/learning.js',
    '/js/health.js',
    '/js/search.js',
    '/js/budget.js',
    '/js/recurring.js',
    '/js/notifications.js',
    '/js/tags.js',
    '/js/reports.js',
    '/js/widgets.js',
    '/js/themes.js',
    '/js/attachments.js',
    '/js/voice.js',
    '/js/cloudsync.js',
    '/js/insights.js',
    '/js/kanban.js',
    '/js/quicklog.js',
    '/js/weeklyplanner.js',
    '/js/savings.js',
    '/js/linking.js',
    '/js/location.js',
    '/js/receipt.js',
    '/js/splitter.js',
    '/js/dailyfocus.js',
    '/js/moodtrends.js',
    '/js/shortcuts.js',
    '/js/onboarding.js',
    '/manifest.json',
    '/icons/icon-192.png',
    '/icons/icon-512.png'
];

// Install
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
    self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

// Fetch — Cache first for local, Network first for CDN
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    // CDN resources (fonts, chart.js) — network-first
    if (!event.request.url.startsWith(self.location.origin)) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // Local assets — cache-first
    event.respondWith(
        caches.match(event.request).then((cached) => {
            return cached || fetch(event.request).then(response => {
                const clone = response.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                return response;
            });
        })
    );
});
