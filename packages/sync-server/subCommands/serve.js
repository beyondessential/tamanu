import config from 'config';

import { log } from 'shared/services/logging';
import { createReferralNotification } from 'shared/tasks/CreateReferralNotification';
import { sendCertificateNotifications } from 'shared/tasks/SendCertificateNotifications';
import { createLabRequestNotifications } from 'shared/tasks/CreateLabRequestNotifications';

import { createApp } from '../app/createApp';
import { startScheduledTasks } from '../app/tasks';
import { ApplicationContext } from '../app/ApplicationContext';
import { version } from '../package.json';

const { port } = config;

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

export async function serve(options) {
  const context = await new ApplicationContext().init();
  const { store } = context;
  log.info(`Starting sync server version ${version}.`);

  if (config.db.migrateOnStartup) {
    await store.sequelize.migrate({ migrateDirection: 'up' });
  } else {
    await store.sequelize.assertUpToDate(options);
  }

  const app = createApp(context);

  if (process.env.PRINT_ROUTES === 'true') {
    // console instead of log.info is fine here because the aim is to output the
    // routes without wrapping, supressing, or transporting the output
    console.log(getRoutes(app._router).join('\n'));
  }

  const server = app.listen(port, () => {
    log.info(`Server is running on port ${port}!`);
  });
  process.on('SIGTERM', () => {
    log.info('Received SIGTERM, closing HTTP server');
    server.close();
  });

  // only execute tasks on the first worker process
  // NODE_APP_INSTANCE is set by PM2; if it's not present, assume this process is the first
  const isFirstProcess = !process.env.NODE_APP_INSTANCE || process.env.NODE_APP_INSTANCE === '0';
  if (isFirstProcess) {
    const stopScheduledTasks = await startScheduledTasks(context);
    process.on('SIGTERM', () => {
      log.info('Received SIGTERM, stopping scheduled tasks');
      stopScheduledTasks();
    });
  }

  if (config.notifications) {
    if (config.notifications.referralCreated) {
      context.store.models.Referral.addHook(
        'afterCreate',
        'create referral notification hook',
        referral => {
          createReferralNotification(referral, context.store.models);
        },
      );
    }
    if (config.notifications.certificates) {
      // Create certificate notifications for published results
      context.store.models.LabRequest.addHook(
        'afterBulkUpdate',
        'create published test results notification hook',
        labRequest => {
          createLabRequestNotifications(labRequest.attributes, context.store.models);
        },
      );
      // Send out queued certificate notifications
      context.store.models.CertificateNotification.addHook(
        'afterBulkCreate',
        'create certificate notification hook',
        certificateNotifications => {
          sendCertificateNotifications(certificateNotifications, context.store.models);
        },
      );
    }
  }
}
