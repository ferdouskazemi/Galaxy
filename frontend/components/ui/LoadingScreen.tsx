'use client';

import { motion } from 'framer-motion';

export default function LoadingScreen(): JSX.Element {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.25),transparent_35%),rgba(0,0,15,0.92)]"
    >
      <div className="glass-panel gradient-border relative flex h-56 w-56 items-center justify-center rounded-full">
        <motion.div
          className="absolute h-40 w-40 rounded-full border border-glow/40"
          animate={{ rotate: 360 }}
          transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute h-28 w-52 rounded-full border border-aurora/30"
          animate={{ rotate: -360, scale: [1, 1.08, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="text-center">
          <p className="font-display text-2xl tracking-[0.32em] text-star">GALAXY</p>
          <p className="mt-2 font-mono text-xs uppercase tracking-[0.4em] text-star/60">
            Forming the universe
          </p>
        </div>
      </div>
    </motion.div>
  );
}
