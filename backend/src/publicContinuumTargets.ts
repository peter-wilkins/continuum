import type { PublicContinuumResponse } from '@continuum/shared';
import { createAdaPublicContinuum } from './publicAdaContinuum.js';

export type PublicContinuumTarget = {
  id: string;
  createContinuum(): PublicContinuumResponse;
};

const publicContinuumTargets = [
  {
    id: 'ada-lovelace',
    createContinuum: createAdaPublicContinuum,
  },
] satisfies PublicContinuumTarget[];

export function getPublicContinuumTarget(targetId: string): PublicContinuumTarget | null {
  return publicContinuumTargets.find((target) => target.id === targetId) ?? null;
}
