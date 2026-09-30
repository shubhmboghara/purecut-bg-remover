# 🪄 PureCut AI Studio - Ready-Made AI Background Remover & Editor

A production-grade, in-browser **Vite + React 18 + Tailwind CSS** AI Background Remover and Creative Photo Studio.  
**100% Free, Private, and running locally in-browser via WebAssembly (WASM) and ONNX Web.** Zero ML API keys or cloud server costs required!

---

## ⚡ The Tech Stack (Why It's the Best)

| Component | Technology | Why It Beats Everything Else |
| :--- | :--- | :--- |
| **Build & Dev Tool** | **Vite 6** | Sub-300ms startup, instant Hot Module Replacement (HMR). |
| **Frontend Framework** | **React 18** | High-performance reactive state management for 60fps canvas operations. |
| **AI Inference** | **`@imgly/background-removal`** | In-browser Web ML (WASM + WebGL/WebGPU). **Zero API keys, zero monthly bills.** |
| **Styling** | **Tailwind CSS 3.4** | Modern dark-mode studio palette, glassmorphism, responsive controls. |
| **Iconography** | **Lucide React** | Over 1,000 clean, consistent vector icons. |
| **Export FX** | **Canvas Confetti** | Confetti celebration on image export. |

---

## 🚀 How to Run in 2 Seconds

### 1. Install Dependencies (Already installed, run if needed):
```bash
npm install
```

### 2. Start the Studio:
```bash
npm run dev
```

Open your browser at:
```text
http://localhost:3000
```

### 3. Build for Production:
```bash
npm run build
```

---

## ✨ Features Included

1. **⚡ 1-Click AI Background Removal:** Runs on device with zero API keys or server costs.
2. **📦 Turbo Batch Studio (1,000 to 2,000+ Images at Once):**
   - **Zero-Freeze Queue Engine:** Handles 1,000 to 2,000+ images smoothly without freezing the browser or crashing WebGL/WASM memory.
   - **Non-blocking Event Loop Yielding:** 60fps UI responsiveness during bulk processing with live rolling ETA and speed metrics.
   - **Zero-Lag Paginated View:** Instant rendering of large queues with search and status filters (All, Completed, Processing, Pending, Failed).
   - **Batch Output Presets:** Transparent PNG, E-Commerce Pure White (#FFFFFF), or custom solid brand backdrops.
   - **1-Click Bulk ZIP Export:** Fast streaming archive download with `JSZip`.
   - **Seamless Single-Studio Handoff:** Click any batch item to fine-tune it in the full studio editor.
3. **🎨 6 Background Replacement Modes:**
   - **Transparent:** Standard checkerboard grid (PNG).
   - **Solid Color:** Studio palette + custom HTML color picker.
   - **Gradients:** Deep Purple, Sunset Glow, Ocean Breeze, Neon Mint, Warm Sunrise, Studio Moody.
   - **Studio Photos:** Modern Office, Luxury Interior, Forest Sunshine, City Bokeh.
   - **Bokeh Blur:** DSLR aperture blur on the original background with slider.
   - **Custom Upload:** Upload any image from your computer as the new backdrop.
4. **🖌️ Retouch & Mask Brush:**
   - **Erase Mode:** Clean up leftover edges.
   - **Restore Mode:** Paint back hair strands, sunglasses, or accessories.
   - Live circular cursor with adjustable radius and softness feathering (`[` and `]` hotkeys).
5. **📐 Subject Transform:** Click and drag directly on canvas to reposition, scale 20%-250%, 360° rotation, flip H/V, and center alignment.
6. **☀️ Realistic Studio Drop Shadows:** Photorealistic blurred drop/contact shadows with blur, opacity, offset, and color controls.
7. **🎚️ Lighting & Color Grading:** Brightness, contrast, saturation, and warmth adjustments.
8. **📏 Aspect Ratio Presets:** 1:1 (Square), 4:5 (Portrait), 9:16 (Story/TikTok), 16:9 (YouTube), and Original.
9. **🔍 Split Before / After Slider:** Draggable comparison divider.
10. **💾 Full-Resolution Export:** PNG (transparent), JPG (quality slider), WebP, and Copy to Clipboard with confetti celebration!
11. **↩️ Undo / Redo History:** Multi-step history with `Ctrl+Z` / `Ctrl+Y` shortcuts.

---

## 📖 In-Depth Guide & Plugin Manual

For complete architecture details and plugin explanations, read **[`TECH_STACK_AND_GUIDE.md`](file:///e:/BG%20Remove/TECH_STACK_AND_GUIDE.md)**.
