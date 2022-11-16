import { Command } from 'commander';
import { QueryTypes } from 'sequelize';
import * as yup from 'yup';

import { FHIR_RESOURCE_TYPES } from 'shared/constants';
import { log } from 'shared/services/logging';

import { ApplicationContext } from '../ApplicationContext';

async function showStatus(models) {
  for (const resource of FHIR_RESOURCE_TYPES) {
    const Resource = models[`Fhir${resource}`];
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
}

async function doRefresh(resource, { existing, missing, models, since }) {
  if (resource.toLowerCase() === 'all') {
    for (const res of FHIR_RESOURCE_TYPES) {
      const Resource = models[`Fhir${res}`];
      if (!Resource?.UpstreamModel) continue;
      await doRefresh(res, { missing, models, since });
    }
    return;
  }

  const normalised = FHIR_RESOURCE_TYPES.find(r => r.toLowerCase() === resource.toLowerCase());
  if (!normalised) throw new Error(`No such FHIR Resource: ${resource}`);

  const Resource = models[`Fhir${normalised}`];
  if (!Resource) throw new Error(`No matching FHIR Resource model: ${resource}`);
  if (!Resource.UpstreamModel) throw new Error('FHIR model is not configured for materialisation');

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

  log.info(`Done refreshing ${done} ${normalised} records`);
}

export const fhir = async ({ status, refresh, existing, missing, since }) => {
  const {
    store: { models },
  } = await new ApplicationContext().init();

  if (status || !refresh) return showStatus(models);

  return doRefresh(refresh, {
    models,
    ...yup
      .object({
        existing: yup.boolean().default(false),
        missing: yup.boolean().default(false),
        since: yup
          .date()
          .nullable()
          .default(null),
      })
      .validateSync({ existing, missing, since }),
  });
};

export const fhirCommand = new Command('fhir')
  .description('FHIR integration utilities')
  .option('--status', 'show status (default)')
  .option('--refresh <Resource>', 'refresh a FHIR Resource (use `all` to do refresh all resources)')
  .option('--existing', 'only refresh already-materialised resources, not missing ones')
  .option('--missing', 'only materialise missing resources, leave existing ones alone')
  .option('--since <date>', 'filter to source tables that have been updated since that date only')
  .action(fhir);
