import concurrently from 'concurrently';

const [workspace, command] = process.argv.slice(2);

concurrently(
  [
    // running build-shared in raw:true mode will cause its output to interfere with
    // the way the second process handles stdin (eg it will break jest-watch hotkeys)
    { command: 'yarn workspace @tamanu/shared run build-watch', raw: false },
    { command: `yarn workspace ${workspace} run ${command}`, raw: true },
  ], 
  {
    defaultInputTarget: 1,
  },
);
