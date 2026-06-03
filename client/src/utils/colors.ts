/**
 * Returns a dynamic color transitioning from red (low progress) to green (complete progress)
 * using HSL interpolation.
 * @param progress Percentage value from 0 to 100
 */
export const getDynamicProgressColor = (progress: number): string => {
  const clamped = Math.max(0, Math.min(100, progress));
  // 0% is Red (0 deg), 100% is Green (120 deg)
  const hue = (clamped / 100) * 120;
  return `hsl(${hue}, 82%, 45%)`;
};
