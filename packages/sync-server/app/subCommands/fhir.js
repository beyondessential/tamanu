import { Command } from 'commander';
import { QueryTypes } from 'sequelize';
import * as yup from 'yup';

import { FHIR_INTERACTIONS } from 'shared/constants';
import { log } from 'shared/services/logging';
import { resourcesThatCanDo } from 'shared/utils/fhir/resources';

import { ApplicationContext } from '../ApplicationContext';

const materialisableResources = resourcesThatCanDo(FHIR_INTERACTIONS.INTERNAL.MATERIALISE);

async function showStatus() {
  const app = await new ApplicationContext().init();

  for (const Resource of materialisableResources) {
    const count = await Resource.count();
    const latest =
      (
        await Resource.findOne({
          order: [['lastUpdated', 'DESC']],
        })
      )?.lastUpdated?.toISOString() || 'never';

    const upstreamCount = await Resource.UpstreamModel?.count();
    const upstreamLatest =
      (
        await Resource.UpstreamModel?.findOne({
          order: [['updatedAt', 'DESC']],
        })
      )?.updatedAt?.toISOString() || 'never';

    log.info(
      `${Resource.name}: ${count}/${upstreamCount} records/upstream, last updated ${latest}/${upstreamLatest}`,
    );
  }

  await app.close();
}

async function doRefresh(resource, { existing, missing, since }) {
  const app = await new ApplicationContext().init();

  if (resource.toLowerCase() === 'all') {
    for (const Resource of materialisableResources) {
      if (!Resource?.UpstreamModel) continue;
      await doRefresh(Resource.fhirName, { existing, missing, since });
    }
    return;
  }

  const Resource = materialisableResources.find(
    r => r.fhirName.toLowerCase() === resource.toLowerCase(),
  );
  if (!Resource) throw new Error(`No such FHIR Resource: ${resource}`);

  const recordsToDo = (
    await Resource.sequelize.query(
      `
      SELECT upstream.id AS id
      FROM ${Resource.UpstreamModel.tableName} upstream
      LEFT JOIN fhir.${Resource.tableName} downstream ON downstream.upstream_id = upstream.id
      WHERE true
        AND upstream.deleted_at IS NULL
        ${missing ? 'AND downstream.id IS NULL' : ''}
        ${existing ? 'AND downstream.id IS NOT NULL' : ''}
        ${since ? `AND upstream.updated_at > $1` : ''}
    `,
      { type: QueryTypes.SELECT, bind: since ? [since] : [] },
    )
  ).map(({ id }) => id);

  let done = 0;
  log.info(`Going to refresh ${recordsToDo.length} records...`);
  for (const upstreamId of recordsToDo) {
    await Resource.materialiseFromUpstream(upstreamId);
    done += 1;
    if (done % 100 === 0) log.info(`Refreshed ${done} out of ${recordsToDo.length}`);
  }

  log.info('Resolving upstream references...');
  await Resource.resolveUpstreams();

  log.info(`Done refreshing ${done} ${Resource.fhirName} records`);
  await app.close();
}

export const fhir = async ({ status, refresh, existing, missing, since }) => {
  if (status || !refresh) return showStatus();

  return doRefresh(
    refresh,
    yup
      .object({
        existing: yup.boolean().default(false),
        missing: yup.boolean().default(false),
        since: yup
          .date()
          .nullable()
          .default(null),
      })
      .validateSync({ existing, missing, since }),
  );
};

export const fhirCommand = new Command('fhir')
  .description('FHIR integration utilities')
  .option('--status', 'show status (default)')
  .option('--refresh <Resource>', 'refresh a FHIR Resource (use `all` to do refresh all resources)')
  .option('--existing', 'only refresh already-materialised resources, not missing ones')
  .option('--missing', 'only materialise missing resources, leave existing ones alone')
  .option('--since <date>', 'filter to source tables that have been updated since that date only')
  .action(fhir);
