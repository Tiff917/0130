// 定義快取名稱
const CACHE_NAME = 'memories-app-v1';

// 定義需要快取的資源清單
const ASSETS_TO_CACHE = [
  // 主頁面與核心檔案
  './',
  './index.html',
  './home.html',
  './social.html',
  './memories.html',
  './profile.html',
  './discover.html',
  './login.html',
  './signup.html',
  './onboarding.html',
  './forgot-password.html',
  './otp_verify.html',
  './reset_password.html',
  './payment.html',
  './comments.html',
  './edit.html',
  './message.html',
  './search.html',
  './main.js',
  './manifest.json',

  // 靜態圖片資源 (您清單中的 12 張照片)
  './favicon.ico', // 👈 務必確保 VS Code 裡有這個檔案
  './IMG_1940.jpg',
  './IMG_3535.jpg',
  './IMG_3604.jpg',
  './IMG_3698.jpg',
  './IMG_3899.jpg',
  './IMG_6207.jpg',
  './IMG_6398.jpg',
  './IMG_6433.jpg',
  './IMG_6481.jpg',
  './IMG_6654.jpg',
  './IMG_6677.jpg',
  './IMG_7136.jpg',
  './icon-192.png',
  './icon-512.png',

];

// 1. 安裝階段 (Install)：將資源存入快取
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('SW: 正在快取所有資源');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  // 讓新版本的 Service Worker 立即生效
  self.skipWaiting();
});

// 2. 激活階段 (Activate)：清理舊版本的快取
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('SW: 清理舊快取', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// 3. 攔截請求 (Fetch)：實現離線瀏覽
self.addEventListener('fetch', (event) => {
  // 對於外部圖示庫或本地資源，採取「快取優先」策略
  event.respondWith(
    caches.match(event.request).then((response) => {
      // 如果快取中有，就直接回傳；否則發送網路請求
      return response || fetch(event.request).then((networkResponse) => {
        // 選擇性：可以把新請求到的資源也存入快取
        return networkResponse;
      });
    }).catch(() => {
      // 如果網路斷掉且快取也沒有，可以在這裡回傳一個自定義的離線頁面
    })
  );
});

// 監聽來自網頁端的指令來顯示通知
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SHOW_RECAP_NOTIFICATION') {
        const options = {
            body: event.data.body,
            icon: 'icon-192.png', // 您的 App 圖示
            badge: 'icon-192.png', // Android 狀態列小圖示
            vibrate: [200, 100, 200],
            data: { url: './home.html?action=showRecap' } // 點擊通知要開哪頁
        };

        self.registration.showNotification(event.data.title, options);
    }
});

// 處理點擊通知後的動作：打開 App 並顯示回顧
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});