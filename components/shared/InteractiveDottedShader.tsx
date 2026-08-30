"use client";

import React, { useEffect, useRef } from "react";

interface DottedShaderProps {
  className?: string;
}

interface Dot {
  baseX: number;
  baseY: number;
  currentX: number;
  currentY: number;
  vx: number;
  vy: number;
  size: number;
  baseAlpha: number;
  phase: number;
}

export function InteractiveDottedShader({ className = "" }: DottedShaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let dots: Dot[] = [];

    // Pointer state (works seamlessly with Touch & Mouse)
    const pointer = {
      x: -1000,
      y: -1000,
      targetX: -1000,
      targetY: -1000,
      isActive: false,
      radius: 110, // interaction radius
    };

    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    // Mobile optimization: increase grid spacing to significantly reduce particle count
    const gridSpacing = isMobile ? 38 : 30;
    pointer.radius = isMobile ? 115 : 145;

    const initDots = () => {
      const rect = container.getBoundingClientRect();
      width = Math.floor(rect.width);
      height = Math.floor(rect.height);

      if (width === 0 || height === 0) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap at 2 for battery & mobile GPU
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      dots = [];
      const cols = Math.ceil(width / gridSpacing);
      const rows = Math.ceil(height / gridSpacing);

      for (let r = 0; r <= rows; r++) {
        for (let c = 0; c <= cols; c++) {
          const baseX = c * gridSpacing + (gridSpacing / 2);
          const baseY = r * gridSpacing + (gridSpacing / 2);

          dots.push({
            baseX,
            baseY,
            currentX: baseX,
            currentY: baseY,
            vx: 0,
            vy: 0,
            size: isMobile ? 1.6 : 1.8,
            baseAlpha: 0.35, // High baseline visibility
            phase: Math.random() * Math.PI * 2,
          });
        }
      }
    };

    initDots();

    // Event handlers for Mouse & Touch
    const handlePointerMove = (clientX: number, clientY: number) => {
      const rect = container.getBoundingClientRect();
      pointer.targetX = clientX - rect.left;
      pointer.targetY = clientY - rect.top;
      pointer.isActive = true;
    };

    const handleMouseMove = (e: MouseEvent) => {
      handlePointerMove(e.clientX, e.clientY);
    };

    const handleMouseLeave = () => {
      pointer.isActive = false;
      pointer.targetX = -1000;
      pointer.targetY = -1000;
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        handlePointerMove(touch.clientX, touch.clientY);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        handlePointerMove(touch.clientX, touch.clientY);
      }
    };

    const handleTouchEnd = () => {
      pointer.isActive = false;
      pointer.targetX = -1000;
      pointer.targetY = -1000;
    };

    // Attach passive touch/mouse listeners to parent hero container
    const parent = container.parentElement || container;
    parent.addEventListener("mousemove", handleMouseMove, { passive: true });
    parent.addEventListener("mouseleave", handleMouseLeave, { passive: true });
    parent.addEventListener("touchstart", handleTouchStart, { passive: true });
    parent.addEventListener("touchmove", handleTouchMove, { passive: true });
    parent.addEventListener("touchend", handleTouchEnd, { passive: true });
    parent.addEventListener("touchcancel", handleTouchEnd, { passive: true });

    // Handle Resize
    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        initDots();
      }, 150);
    };

    window.addEventListener("resize", handleResize);

    // Animation Loop
    let time = 0;
    let isVisible = true;

    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const render = () => {
      if (!isVisible) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      time += 0.025;
      ctx.clearRect(0, 0, width, height);

      // Smooth pointer interpolation
      pointer.x += (pointer.targetX - pointer.x) * 0.22;
      pointer.y += (pointer.targetY - pointer.y) * 0.22;

      const pRadius = pointer.radius;
      const pRadiusSq = pRadius * pRadius;

      // Render dots
      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];

        // Ambient gentle floating motion
        const ambientOffset = Math.sin(time + dot.phase) * 0.9;
        const targetBaseY = dot.baseY + ambientOffset;

        // Interaction calculation with pointer
        let dx = dot.currentX - pointer.x;
        let dy = dot.currentY - pointer.y;
        let distSq = dx * dx + dy * dy;

        let alpha = dot.baseAlpha + Math.sin(time * 0.6 + dot.phase) * 0.06;
        let size = dot.size;
        let color = "rgba(30, 41, 59, "; // Distinct dark slate/indigo (visible against light background)

        if (distSq < pRadiusSq) {
          const dist = Math.sqrt(distSq);
          const factor = 1 - dist / pRadius; // 0 to 1

          // Push particles away from touch point with responsive spring easing
          const angle = Math.atan2(dy, dx);
          const pushForce = factor * (isMobile ? 18 : 26);
          
          dot.currentX += Math.cos(angle) * pushForce * 0.25;
          dot.currentY += Math.sin(angle) * pushForce * 0.25;

          // Vivid emerald highlight with high opacity (up to 1.0)
          alpha = Math.min(1.0, dot.baseAlpha + factor * 0.65);
          size = dot.size * (1 + factor * 1.3);
          color = `rgba(16, 185, 129, `; // Vivid Emerald Glow
        } else {
          // Return smoothly to base position
          dot.currentX += (dot.baseX - dot.currentX) * 0.1;
          dot.currentY += (targetBaseY - dot.currentY) * 0.1;
        }

        ctx.fillStyle = `${color}${alpha})`;
        ctx.beginPath();
        ctx.arc(dot.currentX, dot.currentY, size, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearTimeout(resizeTimeout);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("resize", handleResize);
      parent.removeEventListener("mousemove", handleMouseMove);
      parent.removeEventListener("mouseleave", handleMouseLeave);
      parent.removeEventListener("touchstart", handleTouchStart);
      parent.removeEventListener("touchmove", handleTouchMove);
      parent.removeEventListener("touchend", handleTouchEnd);
      parent.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 w-full h-full max-w-full overflow-hidden pointer-events-none z-0 select-none ${className}`}
      style={{ touchAction: "none" }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full max-w-full block"
      />
    </div>
  );
}
