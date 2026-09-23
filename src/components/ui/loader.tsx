import React, { useEffect, useRef } from 'react';
import { animate, svg, utils } from 'animejs';

// A small morphing-blob loading indicator, built with the same anime.js
// primitives as the rest of the loading states: two overlapping polygons,
// one invisible and re-randomized each tick, the other continuously
// morphing into it. The fill cycles through the site's own gradient colors
// (the same orange -> pink -> blue used on the "Get to Know Us" card) so it
// reads as part of the site rather than a generic spinner.
//
// Refs are used instead of animejs's class-based selectors so multiple
// Loaders can be mounted on the same page at once without colliding.

const GRADIENT_COLORS = ['#fb923c', '#ec4899', '#2563eb']; // orange-400, pink-500, blue-600

interface LoaderProps {
  label?: string;
  size?: number;
  className?: string;
}

const generatePoints = (cx: number, cy: number, rOuter: number) => {
  const total = utils.random(4, 10);
  const rInner = utils.random(rOuter * 0.3, rOuter * 0.8);
  const isOdd = (n: number) => n % 2;
  const count = isOdd(total) ? total + 1 : total;
  let points = '';
  for (let i = 0; i < count; i++) {
    const r = isOdd(i) ? rInner : rOuter;
    const a = (2 * Math.PI * i) / count - Math.PI / 2;
    const x = cx + utils.round(r * Math.cos(a), 1);
    const y = cy + utils.round(r * Math.sin(a), 1);
    points += `${x},${y} `;
  }
  return points.trim();
};

const Loader: React.FC<LoaderProps> = ({ label, size = 56, className = '' }) => {
  const visiblePolyRef = useRef<SVGPolygonElement>(null);
  const targetPolyRef = useRef<SVGPolygonElement>(null);

  useEffect(() => {
    const visible = visiblePolyRef.current;
    const target = targetPolyRef.current;
    if (!visible || !target) return;

    let stopped = false;
    const cx = 50;
    const cy = 50;
    const rOuter = 42;

    utils.set(target, { points: generatePoints(cx, cy, rOuter) });

    const morphNext = () => {
      if (stopped) return;
      utils.set(target, { points: generatePoints(cx, cy, rOuter) });
      animate(visible, {
        points: svg.morphTo(target),
        ease: 'inOutCirc',
        duration: 700,
        onComplete: morphNext,
      });
    };
    morphNext();

    const colorAnim = animate(visible, {
      fill: GRADIENT_COLORS,
      duration: 1500,
      loop: true,
      ease: 'inOutSine',
    });

    return () => {
      stopped = true;
      colorAnim.pause();
    };
  }, []);

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <svg width={size} height={size} viewBox="0 0 100 100" role="status" aria-label={label || 'Loading'}>
        <polygon ref={targetPolyRef} points="" style={{ display: 'none' }} />
        <polygon ref={visiblePolyRef} points={generatePoints(50, 50, 42)} fill={GRADIENT_COLORS[0]} />
      </svg>
      {label && <span className="text-sm text-gray-500">{label}</span>}
    </div>
  );
};

export default Loader;
