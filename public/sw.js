
/* eslint-disable no-restricted-globals */
/* global clients */

const CACHE_NAME = 'cache-v2.0.0'; // Updated to v2.0.0 for cache busting

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json?v=2.0.0',
  '/pwa-icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('SW: Clearing old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Strategy for Supabase API requests (Devotional Data)
  if (url.hostname.includes('supabase.co')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  // Strategy for Navigation
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match('/index.html');
        })
    );
    return;
  }

  // Default: Network First, fallback to cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

// --- NOTIFICATION LOGIC ---
const SETTINGS_CACHE = 'bp-settings';
const SETTINGS_URL = '/notification-settings';

const NOTIFICATION_MESSAGES = [
  "A leitura de hoje está pronta. Vamos evoluir?",
  "5 minutos agora, um dia melhor depois.",
  "A constância é o segredo. Seu momento chegou."
];

async function getSettings() {
  try {
    const cache = await caches.open(SETTINGS_CACHE);
    const response = await cache.match(SETTINGS_URL);
    if (response) {
      return await response.json();
    }
  } catch (err) {
    console.error('Error reading settings from cache:', err);
  }
  return null;
}

async function saveSettings(settings) {
  try {
    const cache = await caches.open(SETTINGS_CACHE);
    await cache.put(SETTINGS_URL, new Response(JSON.stringify(settings)));
  } catch (err) {
    console.error('Error saving settings to cache:', err);
  }
}

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'UPDATE_SETTINGS') {
    saveSettings(event.data.payload);
  }
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME).then(() => {
        console.log('SW: Cache cleared by client request');
    });
  }
});

setInterval(async () => {
  const settings = await getSettings();
  if (!settings || !settings.enabled || !settings.time) return;

  const now = new Date();
  const [targetHour, targetMinute] = settings.time.split(':').map(Number);
  
  if (now.getHours() === targetHour && now.getMinutes() === targetMinute) {
    const lastSentDate = settings.lastSentDate;
    const todayStr = now.toDateString();

    if (lastSentDate !== todayStr) {
      const startOfYear = new Date(now.getFullYear(), 0, 0);
      const diff = now - startOfYear;
      const oneDay = 1000 * 60 * 60 * 24;
      const dayOfYear = Math.floor(diff / oneDay);
      
      const messageIndex = dayOfYear % NOTIFICATION_MESSAGES.length;
      const messageBody = NOTIFICATION_MESSAGES[messageIndex];

      self.registration.showNotification('Bíblia Prática', {
        body: messageBody,
        icon: '/pwa-icon.svg',
        badge: '/pwa-icon.svg',
        tag: 'daily-devotional',
        renotify: true,
        data: { url: '/' }
      });

      settings.lastSentDate = todayStr;
      await saveSettings(settings);
    }
  }
}, 60000);

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
