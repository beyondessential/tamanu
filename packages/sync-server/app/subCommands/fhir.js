import { Command } from 'commander';
import { QueryTypes } from 'sequelize';
import * as yup from 'yup';

import { FHIR_INTERACTIONS } from '@tamanu/constants';
import { log } from 'shared/services/logging';
import { resourcesThatCanDo } from 'shared/utils/fhir/resources';

import { ApplicationContext } from '../ApplicationContext';
import { prepareQuery } from '../utils/prepareQuery';

async function showStatus() {
  const app = await new ApplicationContext().init();
  const materialisableResources = resourcesThatCanDo(
    app.store.models,
    FHIR_INTERACTIONS.INTERNAL.MATERIALISE,
  );

  for (const Resource of materialisableResources) {
    const count = await Resource.count();
    const latest =
      (
        await Resource.findOne({
          order: [['lastUpdated', 'DESC']],
        })
      )?.lastUpdated?.toISOString() || 'never';

    let upstreamCount = 0;
    let upstreamLatest = '';
    for (const UpstreamModel of Resource.UpstreamModels) {
      upstreamCount += await UpstreamModel.count();
      const currentUpstreamLatest = (
        await UpstreamModel.findOne({
          order: [['updatedAt', 'DESC']],
        })
      )?.updatedAt?.toISOString();

      if (currentUpstreamLatest > upstreamLatest) upstreamLatest = currentUpstreamLatest;
    }

    log.info(
      // eslint-disable-next-line prettier/prettier
      `${Resource.name}: ${count}/${upstreamCount} records/upstream, last updated ${latest}/${upstreamLatest || 'never'}`,
    );
  }

  await app.close();
}

async function doRefresh(resource, { existing, missing, since }) {
  const app = await new ApplicationContext().init();
  const materialisableResources = resourcesThatCanDo(
    app.store.models,
    FHIR_INTERACTIONS.INTERNAL.MATERIALISE,
  );

  if (resource.toLowerCase() === 'all') {
    for (const Resource of materialisableResources) {
      if (!Resource?.UpstreamModels || Resource.UpstreamModels.length === 0) continue;
      await doRefresh(Resource.fhirName, { existing, missing, since });
    }
    return;
  }

  const Resource = materialisableResources.find(
    r => r.fhirName.toLowerCase() === resource.toLowerCase(),
  );
  if (!Resource) throw new Error(`No such FHIR Resource: ${resource}`);

  const sql = (
    await Promise.all(
      Resource.UpstreamModels.map(async upstreamModel => {
        const sqlToSelect = await prepareQuery(upstreamModel, {
          attributes: ['id', 'deleted_at', 'updated_at'],
        });

        return sqlToSelect.replace(/;$/, '');
      }),
    )
  ).join(' UNION ');

  const recordsToDo = (
    await Resource.sequelize.query(
      `
      WITH upstream AS (${sql})
      SELECT upstream.id AS id
      FROM upstream
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
