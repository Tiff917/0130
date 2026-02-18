const dbName = "MemoriesDB";
const dbVersion = 8; // 確保所有頁面的版本號一致

function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, dbVersion);

        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            // 1. 建立回憶存儲 (日曆用)
            if (!db.objectStoreNames.contains("all_photos")) {
                db.createObjectStore("all_photos", { autoIncrement: true });
            }
            // 2. 建立社群貼文存儲 (Social 用)
            if (!db.objectStoreNames.contains("posts_timeline")) {
                db.createObjectStore("posts_timeline", { keyPath: "id" });
            }
            // 3. 建立用戶資料存儲
            if (!db.objectStoreNames.contains("user_profile")) {
                db.createObjectStore("user_profile");
            }
        };

        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => reject("資料庫開啟失敗");
    });
}

async function saveUserData(name, avatarBlob) {
    const db = await initDB();
    const tx = db.transaction("user_profile", "readwrite");
    const store = tx.objectStore("user_profile");

    // 儲存暱稱
    store.put(name, "username");
    // 儲存圖片 Blob
    store.put(avatarBlob, "avatar");

    tx.oncomplete = () => {
        console.log("用戶資料已更新");
        // 存完後通知其他分頁同步
        new BroadcastChannel('memory_update').postMessage('user_updated');
    };
}

async function saveUserData(name, avatarBlob) {
    const db = await initDB();
    const tx = db.transaction("user_profile", "readwrite");
    const store = tx.objectStore("user_profile");

    // 儲存暱稱
    store.put(name, "username");
    // 儲存圖片 Blob
    store.put(avatarBlob, "avatar");

    tx.oncomplete = () => {
        console.log("用戶資料已更新");
        // 存完後通知其他分頁同步
        new BroadcastChannel('memory_update').postMessage('user_updated');
    };
}