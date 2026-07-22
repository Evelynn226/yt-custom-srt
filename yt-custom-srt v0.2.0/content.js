(function() {
    'use strict';

    // ================= 状态 =================
    let subtitles = [];
    let currentSubIndex = -1;
    let videoElement = null;
    let wrapper = null;
    let textElement = null;
    let nativeObserver = null;
    let playerObserver = null;
    let seekedHandler = null;

    let settings = { fontSize: 24, bottomOffset: 15, bgOpacity: 50 };
    let isOverrideNative = false;

    // ================= 本地 SRT 逻辑 =================

    function initUI() {
        const playerContainer = document.getElementById('movie_player') || document.querySelector('.html5-video-container');
        if (!playerContainer) return;
        if (window.getComputedStyle(playerContainer).position === 'static') {
            playerContainer.style.position = 'relative';
        }
        document.querySelectorAll('#custom-srt-wrapper').forEach(el => el.remove());

        wrapper = document.createElement('div');
        wrapper.id = 'custom-srt-wrapper';
        textElement = document.createElement('div');
        textElement.id = 'custom-srt-text';
        wrapper.appendChild(textElement);
        playerContainer.appendChild(wrapper);
        applySettings(settings);
    }

    function parseTime(timeStr) {
        const parts = timeStr.split(':');
        return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseFloat(parts[2].replace(',', '.'));
    }

    function parseSRT(srtText) {
        // 去除 BOM
        srtText = srtText.replace(/^\uFEFF/, '').trim();
        if (!srtText) return [];

        // 支持逗号或点号作为毫秒分隔符
        const regex = /(\d+)\s*\n(\d{2}:\d{2}:\d{2}[,.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,.]\d{3})\n([\s\S]*?)(?=\n\s*\n|\n*$)/g;
        const subs = [];
        let match;
        while ((match = regex.exec(srtText)) !== null) {
            subs.push({
                start: parseTime(match[2]),
                end: parseTime(match[3]),
                text: match[4].trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n')
            });
        }
        return subs;
    }

    // 二分查找当前时间对应的字幕索引
    function findCurrentSub(currentTime) {
        let lo = 0, hi = subtitles.length - 1;
        while (lo <= hi) {
            const mid = (lo + hi) >> 1;
            const sub = subtitles[mid];
            if (currentTime >= sub.start && currentTime <= sub.end) return mid;
            if (currentTime < sub.start) {
                hi = mid - 1;
            } else {
                lo = mid + 1;
            }
        }
        return -1;
    }

    function updateTime() {
        if (!videoElement || subtitles.length === 0) return;
        const currentTime = videoElement.currentTime;
        const foundIndex = findCurrentSub(currentTime);

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
            // 先移除旧的事件监听
            if (videoElement) {
                videoElement.removeEventListener('timeupdate', updateTime);
                if (seekedHandler) {
                    videoElement.removeEventListener('seeked', seekedHandler);
                }
            }
            videoElement = newVideo;
            seekedHandler = () => {
                currentSubIndex = -1;
                updateTime();
            };
            videoElement.addEventListener('timeupdate', updateTime);
            videoElement.addEventListener('seeked', seekedHandler);
            currentSubIndex = -1;
        }
    }

    // ================= 原生字幕覆盖逻辑 =================

    function applyNativeOverride(enabled) {
        isOverrideNative = enabled;
        document.body.classList.toggle('override-native-subs', enabled);

        if (enabled) {
            setupNativeObserver();
        } else {
            if (nativeObserver) {
                nativeObserver.disconnect();
                nativeObserver = null;
            }
            // 清理残留的动画类
            document.querySelectorAll('.native-fade-in').forEach(el => el.classList.remove('native-fade-in'));
            document.querySelectorAll('[data-animating]').forEach(el => delete el.dataset.animating);
        }
    }

    function setupNativeObserver() {
        if (nativeObserver) nativeObserver.disconnect();

        const player = document.getElementById('movie_player');
        if (!player) return;

        let debounceTimer = null;
        nativeObserver = new MutationObserver(() => {
            if (!isOverrideNative) return;

            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                const captionWindows = document.querySelectorAll('.caption-window');
                captionWindows.forEach(win => {
                    const textEl = win.querySelector('.captions-text');
                    if (!textEl) return;
                    if (textEl.innerText.trim() !== '') {
                        if (textEl.dataset.animating !== 'true') {
                            textEl.classList.remove('native-fade-in');
                            void textEl.offsetWidth; // 强制 reflow 触发动画
                            textEl.classList.add('native-fade-in');
                            textEl.dataset.animating = 'true';

                            textEl.addEventListener('animationend', () => {
                                textEl.dataset.animating = 'false';
                            }, { once: true });
                        }
                    } else {
                        textEl.dataset.animating = 'false';
                    }
                });
            }, 100);
        });

        // 移除 characterData 选项，减少不必要的触发
        nativeObserver.observe(player, { childList: true, subtree: true });
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
        document.documentElement.style.setProperty('--srt-font-size', settings.fontSize + 'px');
        document.documentElement.style.setProperty('--srt-bottom-offset', settings.bottomOffset + '%');
        document.documentElement.style.setProperty('--srt-bg-opacity', settings.bgOpacity / 100);
    }

    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
        try {
            if (msg.action === 'loadSRT') {
                subtitles = parseSRT(msg.srtText);
                currentSubIndex = -1;
                initUI();
                bindVideo();
                updateTime();
                sendResponse({ status: 'success', count: subtitles.length });
            } else if (msg.action === 'updateSettings') {
                applySettings(msg.settings);
                sendResponse({ status: 'success' });
            } else if (msg.action === 'clearSRT') {
                subtitles = [];
                currentSubIndex = -1;
                if (textElement) textElement.classList.remove('visible');
                sendResponse({ status: 'success' });
            } else if (msg.action === 'toggleNativeOverride') {
                applyNativeOverride(msg.enabled);
                sendResponse({ status: 'success' });
            } else {
                sendResponse({ status: 'error', message: '未知操作' });
            }
        } catch (err) {
            console.error('[YT-Custom-SRT] Error:', err);
            sendResponse({ status: 'error', message: err.message });
        }
        return true;
    });

    // YouTube SPA 导航事件
    document.addEventListener('yt-page-data-updated', () => {
        requestAnimationFrame(() => {
            bindVideo();
            initUI();
            initPlayerObserver();
        });
    });

    // DOM 变化监听：处理 SPA 导航后 UI 重建
    const bodyObserver = new MutationObserver(() => {
        if (!document.getElementById('custom-srt-wrapper')) initUI();
        if (!videoElement || !document.contains(videoElement)) bindVideo();
    });
    if (document.body) {
        bodyObserver.observe(document.body, { childList: true, subtree: true });
    }

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
