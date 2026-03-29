'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import {
  formatRelativeTime,
  getVisualProfile,
  languageToFlag,
} from '@/lib/astronomy';
import { useGalaxyStore } from '@/hooks/useGalaxy';

function toFlagEmoji(countryCode: string): string {
  if (countryCode === 'UN') {
    return '??';
  }

  return countryCode
    .toUpperCase()
    .replace(/./g, (character) =>
      String.fromCodePoint(127397 + character.charCodeAt(0)),
    );
}

export default function MessageReader(): JSX.Element {
  const bodies = useGalaxyStore((state) => state.bodies);
  const selectedBodyId = useGalaxyStore((state) => state.selectedBodyId);
  const likedBodyIds = useGalaxyStore((state) => state.likedBodyIds);
  const pendingLikeIds = useGalaxyStore((state) => state.pendingLikeIds);
  const likeBody = useGalaxyStore((state) => state.likeBody);
  const closeReader = useGalaxyStore((state) => state.closeReader);
  const [feedback, setFeedback] = useState<string | null>(null);

  const body = useMemo(
    () => bodies.find((item) => item.id === selectedBodyId) ?? null,
    [bodies, selectedBodyId],
  );

  async function handleLike(): Promise<void> {
    if (!body) {
      return;
    }

    const result = await likeBody(body.id);
    setFeedback(result.ok ? 'The galaxy felt that.' : result.message ?? 'Unable to like body');
  }

  return (
    <AnimatePresence>
      {body ? (
        <motion.aside
          initial={{ opacity: 0, x: 48 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 32 }}
          transition={{ duration: 0.26, ease: 'easeOut' }}
          className="glass-panel gradient-border pointer-events-auto absolute right-4 top-4 z-20 flex h-[calc(100vh-2rem)] w-[min(420px,calc(100vw-2rem))] flex-col rounded-[32px] px-5 py-5 md:px-6"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-display text-xl tracking-[0.14em] text-star">
                {getVisualProfile(body).icon} {getVisualProfile(body).label}
              </p>
              <p className="mt-2 font-mono text-xs uppercase tracking-[0.24em] text-star/45">
                Posted {formatRelativeTime(body.createdAt)}
              </p>
            </div>
            <button
              type="button"
              onClick={closeReader}
              className="panel-button rounded-full px-3 py-2 text-xs uppercase tracking-[0.22em]"
            >
              Close
            </button>
          </div>

          <div className="mt-5 rounded-[28px] border border-white/10 bg-black/25 p-5">
            <p className="max-h-[48vh] overflow-y-auto text-[15px] leading-7 text-star/90">
              {body.message}
            </p>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 text-sm text-star/65">
            <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-star/45">Likes</p>
              <motion.p
                key={body.likes}
                initial={{ opacity: 0.55, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 font-display text-3xl text-star"
              >
                {body.likes}
              </motion.p>
            </div>
            <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-star/45">Language</p>
              <p className="mt-2 text-2xl text-star">
                {toFlagEmoji(languageToFlag(body.language))}
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 rounded-[24px] border border-white/10 bg-black/20 px-4 py-3">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-star/45">Resonance</p>
              <p className="mt-1 text-sm text-star/70">
                Like once from this device to brighten this body.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                void handleLike();
              }}
              disabled={Boolean(likedBodyIds[body.id]) || Boolean(pendingLikeIds[body.id])}
              className="panel-button rounded-full px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pendingLikeIds[body.id] ? 'Liking...' : likedBodyIds[body.id] ? '? Liked' : '? Like'}
            </button>
          </div>

          <div className="mt-auto rounded-[22px] border border-glow/15 bg-gradient-to-r from-glow/12 via-transparent to-aurora/10 px-4 py-3 text-sm text-star/70">
            {feedback ?? 'Zoom in, read, then drift back to the wider galaxy.'}
          </div>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}
