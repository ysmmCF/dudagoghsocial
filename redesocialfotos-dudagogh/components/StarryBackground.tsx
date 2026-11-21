"use client";

import React, { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  radius: number;
  color: string;
  alpha: number;
  twinkleSpeed: number;
  swirlAngle: number;
  swirlSpeed: number;
}

export default function StarryBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    // Van Gogh palette colors
    const colors = [
      "#f5b027", // Gold
      "#fde047", // Yellow star
      "#ffffff", // Bright white
      "#60a5fa", // Azure sky blue
      "#a7f3d0", // Starlight emerald tint
    ];

    // Generate stars
    const starCount = Math.min(Math.floor((width * height) / 4000), 180);
    const stars: Star[] = [];

    const centerX = width * 0.7;
    const centerY = height * 0.25;

    for (let i = 0; i < starCount; i++) {
      const radius = Math.random() * 2 + 0.5;
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * Math.max(width, height) * 0.7;

      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: radius > 1.8 ? radius * 1.3 : radius,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.8 + 0.2,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        swirlAngle: angle,
        swirlSpeed: (0.0002 + Math.random() * 0.0003) * (Math.random() > 0.5 ? 1 : -1),
      });
    }

    let frame = 0;

    const render = () => {
      frame++;
      ctx.clearRect(0, 0, width, height);

      // Deep Van Gogh night sky background gradient
      const bgGradient = ctx.createRadialGradient(
        width * 0.7,
        height * 0.2,
        50,
        width * 0.5,
        height * 0.5,
        Math.max(width, height)
      );
      bgGradient.addColorStop(0, "#1e295d"); // Bright swirling center
      bgGradient.addColorStop(0.35, "#10183b");
      bgGradient.addColorStop(0.75, "#0a0e27");
      bgGradient.addColorStop(1, "#060919");

      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // Draw subtle swirling galaxy nebula rings (Van Gogh brush stroke effect)
      ctx.save();
      ctx.globalCompositeOperation = "screen";

      const swirlGradient = ctx.createRadialGradient(
        centerX,
        centerY,
        20,
        centerX,
        centerY,
        width * 0.6
      );
      swirlGradient.addColorStop(0, "rgba(245, 176, 39, 0.15)");
      swirlGradient.addColorStop(0.4, "rgba(37, 59, 124, 0.18)");
      swirlGradient.addColorStop(0.8, "rgba(15, 23, 56, 0.05)");
      swirlGradient.addColorStop(1, "transparent");

      ctx.fillStyle = swirlGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, width * 0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Render stars
      stars.forEach((star) => {
        // Twinkle effect
        star.alpha += Math.sin(frame * star.twinkleSpeed) * 0.015;
        if (star.alpha > 1) star.alpha = 1;
        if (star.alpha < 0.15) star.alpha = 0.15;

        // Subtle movement
        star.swirlAngle += star.swirlSpeed;
        const currentX = star.x + Math.cos(star.swirlAngle) * 3;
        const currentY = star.y + Math.sin(star.swirlAngle) * 3;

        ctx.save();
        ctx.globalAlpha = star.alpha;
        ctx.fillStyle = star.color;
        ctx.beginPath();
        ctx.arc(currentX, currentY, star.radius, 0, Math.PI * 2);
        ctx.fill();

        // Starlight glow for golden star accents
        if (star.color === "#f5b027" || star.color === "#fde047") {
          ctx.shadowBlur = 10;
          ctx.shadowColor = "rgba(245, 176, 39, 0.8)";
          ctx.beginPath();
          ctx.arc(currentX, currentY, star.radius * 0.6, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      aria-hidden="true"
    />
  );
}
