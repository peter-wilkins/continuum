import type { PublicContinuumResponse } from '@continuum/shared';

export function lensSnapIndex(input: {
  scrollLeft: number;
  clientWidth: number;
}): number {
  const pageWidth = Math.max(input.clientWidth, 1);

  return Math.round(input.scrollLeft / pageWidth);
}

export function activeLensOutputId(input: {
  activeSnapIndex: number;
  displayedOutputs: PublicContinuumResponse['outputs'];
}): string | null {
  if (input.activeSnapIndex <= 0) return null;

  return input.displayedOutputs[input.activeSnapIndex - 1]?.id ?? null;
}
