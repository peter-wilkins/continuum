import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function readCommitHash() {
  const gitDir = resolve(__dirname, '../.git');
  const head = readFileSync(resolve(gitDir, 'HEAD'), 'utf8').trim();

  if (!head.startsWith('ref: ')) {
    return head.slice(0, 7);
  }

  const refPath = resolve(gitDir, head.slice('ref: '.length));
  if (existsSync(refPath)) {
    return readFileSync(refPath, 'utf8').trim().slice(0, 7);
  }

  const packedRefsPath = resolve(gitDir, 'packed-refs');
  if (!existsSync(packedRefsPath)) return 'unknown';

  const refName = head.slice('ref: '.length);
  const packedRef = readFileSync(packedRefsPath, 'utf8')
    .split('\n')
    .find((line) => line.endsWith(` ${refName}`));

  return packedRef ? packedRef.slice(0, 7) : 'unknown';
}

const commitHash = readCommitHash();

export default defineConfig({
  plugins: [react()],
  define: {
    __COMMIT_HASH__: JSON.stringify(commitHash),
  },
});
