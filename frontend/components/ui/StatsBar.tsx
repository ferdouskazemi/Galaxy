'use client';

import { motion } from 'framer-motion';
import { trimMessagePreview } from '@/lib/astronomy';
import { useGalaxyStore } from '@/hooks/useGalaxy';
import { JSX } from 'react';

export default function StatsBar(): JSX.Element {
  const stats = useGalaxyStore((state) => state.stats);
  const viewerCount = useGalaxyStore((state) => state.viewerCount);

  return (
    <aside className="glass-panel gradient-border pointer-events-auto absolute right-4 top-4 z-20 w-[min(360px,calc(100vw-2rem))] rounded-[28px] px-5 py-4 md:px-6">
      <div className="flex items-center justify-between">
        <p className="font-display text-lg tracking-[0.16em] text-star">Galaxy Stats</p>
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-star/45">Live</p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-[20px] border border-white/10 bg-black/25 p-4">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-star/45">Total Messages</p>
          <motion.p key={stats?.total_bodies ?? 0} initial={{ opacity: 0.6, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-2 font-display text-3xl text-star">
            {stats?.total_bodies ?? 0}
          </motion.p>
        </div>
        <div className="rounded-[20px] border border-white/10 bg-black/25 p-4">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-star/45">Active Viewers</p>
          <motion.p key={viewerCount} initial={{ opacity: 0.6, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-2 font-display text-3xl text-star">
            {viewerCount}
          </motion.p>
        </div>
      </div>

      <div className="mt-3 rounded-[22px] border border-white/10 bg-black/20 p-4">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-star/45">Most Liked Signal</p>
        <p className="mt-2 text-sm leading-6 text-star/85">
          {stats?.top_body ? trimMessagePreview(stats.top_body.message, 72) : 'No message has ignited the galaxy yet.'}
        </p>
      </div>

      <div className="mt-3 flex items-center justify-between rounded-[22px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-star/65">
        <span>Galaxy Age</span>
        <span className="font-mono text-xs uppercase tracking-[0.24em] text-star/85">
          {stats?.galaxy_age_days ?? 0} day{(stats?.galaxy_age_days ?? 0) === 1 ? '' : 's'} old
        </span>
      </div>
    </aside>
  );
}
