export const getPreviousIndex = (length: number, current: number): number =>
  (current - 1 + length) % length;

export const getNextIndex = (length: number, current: number): number =>
  (current + 1) % length;

export const getTranslateX = (length: number, direction: number): number =>
  (100 * direction) / (length + 2);

export const getContainerWidth = (
  childWidth: number,
  length: number
): number => {
  const multiplier = childWidth || 100;
  return multiplier * (length + 2);
};

export const getLeftOffset = (
  childWidth: number,
  current: number,
  alignCenter: boolean
): number => {
  const multiplier = childWidth || 100;
  const alignmentMultiplier = (100 - childWidth) / 2;

  return alignCenter
    ? (current + 1) * multiplier - alignmentMultiplier
    : (current + 1) * multiplier;
};

export const getTranslateXDistance = (
  length: number,
  current: number,
  target: number,
  offset: number
): number => {
  const distance = Math.abs(current - target);
  const preferred = Math.sign(offset || 0);
  const direction =
    (distance > length / 2 ? 1 : -1) * Math.sign(target - current);
  const shift = (100 * (preferred || direction)) / (length + 2);

  return shift;
};
