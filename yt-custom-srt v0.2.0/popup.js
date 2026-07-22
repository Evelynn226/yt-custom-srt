document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    const elements = {
        srtFile: document.getElementById('srtFile'),
        clearSrt: document.getElementById('clearSrt'),
        overrideNative: document.getElementById('overrideNative'),
        fontSize: document.getElementById('fontSize'),
        bottomOffset: document.getElementById('bottomOffset'),
        bgOpacity: document.getElementById('bgOpacity'),
        fontSizeVal: document.getElementById('fontSizeVal'),
        bottomVal: document.getElementById('bottomVal'),
        opacityVal: document.getElementById('opacityVal'),
        status: document.getElementById('status')
    };

    // ================= 状态管理 =================
    let statusTimer = null;

    function showStatus(msg, color = '#0073e6', duration = 2000) {
        elements.status.textContent = msg;
        elements.status.style.color = color;
        clearTimeout(statusTimer);
        statusTimer = setTimeout(() => {
            elements.status.textContent = '';
        }, duration);
    }

    // ================= 设置加载 =================
    chrome.storage.local.get(['fontSize', 'bottomOffset', 'bgOpacity', 'overrideNative'], (res) => {
        if (res.fontSize) elements.fontSize.value = res.fontSize;
        if (res.bottomOffset) elements.bottomOffset.value = res.bottomOffset;
        if (res.bgOpacity) elements.bgOpacity.value = res.bgOpacity;
        if (res.overrideNative !== undefined) elements.overrideNative.checked = res.overrideNative;
        updateLabels();
    });

    // ================= 标签更新 =================
    function updateLabels() {
        elements.fontSizeVal.textContent = elements.fontSize.value + 'px';
        elements.bottomVal.textContent = elements.bottomOffset.value + '%';
        elements.opacityVal.textContent = elements.bgOpacity.value + '%';
    }

    // ================= 设置保存与推送 =================
    function saveAndApply() {
        const settings = {
            fontSize: elements.fontSize.value,
            bottomOffset: elements.bottomOffset.value,
            bgOpacity: elements.bgOpacity.value
        };
        chrome.storage.local.set(settings);
        sendToTab({ action: 'updateSettings', settings }, '设置已应用');
    }

    // ================= 标签页通信 =================
    function sendToTab(msg, successMsg) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs[0]) {
                showStatus('⚠️ 请先打开 YouTube 页面', 'red', 3000);
                return;
            }

            const timeoutId = setTimeout(() => {
                showStatus('⚠️ 连接超时，请刷新 YouTube 页面', 'red', 3000);
            }, 3000);

            chrome.tabs.sendMessage(tabs[0].id, msg, (response) => {
                clearTimeout(timeoutId);

                if (chrome.runtime.lastError) {
                    showStatus('⚠️ 连接失败，请刷新 YouTube 页面', 'red', 3000);
                } else if (response?.status === 'error') {
                    showStatus('❌ 错误: ' + response.message, 'red', 3000);
                } else if (successMsg) {
                    showStatus(successMsg, '#0073e6', 2000);
                }
            });
        });
    }

    // ================= 事件监听 =================

    // 滑动条变化
    ['fontSize', 'bottomOffset', 'bgOpacity'].forEach(id => {
        elements[id].addEventListener('input', () => {
            updateLabels();
            saveAndApply();
        });
    });

    // 原生字幕覆盖开关
    elements.overrideNative.addEventListener('change', () => {
        const isOn = elements.overrideNative.checked;
        chrome.storage.local.set({ overrideNative: isOn });
        sendToTab({ action: 'toggleNativeOverride', enabled: isOn }, isOn ? '已开启原生样式覆盖' : '已恢复原生默认样式');
    });

    // 清除字幕
    elements.clearSrt.addEventListener('click', () => {
        elements.srtFile.value = '';
        sendToTab({ action: 'clearSRT' }, '已清除本地字幕');
    });

    // 文件选择
    elements.srtFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // 文件类型验证
        if (!file.name.toLowerCase().endsWith('.srt')) {
            showStatus('⚠️ 请选择 .srt 格式文件', 'red', 3000);
            elements.srtFile.value = '';
            return;
        }

        // 文件大小限制 (默认 10MB)
        const MAX_SIZE = 10 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
            showStatus('⚠️ 文件过大，请选择小于 10MB 的文件', 'red', 3000);
            elements.srtFile.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            sendToTab({ action: 'loadSRT', srtText: event.target.result }, '本地字幕加载成功！');
        };
        reader.onerror = () => {
            showStatus('⚠️ 文件读取失败', 'red', 3000);
        };
        reader.readAsText(file);
    });
});
