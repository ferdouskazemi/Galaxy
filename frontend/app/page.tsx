'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import GalaxyCanvas from '@/components/galaxy/GalaxyCanvas';
import LiveFeed from '@/components/ui/LiveFeed';
import LoadingScreen from '@/components/ui/LoadingScreen';
import MessageReader from '@/components/ui/MessageReader';
import PostPanel from '@/components/ui/PostPanel';
import StatsBar from '@/components/ui/StatsBar';
import { useGalaxyStore } from '@/hooks/useGalaxy';
import { useSocket } from '@/hooks/useSocket';

export default function HomePage(): JSX.Element {
  const initialize = useGalaxyStore((state) => state.initialize);
  const loading = useGalaxyStore((state) => state.loading);
  const error = useGalaxyStore((state) => state.error);
  const connectionState = useGalaxyStore((state) => state.connectionState);
  const soundEnabled = useGalaxyStore((state) => state.soundEnabled);
  const toggleSound = useGalaxyStore((state) => state.toggleSound);
  const audioCue = useGalaxyStore((state) => state.audioCue);
  const globalFlash = useGalaxyStore((state) => state.globalFlash);
  const [flash, setFlash] = useState<{ key: number; intensity: number } | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useSocket();

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    if (!globalFlash) {
      return;
    }

    setFlash(globalFlash);
    const timer = window.setTimeout(() => setFlash(null), 260);
    return () => window.clearTimeout(timer);
  }, [globalFlash]);

  useEffect(() => {
    if (!soundEnabled || !audioCue) {
      return;
    }

    const AudioContextCtor =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextCtor) {
      return;
    }

    const context = audioContextRef.current ?? new AudioContextCtor();
    audioContextRef.current = context;
    if (context.state === 'suspended') {
      void context.resume();
    }

    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = audioCue.frequency;
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.035, context.currentTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.85);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.9);

    return () => {
      oscillator.disconnect();
      gain.disconnect();
    };
  }, [audioCue, soundEnabled]);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-void">
      <GalaxyCanvas />
      <LiveFeed />
      <StatsBar />
      <MessageReader />
      <PostPanel />

      <button
        type="button"
        onClick={toggleSound}
        className="glass-panel pointer-events-auto absolute bottom-6 right-6 z-20 rounded-full px-4 py-3 font-mono text-xs uppercase tracking-[0.28em] text-star/80"
      >
        {soundEnabled ? 'Sound On' : 'Sound Off'}
      </button>

      <AnimatePresence>
        {connectionState !== 'connected' ? (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="glass-panel pointer-events-none absolute left-1/2 top-4 z-30 -translate-x-1/2 rounded-full px-4 py-2 text-sm text-star/75"
          >
            Reconnecting...
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {error ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="glass-panel pointer-events-none absolute bottom-24 left-1/2 z-30 -translate-x-1/2 rounded-full px-4 py-2 text-sm text-nova"
          >
            {error}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {flash ? (
          <motion.div
            key={flash.key}
            initial={{ opacity: flash.intensity }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="pointer-events-none absolute inset-0 z-30 bg-white"
            style={{ opacity: flash.intensity }}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>{loading ? <LoadingScreen /> : null}</AnimatePresence>
    </main>
  );
}
