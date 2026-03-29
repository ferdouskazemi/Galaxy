'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { useGalaxyStore } from '@/hooks/useGalaxy';

export default function LiveFeed(): JSX.Element {
  const liveFeed = useGalaxyStore((state) => state.liveFeed);
  const selectBody = useGalaxyStore((state) => state.selectBody);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className="pointer-events-auto absolute left-4 top-4 z-20 w-[min(360px,calc(100vw-2rem))]">
      <div className="glass-panel gradient-border rounded-[28px] px-5 py-4 md:px-6">
        <div className="flex items-center justify-between">
          <p className="font-display text-lg tracking-[0.16em] text-star">Live Feed</p>
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            className="panel-button rounded-full px-3 py-2 text-xs uppercase tracking-[0.22em]"
          >
            {collapsed ? 'Show' : 'Hide'}
          </button>
        </div>

        <AnimatePresence initial={false}>
          {!collapsed ? (
            <motion.ul
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 space-y-2 overflow-hidden"
            >
              {liveFeed.map((entry, index) => (
                <motion.li
                  key={entry.id}
                  initial={{ opacity: 0, y: -12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                >
                  <button
                    type="button"
                    onClick={() => selectBody(entry.id)}
                    className="w-full rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 text-left text-sm text-star/80 transition hover:border-glow/40 hover:bg-black/35"
                  >
                    ? {entry.label} ? {entry.preview}
                  </button>
                </motion.li>
              ))}
              {liveFeed.length === 0 ? (
                <li className="rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-star/55">
                  The feed wakes up as soon as the first message arrives.
                </li>
              ) : null}
            </motion.ul>
          ) : null}
        </AnimatePresence>
      </div>
    </aside>
  );
}
