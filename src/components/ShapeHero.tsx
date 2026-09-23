import React from 'react';
import { motion } from 'motion/react';
import { BeamsCanvas, FloatingPaths } from './HeroBackground';

// Hero background: dotted texture (the site's own convention) as the base,
// then a canvas of soft glowing beams, then flowing gradient wave-lines
// layered on top of the beams — both recolored to the site's own palette in
// HeroBackground.tsx. Replaces the earlier rectangular "block shapes"
// version of this hero.
//
// Adapted from kokonutui.com's "Shape Hero" (MIT) for the surrounding
// layout/title, itself adapted for this Create React App + Tailwind v3
// project (see HeroBackground.tsx for the background-layer adaptation
// notes).

const fadeUpVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 1, delay: 0.5 + i * 0.2, ease: [0.25, 0.4, 0.25, 1] },
  }),
};

interface ShapeHeroProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function ShapeHero({ title, subtitle, actions }: ShapeHeroProps) {
  return (
    <div className="relative flex h-screen w-full items-center justify-center overflow-hidden dotted-bg">
      {/* Beams + paths live mostly in the top of the hero, fading out toward
          the bottom edge so they don't carry full-strength all the way down
          into the next section. A CSS mask only affects this layer — the
          dots and the title underneath stay untouched. */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{
          WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 55%, transparent 90%)',
          maskImage: 'linear-gradient(to bottom, black 0%, black 55%, transparent 90%)',
        }}
      >
        <BeamsCanvas />
        <FloatingPaths position={1} />
      </div>

      <div className="container relative z-10 mx-auto px-4 md:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div animate="visible" custom={1} initial="hidden" variants={fadeUpVariants as any}>
            <h1
              className="mb-4 text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight"
            >
              {title}
            </h1>
          </motion.div>
          {subtitle && (
            <motion.div animate="visible" custom={2} initial="hidden" variants={fadeUpVariants as any}>
              <p className="mt-4 mb-10 text-2xl font-light italic text-gray-600">
                {subtitle}
              </p>
            </motion.div>
          )}
          {actions && (
            <motion.div animate="visible" custom={3} initial="hidden" variants={fadeUpVariants as any}>
              {actions}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
