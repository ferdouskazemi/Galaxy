'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { FormEvent, JSX, useEffect, useMemo, useState } from 'react';
import { getPreviewBody } from '@/lib/astronomy';
import { useGalaxyStore } from '@/hooks/useGalaxy';

export default function PostPanel(): JSX.Element {
  const postMessage = useGalaxyStore((state) => state.postMessage);
  const postCooldownUntil = useGalaxyStore((state) => state.postCooldownUntil);
  const [open, setOpen] = useState(true);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  useEffect(() => {
    if (!postCooldownUntil) {
      setRemainingSeconds(0);
      return;
    }

    const update = () => {
      const remaining = Math.max(0, Math.ceil((postCooldownUntil - Date.now()) / 1000));
      setRemainingSeconds(remaining);
    };

    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [postCooldownUntil]);

  const preview = useMemo(() => getPreviewBody(message || 'starlight seed'), [message]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (message.trim().length < 3 || submitting) {
      return;
    }

    setSubmitting(true);
    setFeedback(null);
    const result = await postMessage(message.trim());
    setSubmitting(false);

    if (!result.ok) {
      setFeedback(result.message ?? 'Unable to launch message');
      return;
    }

    setMessage('');
    setFeedback('Message launched into the galaxy.');
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-5 z-20 flex flex-col items-center gap-3 px-4">
      <AnimatePresence>
        {open ? (
          <motion.form
            key="panel"
            initial={{ opacity: 0, y: 32, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.96 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            onSubmit={handleSubmit}
            className="glass-panel gradient-border pointer-events-auto w-full max-w-2xl rounded-[28px] px-5 py-4 md:px-6"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-display text-lg tracking-[0.18em] text-star">Launch A Thought</p>
                <p className="mt-1 text-sm text-star/60">
                  Anonymous words become living celestial bodies for everyone online.
                </p>
              </div>
              <div
                className="rounded-full border px-3 py-1 font-mono text-xs uppercase tracking-[0.24em]"
                style={{ borderColor: `${preview.color}66`, color: preview.color }}
              >
                {preview.label}
              </div>
            </div>

            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value.slice(0, 500))}
              maxLength={500}
              placeholder="Confess a hope, a memory, a grief, a joke. The universe will hold it."
              className="mt-4 h-32 w-full resize-none rounded-[24px] border border-white/10 bg-black/30 px-4 py-3 text-sm text-star outline-none transition focus:border-glow/50"
            />

            <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1 text-sm text-star/65">
                <p>
                  Preview: <span style={{ color: preview.color }}>{preview.label}</span>
                </p>
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-star/45">
                  {message.length}/500 chars
                </p>
                {remainingSeconds > 0 ? (
                  <p className="text-xs text-nova">
                    You can post again in {remainingSeconds} seconds
                  </p>
                ) : null}
                {feedback ? <p className="text-xs text-star/75">{feedback}</p> : null}
              </div>

              <button
                type="submit"
                disabled={submitting || message.trim().length < 3 || remainingSeconds > 0}
                className="panel-button rounded-full px-5 py-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? 'Launching...' : 'Launch into the Universe ??'}
              </button>
            </div>
          </motion.form>
        ) : null}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="glass-panel pointer-events-auto rounded-full px-5 py-2 font-mono text-xs uppercase tracking-[0.28em] text-star/80"
      >
        {open ? 'Hide Composer' : 'Open Composer'}
      </button>
    </div>
  );
}

