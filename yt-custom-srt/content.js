(function() {
    let subtitles = [];
    let currentSubIndex = -1;
    let videoElement = null;
    let wrapper = null;
    let textElement = null;
    let nativeObserver = null;
    let playerObserver = null;
    
    let settings = { fontSize: 24, bottomOffset: 15, bgOpacity: 50 };
    let isOverrideNative = false;

    // ================= 本地 SRT 逻辑 =================
    function initUI() {
        const playerContainer = document.getElementById('movie_player') || document.querySelector('.html5-video-container');
        if (!playerContainer) return;
        if (window.getComputedStyle(playerContainer).position === 'static') playerContainer.style.position = 'relative';
        document.querySelectorAll('#custom-srt-wrapper').forEach(el => el.remove());

        wrapper = document.createElement('div');
        wrapper.id = 'custom-srt-wrapper';
        textElement = document.createElement('div');
        textElement.id = 'custom-srt-text';
        wrapper.appendChild(textElement);
        playerContainer.appendChild(wrapper);
        applySettings(settings);
    }

    function parseSRT(srtText) {
        const regex = /(\d+)\n(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})\n([\s\S]*?)(?=\n{2}|$)/g;
        const subs = []; let match;
        while ((match = regex.exec(srtText)) !== null) {
            subs.push({ start: parseTime(match[2]), end: parseTime(match[3]), text: match[4].trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n') });
        }
        return subs;
    }

    function parseTime(timeStr) {
        const parts = timeStr.split(':');
        return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseFloat(parts[2].replace(',', '.'));
    }

    function updateTime() {
        if (!videoElement || subtitles.length === 0) return;
        const currentTime = videoElement.currentTime;
        let foundIndex = -1;
        if (currentSubIndex >= 0 && currentSubIndex < subtitles.length) {
            const sub = subtitles[currentSubIndex];
            if (currentTime >= sub.start && currentTime <= sub.end) foundIndex = currentSubIndex;
        }
        if (foundIndex === -1) {
            for (let i = 0; i < subtitles.length; i++) {
                if (currentTime >= subtitles[i].start && currentTime <= subtitles[i].end) { foundIndex = i; break; }
                if (currentTime < subtitles[i].start) break;
            }
        }
        if (foundIndex !== -1 && foundIndex !== currentSubIndex) {
            currentSubIndex = foundIndex;
            textElement.textContent = subtitles[foundIndex].text;
            textElement.classList.add('visible');
        } else if (foundIndex === -1 && currentSubIndex !== -1) {
            currentSubIndex = -1;
            textElement.classList.remove('visible');
        }
    }

    function bindVideo() {
        const newVideo = document.querySelector('video.html5-main-video');
        if (newVideo && newVideo !== videoElement) {
            if (videoElement) {
                videoElement.removeEventListener('timeupdate', updateTime);
                videoElement.removeEventListener('seeked', () => { currentSubIndex = -1; updateTime(); });
            }
            videoElement = newVideo;
            videoElement.addEventListener('timeupdate', updateTime);
            videoElement.addEventListener('seeked', () => { currentSubIndex = -1; updateTime(); });
            currentSubIndex = -1;
        }
    }

    // ================= 原生字幕覆盖逻辑 (优化版) =================
    function applyNativeOverride(enabled) {
        isOverrideNative = enabled;
        document.body.classList.toggle('override-native-subs', enabled);
        
        if (enabled) {
            setupNativeObserver();
        } else {
            if (nativeObserver) nativeObserver.disconnect();
            document.querySelectorAll('.native-fade-in').forEach(el => el.classList.remove('native-fade-in'));
            document.querySelectorAll('[data-animating]').forEach(el => delete el.dataset.animating);
        }
    }

    function setupNativeObserver() {
        if (nativeObserver) nativeObserver.disconnect();
        
        const player = document.getElementById('movie_player');
        if (!player) return;

        nativeObserver = new MutationObserver(() => {
            if (!isOverrideNative) return;
            
            // YouTube 可能会创建多个 caption-window (比如双语字幕)
            const captionWindows = document.querySelectorAll('.caption-window');
            captionWindows.forEach(win => {
                const textEl = win.querySelector('.captions-text');
                if (textEl && textEl.innerText.trim() !== '') {
                    // 使用 dataset 防止动画在同一条字幕上重复触发
                    if (textEl.dataset.animating !== 'true') {
                        textEl.classList.remove('native-fade-in');
                        void textEl.offsetWidth; // 强制 reflow 触发动画
                        textEl.classList.add('native-fade-in');
                        textEl.dataset.animating = 'true';
                        
                        textEl.addEventListener('animationend', () => {
                            textEl.dataset.animating = 'false';
                        }, { once: true });
                    }
                } else if (textEl) {
                     textEl.dataset.animating = 'false';
                }
            });
        });

        nativeObserver.observe(player, { childList: true, subtree: true, characterData: true });
    }

    function initPlayerObserver() {
        const player = document.getElementById('movie_player');
        if (!player) return;
        
        playerObserver = new MutationObserver(() => {
            if (isOverrideNative) {
                const container = document.querySelector('.ytp-caption-window-container');
                if (container && container.getAttribute('data-observed') !== 'true') {
                    container.setAttribute('data-observed', 'true');
                    setupNativeObserver();
                }
            }
        });
        playerObserver.observe(player, { childList: true, subtree: true });
    }

    // ================= 通用逻辑 =================
    function applySettings(newSettings) {
        settings = { ...settings, ...newSettings };
        document.documentElement.style.setProperty('--font-size', settings.fontSize + 'px');
        document.documentElement.style.setProperty('--bottom-offset', settings.bottomOffset + '%');
        document.documentElement.style.setProperty('--bg-opacity', settings.bgOpacity / 100);
    }

    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
        if (msg.action === 'loadSRT') {
            subtitles = parseSRT(msg.srtText); currentSubIndex = -1; initUI(); bindVideo(); updateTime();
            sendResponse({ status: 'success' });
        } else if (msg.action === 'updateSettings') {
            applySettings(msg.settings);
            sendResponse({ status: 'success' });
        } else if (msg.action === 'clearSRT') {
            subtitles = []; currentSubIndex = -1;
            if(textElement) textElement.classList.remove('visible');
            sendResponse({ status: 'success' });
        } else if (msg.action === 'toggleNativeOverride') {
            applyNativeOverride(msg.enabled);
            sendResponse({ status: 'success' });
        }
        return true;
    });

    document.addEventListener('yt-page-data-updated', () => {
        setTimeout(() => { bindVideo(); initUI(); initPlayerObserver(); }, 1000);
    });

    const bodyObserver = new MutationObserver(() => {
        if (!document.getElementById('custom-srt-wrapper')) initUI();
        if (!videoElement || !document.contains(videoElement)) bindVideo();
    });
    if (document.body) bodyObserver.observe(document.body, { childList: true, subtree: true });

    // 初始化
    chrome.storage.local.get(['fontSize', 'bottomOffset', 'bgOpacity', 'overrideNative'], (res) => {
        if (res.fontSize) settings.fontSize = res.fontSize;
        if (res.bottomOffset) settings.bottomOffset = res.bottomOffset;
        if (res.bgOpacity) settings.bgOpacity = res.bgOpacity;
        if (res.overrideNative !== undefined) isOverrideNative = res.overrideNative;
        
        applySettings(settings);
        applyNativeOverride(isOverrideNative);
        initUI();
        bindVideo();
        initPlayerObserver();
    });

})();