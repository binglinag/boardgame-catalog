"use client";

import { useEffect, useRef, memo } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  hue: number;
  pulsePhase: number;
}

const PARTICLE_COUNT_DESKTOP = 80;
const PARTICLE_COUNT_TABLET = 50;
const PARTICLE_COUNT_MOBILE = 30;
const CONNECTION_DISTANCE = 180;
const PARTICLE_SPEED = 0.15;

function getParticleCount(): number {
  if (typeof window === "undefined") return PARTICLE_COUNT_DESKTOP;
  const w = window.innerWidth;
  if (w < 640) return PARTICLE_COUNT_MOBILE;
  if (w < 1024) return PARTICLE_COUNT_TABLET;
  return PARTICLE_COUNT_DESKTOP;
}

function createParticle(w: number, h: number): Particle {
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * PARTICLE_SPEED,
    vy: (Math.random() - 0.5) * PARTICLE_SPEED,
    size: Math.random() * 2.5 + 0.8,
    opacity: Math.random() * 0.4 + 0.1,
    hue: Math.random() * 60 + 240, // 240-300: blue to purple range
    pulsePhase: Math.random() * Math.PI * 2,
  };
}

const ParticleBackground = memo(function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let particleCount = getParticleCount();

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Recreate particles on resize
      particleCount = getParticleCount();
      const particles: Particle[] = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push(createParticle(width, height));
      }
      particlesRef.current = particles;
    }

    resize();
    window.addEventListener("resize", resize);

    let time = 0;
    function animate() {
      time += 0.005;
      ctx!.clearRect(0, 0, width, height);

      const particles = particlesRef.current;

      // Update & draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Organic drift
        p.vx += (Math.sin(time * 2.3 + p.pulsePhase) * 0.003);
        p.vy += (Math.cos(time * 1.7 + p.pulsePhase) * 0.003);

        // Clamp speed
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed > PARTICLE_SPEED) {
          p.vx = (p.vx / speed) * PARTICLE_SPEED;
          p.vy = (p.vy / speed) * PARTICLE_SPEED;
        }

        p.x += p.vx;
        p.y += p.vy;

        // Wrap around edges
        if (p.x < -50) p.x = width + 50;
        if (p.x > width + 50) p.x = -50;
        if (p.y < -50) p.y = height + 50;
        if (p.y > height + 50) p.y = -50;

        // Pulsing opacity
        const pulse = Math.sin(time * 1.5 + p.pulsePhase) * 0.15 + 0.85;
        const currentOpacity = p.opacity * pulse;

        // Draw particle with glow
        const gradient = ctx!.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4);
        gradient.addColorStop(0, `hsla(${p.hue}, 70%, 75%, ${currentOpacity * 1.2})`);
        gradient.addColorStop(0.5, `hsla(${p.hue}, 60%, 70%, ${currentOpacity * 0.3})`);
        gradient.addColorStop(1, `hsla(${p.hue}, 50%, 65%, 0)`);

        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
        ctx!.fillStyle = gradient;
        ctx!.fill();

        // Core
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx!.fillStyle = `hsla(${p.hue}, 80%, 80%, ${currentOpacity})`;
        ctx!.fill();
      }

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < CONNECTION_DISTANCE) {
            const alpha = (1 - dist / CONNECTION_DISTANCE) * 0.08;
            const midHue = (particles[i].hue + particles[j].hue) / 2;
            ctx!.beginPath();
            ctx!.moveTo(particles[i].x, particles[i].y);
            ctx!.lineTo(particles[j].x, particles[j].y);
            ctx!.strokeStyle = `hsla(${midHue}, 60%, 70%, ${alpha})`;
            ctx!.lineWidth = 0.5;
            ctx!.stroke();
          }
        }
      }

      rafRef.current = requestAnimationFrame(animate);
    }

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
});

export default ParticleBackground;
