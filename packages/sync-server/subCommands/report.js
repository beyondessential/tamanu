import { log } from 'shared/services/logging';
import { EmailService } from '../app/services/EmailService';
import { ReportRunner } from '../app/report/ReportRunner';

export async function report(store, options) {
  try {
    const { name, parameters, recipients } = options;
    let reportParameters = {};
    let reportRecipients = {};
    try {
      reportParameters = JSON.parse(parameters);
    } catch (error) {
      log.warn(`Failed to parse parameters ${error}`);
    }

    try {
      reportRecipients = JSON.parse(recipients);
    } catch (error) {
      // Backwards compatibility: support previous syntax of plain string
      reportRecipients = {
        email: recipients.split(','),
      };
    }

    const emailService = new EmailService();
    const reportRunner = new ReportRunner(
      name,
      reportParameters,
      reportRecipients,
      store.models,
      emailService,
    );
    log.info(`Running report "${name}" with parameters "${parameters}"`);
    await reportRunner.run();
  } catch (error) {
    // Send error message back to parent process
    process.stderr.write(`Report failed: ${error.message}`);
    process.exit(1);
  }
  process.exit(0);
}

function getRoutes(router, prefix = '') {
  const getRouteName = ({ regexp }) =>
    regexp
      .toString()
      .replace(/\\\//g, '/')
      .replace(/^\/\^(.*)\/i$/, '$1')
      .replace('/?(?=/|$)', '');
  let routes = [];
  router.stack.forEach(middleware => {
    if (middleware.route) {
      routes.push(`${prefix}${middleware.route.path.replace(/(\$|\/)$/, '')}`);
    } else if (middleware.name === 'router') {
      routes = [...routes, ...getRoutes(middleware.handle, `${prefix}${getRouteName(middleware)}`)];
    }
  });
  return routes;
}
