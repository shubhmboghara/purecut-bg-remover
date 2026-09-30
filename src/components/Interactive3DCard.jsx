import React, { useRef, useState, useCallback } from 'react';

/**
 * Interactive 3D Card with Spatial Perspective Tilt & Specular Light Reflection
 * Creates a tactile physical 3D surface that tilts toward the user's cursor.
 */
export default function Interactive3DCard({
  children,
  className = '',
  maxTilt = 8,
  glowColor = 'oklch(0.63 0.25 275 / 0.25)',
  onClick
}) {
  const cardRef = useRef(null);
  const [style, setStyle] = useState({
    transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
    transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
  });
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });
  const rafRef = useRef(null);

  const handleMouseMove = useCallback((e) => {
    if (!cardRef.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    rafRef.current = requestAnimationFrame(() => {
      const rect = cardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Normalized coordinates (-1 to 1)
      const normX = (x - centerX) / centerX;
      const normY = (y - centerY) / centerY;

      // Inverted Y for natural tilt
      const rotateX = -normY * maxTilt;
      const rotateY = normX * maxTilt;

      setStyle({
        transform: `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`,
        transition: 'transform 0.1s ease-out'
      });

      setGlare({
        x: Math.round((x / rect.width) * 100),
        y: Math.round((y / rect.height) * 100),
        opacity: 0.35
      });
    });
  }, [maxTilt]);

  const handleMouseLeave = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
      transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
    });
    setGlare({ x: 50, y: 50, opacity: 0 });
  }, []);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={style}
      className={`relative transform-gpu preserve-3d will-change-transform ${className}`}
    >
      {/* Specular 3D Holographic Surface Glare */}
      <div
        className="pointer-events-none absolute inset-0 rounded-[inherit] z-20 transition-opacity duration-300 overflow-hidden mix-blend-overlay"
        style={{
          opacity: glare.opacity,
          background: `radial-gradient(circle 320px at ${glare.x}% ${glare.y}%, rgba(255, 255, 255, 0.6), transparent 70%)`
        }}
      />

      {/* Ambient 3D Rim Backlight */}
      <div
        className="pointer-events-none absolute -inset-1 rounded-[inherit] -z-10 transition-opacity duration-300 blur-xl"
        style={{
          opacity: glare.opacity > 0 ? 0.7 : 0,
          background: `radial-gradient(circle 350px at ${glare.x}% ${glare.y}%, ${glowColor}, transparent 80%)`
        }}
      />

      {/* Child Content */}
      <div className="relative z-10 w-full h-full preserve-3d">
        {children}
      </div>
    </div>
  );
}
