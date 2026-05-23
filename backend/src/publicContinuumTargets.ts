import type { PublicContinuumResponse } from '@continuum/shared';
import { createAdaPublicContinuum } from './publicAdaContinuum.js';
import { createExtendedThoughtPublicContinuum } from './publicExtendedThoughtContinuum.js';

export type PublicContinuumTarget = {
  id: string;
  createContinuum(options?: PublicContinuumTargetOptions): PublicContinuumResponse;
};

export type PublicContinuumTargetOptions = {
  question?: string;
};

const publicContinuumTargets = [
  {
    id: 'extended-thought',
    createContinuum: createExtendedThoughtPublicContinuum,
  },
  {
    id: 'ada-lovelace',
    createContinuum: createAdaPublicContinuum,
  },
] satisfies PublicContinuumTarget[];

export function getPublicContinuumTarget(targetId: string): PublicContinuumTarget | null {
  return publicContinuumTargets.find((target) => target.id === targetId) ?? null;
}
