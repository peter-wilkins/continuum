export const gitHash = import.meta.env.VITE_COMMIT_HASH ?? 'unknown';

export function BuildHash() {
  return <p className="build-hash">Git {gitHash}</p>;
}
