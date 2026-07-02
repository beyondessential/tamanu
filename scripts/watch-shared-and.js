import concurrently from 'concurrently';

const [workspace, ...args] = process.argv.slice(2);

// @tamanu/shared, @tamanu/utils and @tamanu/database are consumed from TypeScript source,
// so the target watches them directly — dev servers via `node --watch` (their start-watch
// script) and jest via its own watch mode. This wrapper just runs the target so the root
// `*-start-dev` / `*-test-watch` scripts keep working.
concurrently([{ command: `npm run ${args.join(' ')} --workspace ${workspace}`, raw: true }]);
