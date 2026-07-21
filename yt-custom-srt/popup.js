document.addEventListener('DOMContentLoaded', () => {
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

    // 加载已保存的设置
    chrome.storage.local.get(['fontSize', 'bottomOffset', 'bgOpacity', 'overrideNative'], (res) => {
        if (res.fontSize) elements.fontSize.value = res.fontSize;
        if (res.bottomOffset) elements.bottomOffset.value = res.bottomOffset;
        if (res.bgOpacity) elements.bgOpacity.value = res.bgOpacity;
        if (res.overrideNative !== undefined) elements.overrideNative.checked = res.overrideNative;
        updateLabels();
    });

    // 监听滑动条变化
    ['fontSize', 'bottomOffset', 'bgOpacity'].forEach(id => {
        elements[id].addEventListener('input', () => {
            updateLabels();
            saveAndApply();
        });
    });

    // 监听开关变化
    elements.overrideNative.addEventListener('change', () => {
        const isOn = elements.overrideNative.checked;
        chrome.storage.local.set({ overrideNative: isOn });
        sendToTab({ action: 'toggleNativeOverride', enabled: isOn }, isOn ? "已开启原生样式覆盖" : "已恢复原生默认样式");
    });

    elements.clearSrt.addEventListener('click', () => {
        elements.srtFile.value = '';
        sendToTab({ action: 'clearSRT' }, "已清除本地字幕");
    });

    elements.srtFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                sendToTab({ action: 'loadSRT', srtText: event.target.result }, "本地字幕加载成功！");
            };
            reader.readAsText(file);
        }
    });

    function updateLabels() {
        elements.fontSizeVal.textContent = elements.fontSize.value + 'px';
        elements.bottomVal.textContent = elements.bottomOffset.value + '%';
        elements.opacityVal.textContent = elements.bgOpacity.value + '%';
    }

    function saveAndApply() {
        const settings = {
            fontSize: elements.fontSize.value,
            bottomOffset: elements.bottomOffset.value,
            bgOpacity: elements.bgOpacity.value
        };
        chrome.storage.local.set(settings);
        sendToTab({ action: 'updateSettings', settings });
    }

    function sendToTab(msg, successMsg) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, msg)
                    .then(() => {
                        if(successMsg) {
                            elements.status.textContent = successMsg;
                            setTimeout(() => elements.status.textContent = '', 2000);
                        }
                    })
                    .catch(() => {
                        elements.status.textContent = "⚠️ 请先刷新 YouTube 页面再试！";
                        elements.status.style.color = "red";
                    });
            }
        });
    }
});