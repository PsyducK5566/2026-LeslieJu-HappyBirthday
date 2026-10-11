# 2026 Happy Birthday

一頁式生日祝福網頁 — 獻給天秤座的妳。

## 設計

- **色彩**：淡藍 `#E0F7FA` × 玫瑰粉 `#FCE4EC` 柔和漸層，主要文字深藍 `#1A237E`
- **標題**：Great Vibes 英文手寫草書
- **主視覺**：拍立得風格白色相框 + 柔和深藍陰影，滑鼠移上微微放大
- **裝飾**：純 inline SVG 手繪非洲菊，置於照片左上／右下對角線，帶輕微搖曳動畫
- **祝福語**：毛玻璃（Glassmorphism）半透明圓角區塊
- **動態**：進場淡入上浮；Canvas 繪製半透明花瓣飄落與微光粒子
- **RWD**：手機與桌機皆完整呈現
- **無障礙**：支援 `prefers-reduced-motion`，會關閉所有動畫

## 檔案

| 檔案 | 說明 |
| --- | --- |
| `index.html` | 頁面結構與非洲菊 SVG 定義 |
| `style.css` | 版面、配色、進場與裝飾動畫 |
| `script.js` | Canvas 花瓣／微光背景動畫 |
| `picture/` | 照片素材 |

## 本機預覽

```bash
python -m http.server 8000
# 瀏覽 http://localhost:8000
```

## 部署

GitHub Pages：Settings → Pages → Source 選 `Deploy from a branch` → `main` / `(root)`。
