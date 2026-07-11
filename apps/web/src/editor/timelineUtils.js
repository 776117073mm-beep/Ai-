export function toFrameCount(seconds, fps) {
    const safeFps = fps && fps > 0 ? fps : 30;
    const safeSeconds = seconds && seconds > 0 ? seconds : 1;
    return Math.max(1, Math.round(safeSeconds * safeFps));
}
export function formatTimecode(seconds) {
    const safeSeconds = Math.max(0, seconds || 0);
    const mins = Math.floor(safeSeconds / 60);
    const secs = Math.floor(safeSeconds % 60);
    const centiseconds = Math.floor((safeSeconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${centiseconds.toString().padStart(2, '0')}`;
}
export function getClipWidthPx(durationFrames, zoom) {
    return Math.max(96, durationFrames * 8 * zoom);
}
export function getFrameFromPosition(px, zoom) {
    return Math.max(0, Math.round(px / Math.max(1, 8 * zoom)));
}
