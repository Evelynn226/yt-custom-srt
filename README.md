--- README.md (原始)
由Qwen3.7Max创建，目前可实现
1 上传自定义srt字幕同步显示，可调整位置大小和背景透明度
2 替换原生字幕和动效，更美观。
使用方法，Chrome系浏览器打开拓展开发者模式，加载解压后的文件夹

en.
Created by Qwen3.7Max, this extension currently supports: 1. Uploading custom SRT subtitles for synchronized display, with adjustable position, size, and background transparency; 2. Replacing native subtitles and animations for a more aesthetically pleasing experience.

To use, enable developer mode in your Chrome-based browser and load the unzipped folder.

<img width="572" height="728" alt="ddd8bdbb1935f876ff3c8d75af85cb3d" src="https://github.com/user-attachments/assets/fae64f4c-1375-4772-93c1-9e46650ec35c" />

+++ README.md (修改后)
# YouTube Custom SRT Subtitles

![Chrome Web Store](https://img.shields.io/badge/Chrome-Extension-blue)
![Manifest Version](https://img.shields.io/badge/Manifest-v3-green)

一个 Chrome 浏览器扩展，允许你在 YouTube 上加载本地 SRT 字幕文件，并自定义字幕样式（位置、大小、透明度），提供接近原生的观看体验。

A Chrome browser extension that allows you to load local SRT subtitle files on YouTube and customize subtitle styles (position, size, transparency) for a near-native viewing experience.

## ✨ 功能特性 / Features

- 📁 **本地 SRT 字幕支持** - 上传并同步显示本地 SRT 字幕文件
- 🎨 **样式自定义** - 可调整字体大小、底部偏移、背景透明度
- 🔄 **原生字幕替换** - 可选覆盖 YouTube 原生字幕样式，更美观
- 🚀 **轻量级** - 基于 Manifest V3，性能优化

- 📁 **Local SRT Support** - Upload and display local SRT subtitle files with synchronization
- 🎨 **Customizable Styles** - Adjust font size, bottom offset, and background transparency
- 🔄 **Native Subtitle Replacement** - Option to override native YouTube subtitle styles
- 🚀 **Lightweight** - Built on Manifest V3 for optimized performance

## 📦 安装方法 / Installation

### 从源码安装 / Install from Source

1. 下载或克隆此仓库
   Download or clone this repository

2. 打开 Chrome 浏览器，访问 `chrome://extensions/`
   Open Chrome browser and navigate to `chrome://extensions/`

3. 右上角开启 **"开发者模式"** / Enable **"Developer mode"** in the top right corner

4. 点击 **"加载已解压的扩展程序"** / Click **"Load unpacked"**

5. 选择 `yt-custom-srt` 文件夹
   Select the `yt-custom-srt` folder

## 🚀 使用方法 / Usage

1. 在 YouTube 页面点击扩展图标
   Click the extension icon on any YouTube page

2. **上传 SRT 文件** - 选择你的本地字幕文件
   **Upload SRT File** - Select your local subtitle file

3. **调整样式**（可选）:
   **Adjust Styles** (Optional):
   - 字体大小 / Font Size: 14px - 60px
   - 底部偏移 / Bottom Offset: 0% - 40%
   - 背景透明度 / Background Opacity: 0% - 100%

4. **覆盖原生字幕**（可选）- 开启开关替换 YouTube 原生字幕样式
   **Override Native Subtitles** (Optional) - Toggle to replace YouTube's native subtitle styles

## 📁 项目结构 / Project Structure

```
yt-custom-srt/
├── manifest.json    # 扩展配置文件 / Extension configuration
├── content.js       # 内容脚本 / Content script
├── content.css      # 字幕样式 / Subtitle styles
├── popup.html       # 弹出界面 / Popup UI
├── popup.js         # 弹出逻辑 / Popup logic
├── popup.css        # 弹出样式 / Popup styles
└── icon.png         # 扩展图标 / Extension icon
```

## 🖼️ 预览 / Preview

<img width="572" height="728" alt="ddd8bdbb1935f876ff3c8d75af85cb3d" src="https://github.com/user-attachments/assets/fae64f4c-1375-4772-93c1-9e46650ec35c" />

## ⚙️ 权限说明 / Permissions

- `storage` - 保存用户设置 / Save user settings
- `scripting` - 注入字幕脚本 / Inject subtitle scripts
- `*://*.youtube.com/*` - 仅在 YouTube 网站运行 / Only run on YouTube

## 🛠️ 技术栈 / Tech Stack

- Chrome Extension Manifest V3
- Vanilla JavaScript
- CSS3

## 📝 注意事项 / Notes

- 仅支持 `.srt` 格式字幕文件
  Only supports `.srt` format subtitle files
- 需要手动上传字幕文件，不支持自动匹配
  Requires manual upload of subtitle files; automatic matching is not supported
- 建议在视频播放前上传字幕以获得最佳同步效果
  Recommended to upload subtitles before video playback for best synchronization

## 🤝 贡献 / Contributing

欢迎提交 Issue 和 Pull Request！
Issues and Pull Requests are welcome!

## 📄 许可证 / License

See the [LICENSE](LICENSE) file for details.

---

**Created by Qwen3.7Max**
