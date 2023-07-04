import { Command } from 'commander';

import { ApplicationContext } from '../ApplicationContext';
import { createApp } from '../createApp';
import { setupEnv } from '../env';

function getRouteName(regexp) {
  return regexp
    .toString()
    .replace(/\\\//g, '/')
    .replace(/^\/\^(.*)\/i$/, '$1')
    .replace('/?(?=/|$)', '');
}

function getRoutes(router, prefix = '') {
  let routes = [];
  for (const { route, name, handle, regexp } of router.stack) {
    if (route) {
      routes.push(`${prefix}${route.path.replace(/(\$|\/)$/, '')}`);
    } else if (name === 'router') {
      routes = [...routes, ...getRoutes(handle, `${prefix}${getRouteName(regexp)}`)];
    }
  }
  return routes;
}

async function printRoutes() {
  const context = await new ApplicationContext().init();

  setupEnv();

  const app = createApp(context);

  // console instead of log.info is fine here because the aim is to output the
  // routes without wrapping, supressing, or transporting the output
  // eslint-disable-next-line no-console
  console.log(getRoutes(app._router).join('\n'));
  context.close();
  process.exit(0);
}

export const printRoutesCommand = new Command('printRoutes')
  .description('Debug: print the routes the server mounts')
  .action(printRoutes);
