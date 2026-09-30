/**
 * Canvas Multi-Layer Rendering Engine
 */

export function renderCompositeCanvas({
  bgCanvas,
  shadowCanvas,
  mainCanvas,
  originalImage,
  maskCanvas,
  background,
  transform,
  shadow,
  filters
}) {
  if (!bgCanvas || !shadowCanvas || !mainCanvas) return;

  const w = mainCanvas.width;
  const h = mainCanvas.height;

  const bgCtx = bgCanvas.getContext('2d');
  const shadowCtx = shadowCanvas.getContext('2d');
  const mainCtx = mainCanvas.getContext('2d');

  // Clear all canvases
  bgCtx.clearRect(0, 0, w, h);
  shadowCtx.clearRect(0, 0, w, h);
  mainCtx.clearRect(0, 0, w, h);

  // 1. Render Background
  renderBackgroundLayer(bgCtx, background, originalImage, w, h);

  // 2. Render Studio Shadow
  if (shadow.enabled && maskCanvas) {
    renderShadowLayer(shadowCtx, maskCanvas, transform, shadow, w, h);
  }

  // 3. Render Subject
  if (maskCanvas) {
    renderSubjectLayer(mainCtx, maskCanvas, transform, filters, w, h);
  }
}

function renderBackgroundLayer(ctx, bg, originalImage, w, h) {
  if (bg.type === 'transparent') {
    return;
  }

  if (bg.type === 'color') {
    ctx.fillStyle = bg.color;
    ctx.fillRect(0, 0, w, h);
    return;
  }

  if (bg.type === 'gradient') {
    const grad = ctx.createLinearGradient(0, 0, w, h);
    if (bg.gradient.includes('#667eea')) {
      grad.addColorStop(0, '#667eea');
      grad.addColorStop(1, '#764ba2');
    } else if (bg.gradient.includes('#f093fb')) {
      grad.addColorStop(0, '#f093fb');
      grad.addColorStop(1, '#f5576c');
    } else if (bg.gradient.includes('#4facfe')) {
      grad.addColorStop(0, '#4facfe');
      grad.addColorStop(1, '#00f2fe');
    } else if (bg.gradient.includes('#43e97b')) {
      grad.addColorStop(0, '#43e97b');
      grad.addColorStop(1, '#38f9d7');
    } else if (bg.gradient.includes('#fa709a')) {
      grad.addColorStop(0, '#fa709a');
      grad.addColorStop(1, '#fee140');
    } else if (bg.gradient.includes('#2b5876')) {
      grad.addColorStop(0, '#2b5876');
      grad.addColorStop(1, '#4e4376');
    } else {
      grad.addColorStop(0, '#09203f');
      grad.addColorStop(1, '#537895');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    return;
  }

  if (bg.type === 'photos' && bg.photoUrl) {
    if (bg.cachedPhoto && bg.cachedPhoto.src.endsWith(bg.photoUrl)) {
      drawCoverImage(ctx, bg.cachedPhoto, w, h);
    } else {
      const p = new Image();
      p.crossOrigin = 'anonymous';
      p.onload = () => {
        bg.cachedPhoto = p;
        drawCoverImage(ctx, p, w, h);
      };
      p.src = bg.photoUrl;
      if (p.complete && p.naturalWidth > 0) {
        bg.cachedPhoto = p;
        drawCoverImage(ctx, p, w, h);
      }
    }
    return;
  }

  if (bg.type === 'blur' && originalImage) {
    ctx.save();
    ctx.filter = `blur(${bg.blurRadius || 16}px)`;
    drawCoverImage(ctx, originalImage, w, h);
    ctx.restore();
    return;
  }

  if (bg.type === 'custom' && bg.customImage) {
    drawCoverImage(ctx, bg.customImage, w, h);
    return;
  }
}

function renderShadowLayer(ctx, maskCanvas, transform, shadow, w, h) {
  ctx.save();

  const rgb = hexToRgb(shadow.color || '#000000');
  ctx.shadowColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${shadow.opacity || 0.45})`;
  ctx.shadowBlur = shadow.blur || 25;
  ctx.shadowOffsetX = shadow.offsetX || 0;
  ctx.shadowOffsetY = shadow.offsetY || 20;

  const centerX = w / 2 + (transform.x || 0);
  const centerY = h / 2 + (transform.y || 0);

  ctx.translate(centerX, centerY);
  ctx.rotate(((transform.rotation || 0) * Math.PI) / 180);
  ctx.scale(
    (transform.scale || 1.0) * (transform.flipH || 1),
    (transform.scale || 1.0) * (transform.flipV || 1)
  );

  ctx.drawImage(maskCanvas, -maskCanvas.width / 2, -maskCanvas.height / 2);
  ctx.restore();
}

function renderSubjectLayer(ctx, maskCanvas, transform, filters, w, h) {
  ctx.save();

  let filterStr = `brightness(${filters.brightness || 100}%) contrast(${filters.contrast || 100}%) saturate(${filters.saturation || 100}%)`;
  if (filters.warmth) {
    filterStr += filters.warmth > 0 ? ` sepia(${filters.warmth * 0.8}%)` : ` hue-rotate(${filters.warmth * 1.5}deg)`;
  }
  ctx.filter = filterStr;

  const centerX = w / 2 + (transform.x || 0);
  const centerY = h / 2 + (transform.y || 0);

  ctx.translate(centerX, centerY);
  ctx.rotate(((transform.rotation || 0) * Math.PI) / 180);
  ctx.scale(
    (transform.scale || 1.0) * (transform.flipH || 1),
    (transform.scale || 1.0) * (transform.flipV || 1)
  );

  ctx.drawImage(maskCanvas, -maskCanvas.width / 2, -maskCanvas.height / 2);
  ctx.restore();
}

function drawCoverImage(ctx, img, cw, ch) {
  const imgRatio = img.width / img.height;
  const canvasRatio = cw / ch;
  let dw, dh, dx, dy;

  if (imgRatio > canvasRatio) {
    dh = ch;
    dw = ch * imgRatio;
    dx = (cw - dw) / 2;
    dy = 0;
  } else {
    dw = cw;
    dh = cw / imgRatio;
    dx = 0;
    dy = (ch - dh) / 2;
  }
  ctx.drawImage(img, dx, dy, dw, dh);
}

function hexToRgb(hex) {
  const cleanHex = hex.replace('#', '');
  const num = parseInt(cleanHex, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

export function generateExportBlob({ bgCanvas, shadowCanvas, mainCanvas, format, quality, scale = 1.0 }) {
  return new Promise((resolve) => {
    const s = Math.max(0.5, Math.min(4.0, scale || 1.0));
    const targetW = Math.round(mainCanvas.width * s);
    const targetH = Math.round(mainCanvas.height * s);

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = targetW;
    exportCanvas.height = targetH;
    const ctx = exportCanvas.getContext('2d');

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    if (format === 'jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, targetW, targetH);
    }

    if (bgCanvas) ctx.drawImage(bgCanvas, 0, 0, targetW, targetH);
    if (shadowCanvas) ctx.drawImage(shadowCanvas, 0, 0, targetW, targetH);
    ctx.drawImage(mainCanvas, 0, 0, targetW, targetH);

    const mime = format === 'jpeg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';
    const exportQuality = format === 'png' ? 1.0 : quality;
    exportCanvas.toBlob((blob) => resolve(blob), mime, exportQuality);
  });
}
