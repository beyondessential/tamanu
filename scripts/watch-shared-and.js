import concurrently from 'concurrently';

const [workspace, ...args] = process.argv.slice(2);

concurrently(
  [
    // running build-shared in raw:true mode will cause its output to interfere with
    // the way the second process handles stdin (eg it will break jest-watch hotkeys)
    { command: 'npm run build-watch --workspace @tamanu/shared', raw: false },
    { command: `sleep 2 && npm run ${args.join(' ')} --workspace ${workspace}`, raw: true },
  ],
  {
    defaultInputTarget: 1,
  },
);
