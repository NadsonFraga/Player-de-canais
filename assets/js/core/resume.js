/**
 * TVZINHA ONLINE - Where an episode starts when it is opened again.
 *
 * `saved`: { position, duration, finished, server } stored while it played (native players only).
 * Reopening resumes from the saved time when it is past the first RESUME_MIN_S, before RESUME_MAX_SHARE of the
 * episode and the episode was not finished (stopped inside the ending counts as finished). Reloading or switching
 * server keeps the time even under RESUME_MIN_S; switching between the two native players (main / anime) goes back
 * SWITCH_REWIND_S, since the dubbed and subtitled cuts can be a few seconds apart.
 */

export const RESUME_MIN_S = 30;
export const RESUME_MAX_SHARE = 0.95;
export const SWITCH_REWIND_S = 10;

/** Start time in seconds (0 = from the beginning). */
export function resumeStartTime(saved, { keep = false, server = '' } = {}) {
    if (!saved || saved.finished) return 0;
    const position = Number(saved.position);
    const duration = Number(saved.duration);
    if (!(position > 0)) return 0;
    if (keep) {
        const otherPlayer = Boolean(server && saved.server && server !== saved.server);
        return Math.max(0, position - (otherPlayer ? SWITCH_REWIND_S : 0));
    }
    if (position < RESUME_MIN_S) return 0;
    if (duration > 0 && position >= duration * RESUME_MAX_SHARE) return 0;
    return position;
}

/** "12:34" or "1:02:03". */
export function formatClock(seconds) {
    const total = Math.max(0, Math.floor(Number(seconds) || 0));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = String(total % 60).padStart(2, '0');
    return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
}
