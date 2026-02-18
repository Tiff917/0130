// ==========================================
// 1. 全域變數設定
// ==========================================
const wrapper = document.getElementById('swipeWrapper');
const dragOverlay = document.getElementById('dragOverlay');
const channel = new BroadcastChannel('memory_update');

let currentIndex = 1; 
let startX = 0;
let isDragging = false;
// 這裡改用 window.isLocked 以確保 index.html 與 main.js 同步狀態
window.isLocked = false; 

// ==========================================
// 2. 核心滑動邏輯 (Swipe Logic)
// ==========================================

function updateView(animate = true) {
    if (!wrapper) return;
    wrapper.style.transition = animate ? 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)' : 'none';
    const offset = -currentIndex * window.innerWidth;
    wrapper.style.transform = `translateX(${offset}px)`;
}

// 初始化定位
window.addEventListener('load', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    
    if (tab === 'social') {
        currentIndex = 2; 
    } else if (tab === 'memories') {
        currentIndex = 0; 
    } else {
        currentIndex = 1; 
    }
    updateView(false); 
});

window.addEventListener('resize', () => updateView(false));

// ==========================================
// 3. 手勢事件監聽
// ==========================================

window.addEventListener('touchstart', (e) => {
    // 修正點：將 return 移入函式內，防止語法錯誤
    if (window.isLocked) return; 
    
    startX = e.touches[0].clientX;
    isDragging = true;
    wrapper.style.transition = 'none';
}, { passive: true });

window.addEventListener('touchmove', (e) => {
    // 修正點：將 return 移入函式內
    if (!isDragging || window.isLocked) return; 
    
    const moveX = e.touches[0].clientX;
    const diff = moveX - startX;
    
    // 邊界阻力判斷
    if ((currentIndex === 0 && diff > 0) || (currentIndex === 2 && diff < 0)) return;

    const offset = -currentIndex * window.innerWidth + diff;
    wrapper.style.transform = `translateX(${offset}px)`;
    
    // 當偵測到明顯滑動時，啟用遮罩攔截 iframe 事件
    if (Math.abs(diff) > 5) {
        dragOverlay.style.display = 'block';
        dragOverlay.style.pointerEvents = 'auto'; 
    }
}, { passive: false });

window.addEventListener('touchend', (e) => {
    if (!isDragging) return;
    isDragging = false;
    
    // 還原遮罩狀態
    dragOverlay.style.display = 'none';
    dragOverlay.style.pointerEvents = 'none';
    
    const endX = e.changedTouches[0].clientX;
    const diff = endX - startX;

    // 滑動超過 20% 寬度則翻頁
    if (diff < -window.innerWidth * 0.2 && currentIndex < 2) {
        currentIndex++;
    } else if (diff > window.innerWidth * 0.2 && currentIndex > 0) {
        currentIndex--;
    }

    updateView();
});

// ==========================================
// 4. 跨分頁通訊 (接收來自 iframe 的指令)
// ==========================================

window.addEventListener('message', (e) => {
    // 處理頁面跳轉
    if (e.data === 'goHome') {
        currentIndex = 1;
        updateView();
    }
    
    // 處理鎖定訊號：由子頁面 (如 payment.html) 傳送過來
    if (e.data === 'lockSwiping') {
        window.isLocked = true;
        console.log("Swipe Locked");
    }
    if (e.data === 'unlockSwiping') {
        window.isLocked = false;
        console.log("Swipe Unlocked");
    }
});