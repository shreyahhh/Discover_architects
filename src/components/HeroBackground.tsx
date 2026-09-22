import React, { memo, useEffect, useMemo, useRef } from 'react';
import { motion } from 'motion/react';

// Adapted from kokonutui.com's "Beams Background" + "Background Paths" (MIT)
// for this Create React App + Tailwind v3 project, stripped of their own
// title/heading markup (the hero keeps its own existing title) and dark-mode
// branches (the site has no dark mode), and recolored to the site's actual
// palette instead of the demos' blue/purple defaults — the same
// orange-400 -> pink-500 -> blue-600 gradient used on the "Get to Know Us"
// and "Careers" cards elsewhere on this page, plus indigo-500 to match the
// button gradients used throughout the site.

// ---------------------------------------------------------------------------
// Beams: a canvas of soft glowing diagonal beams drifting upward.
// ---------------------------------------------------------------------------

const SITE_HUES = [25, 330, 217, 239]; // orange-400, pink-500, blue-600, indigo-500

interface Beam {
  x: number;
  y: number;
  width: number;
  length: number;
  angle: number;
  speed: number;
  opacity: number;
  hue: number;
  pulse: number;
  pulseSpeed: number;
}

function createBeam(width: number, height: number): Beam {
  const angle = -35 + Math.random() * 10;
  return {
    x: Math.random() * width * 1.5 - width * 0.25,
    y: Math.random() * height * 1.5 - height * 0.25,
    width: 30 + Math.random() * 60,
    length: height * 2.5,
    angle,
    speed: 0.6 + Math.random() * 1.2,
    opacity: 0.1 + Math.random() * 0.12,
    hue: SITE_HUES[Math.floor(Math.random() * SITE_HUES.length)],
    pulse: Math.random() * Math.PI * 2,
    pulseSpeed: 0.02 + Math.random() * 0.03,
  };
}

export const BeamsCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const beamsRef = useRef<Beam[]>([]);
  const animationFrameRef = useRef<number>(0);
  const MINIMUM_BEAMS = 16;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const parent = canvas.parentElement;
    // Beam physics/positions are computed in CSS-pixel space (matching what
    // ctx.scale(dpr, dpr) puts the drawing context into) — NOT in
    // canvas.width/height, which are the device-pixel buffer size. Using the
    // device-pixel size here was the bug: on any display with dpr !== 1,
    // beam positions got scaled by dpr via this math AND again by the
    // context's own dpr scale, pushing them so far outside the visible area
    // that their motion was imperceptible (looked frozen).
    const sizeRef = { width: 0, height: 0 };

    const updateCanvasSize = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = parent?.clientWidth || window.innerWidth;
      const height = parent?.clientHeight || window.innerHeight;
      sizeRef.width = width;
      sizeRef.height = height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const totalBeams = Math.floor(MINIMUM_BEAMS * 1.5);
      beamsRef.current = Array.from({ length: totalBeams }, () => createBeam(width, height));
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    function resetBeam(beam: Beam, index: number, totalBeams: number) {
      const column = index % 3;
      const spacing = sizeRef.width / 3;
      beam.y = sizeRef.height + 100;
      beam.x = column * spacing + spacing / 2 + (Math.random() - 0.5) * spacing * 0.5;
      beam.width = 100 + Math.random() * 100;
      beam.speed = 0.5 + Math.random() * 0.4;
      beam.hue = SITE_HUES[index % SITE_HUES.length];
      beam.opacity = 0.16 + Math.random() * 0.08;
      return beam;
    }

    function drawBeam(ctx: CanvasRenderingContext2D, beam: Beam) {
      ctx.save();
      ctx.translate(beam.x, beam.y);
      ctx.rotate((beam.angle * Math.PI) / 180);

      const pulsingOpacity = beam.opacity * (0.8 + Math.sin(beam.pulse) * 0.2);
      const gradient = ctx.createLinearGradient(0, 0, 0, beam.length);
      const saturation = '80%';
      const lightness = '55%';

      gradient.addColorStop(0, `hsla(${beam.hue}, ${saturation}, ${lightness}, 0)`);
      gradient.addColorStop(0.1, `hsla(${beam.hue}, ${saturation}, ${lightness}, ${pulsingOpacity * 0.5})`);
      gradient.addColorStop(0.4, `hsla(${beam.hue}, ${saturation}, ${lightness}, ${pulsingOpacity})`);
      gradient.addColorStop(0.6, `hsla(${beam.hue}, ${saturation}, ${lightness}, ${pulsingOpacity})`);
      gradient.addColorStop(0.9, `hsla(${beam.hue}, ${saturation}, ${lightness}, ${pulsingOpacity * 0.5})`);
      gradient.addColorStop(1, `hsla(${beam.hue}, ${saturation}, ${lightness}, 0)`);

      ctx.fillStyle = gradient;
      ctx.fillRect(-beam.width / 2, 0, beam.width, beam.length);
      ctx.restore();
    }

    function animate() {
      if (!(canvas && ctx)) return;
      ctx.clearRect(0, 0, sizeRef.width, sizeRef.height);
      ctx.filter = 'blur(35px)';

      const totalBeams = beamsRef.current.length;
      beamsRef.current.forEach((beam, index) => {
        beam.y -= beam.speed;
        beam.pulse += beam.pulseSpeed;
        if (beam.y + beam.length < -100) resetBeam(beam, index, totalBeams);
        drawBeam(ctx, beam);
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    }
    animate();

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} className="absolute inset-0" style={{ filter: 'blur(15px)' }} />
      <motion.div
        animate={{ opacity: [0.05, 0.15, 0.05] }}
        className="absolute inset-0 bg-neutral-900/5"
        style={{ backdropFilter: 'blur(50px)' }}
        transition={{ duration: 10, ease: 'easeInOut', repeat: Infinity }}
      />
    </>
  );
};

// ---------------------------------------------------------------------------
// FloatingPaths: flowing gradient wave-lines drawn over the beams.
// ---------------------------------------------------------------------------

interface Point {
  x: number;
  y: number;
}

interface PathData {
  id: string;
  d: string;
  opacity: number;
  width: number;
}

function generateAestheticPath(index: number, position: number, type: 'primary' | 'secondary' | 'accent'): string {
  const baseAmplitude = type === 'primary' ? 150 : type === 'secondary' ? 100 : 60;
  const phase = index * 0.2;
  const points: Point[] = [];
  const segments = type === 'primary' ? 10 : type === 'secondary' ? 8 : 6;

  const startX = 2400;
  const startY = 800;
  const endX = -2400;
  const endY = -800 + index * 25;

  for (let i = 0; i <= segments; i++) {
    const progress = i / segments;
    const eased = 1 - (1 - progress) ** 2;
    const baseX = startX + (endX - startX) * eased;
    const baseY = startY + (endY - startY) * eased;
    const amplitudeFactor = 1 - eased * 0.3;
    const wave1 = Math.sin(progress * Math.PI * 3 + phase) * (baseAmplitude * 0.7 * amplitudeFactor);
    const wave2 = Math.cos(progress * Math.PI * 4 + phase) * (baseAmplitude * 0.3 * amplitudeFactor);
    const wave3 = Math.sin(progress * Math.PI * 2 + phase) * (baseAmplitude * 0.2 * amplitudeFactor);
    points.push({ x: baseX * position, y: baseY + wave1 + wave2 + wave3 });
  }

  return points
    .map((point, i) => {
      if (i === 0) return `M ${point.x} ${point.y}`;
      const prev = points[i - 1];
      const tension = 0.4;
      const cp1x = prev.x + (point.x - prev.x) * tension;
      const cp1y = prev.y;
      const cp2x = prev.x + (point.x - prev.x) * (1 - tension);
      const cp2y = point.y;
      return `C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${point.x} ${point.y}`;
    })
    .join(' ');
}

const generateUniqueId = (prefix: string): string => `${prefix}-${Math.random().toString(36).slice(2, 11)}`;

export const FloatingPaths = memo(function FloatingPaths({ position }: { position: number }) {
  const primaryPaths: PathData[] = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => ({
        id: generateUniqueId('primary'),
        d: generateAestheticPath(i, position, 'primary'),
        opacity: 0.15 + i * 0.02,
        width: 1.5 + i * 0.12,
      })),
    [position]
  );

  const secondaryPaths: PathData[] = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        id: generateUniqueId('secondary'),
        d: generateAestheticPath(i, position, 'secondary'),
        opacity: 0.12 + i * 0.015,
        width: 1 + i * 0.1,
      })),
    [position]
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <svg
        className="h-full w-full"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
        viewBox="-2400 -800 4800 1600"
      >
        <defs>
          <linearGradient id="heroPathGradient" x1="0%" x2="100%" y1="0%" y2="0%">
            <stop offset="0%" stopColor="rgba(251,146,60,0.6)" />
            <stop offset="50%" stopColor="rgba(236,72,153,0.6)" />
            <stop offset="100%" stopColor="rgba(37,99,235,0.6)" />
          </linearGradient>
        </defs>

        <g>
          {primaryPaths.map((path) => (
            <motion.path
              key={path.id}
              d={path.d}
              stroke="url(#heroPathGradient)"
              strokeLinecap="round"
              strokeWidth={path.width}
              style={{ opacity: path.opacity }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1, y: [0, -15, 0] }}
              transition={{
                opacity: { duration: 1 },
                scale: { duration: 1 },
                y: { duration: 8, repeat: Infinity, ease: 'easeInOut', repeatType: 'reverse' },
              }}
            />
          ))}
        </g>

        <g style={{ opacity: 0.8 }}>
          {secondaryPaths.map((path) => (
            <motion.path
              key={path.id}
              d={path.d}
              stroke="url(#heroPathGradient)"
              strokeLinecap="round"
              strokeWidth={path.width}
              style={{ opacity: path.opacity }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1, y: [0, -10, 0] }}
              transition={{
                opacity: { duration: 1 },
                scale: { duration: 1 },
                y: { duration: 6, repeat: Infinity, ease: 'easeInOut', repeatType: 'reverse' },
              }}
            />
          ))}
        </g>
      </svg>
    </div>
  );
});
