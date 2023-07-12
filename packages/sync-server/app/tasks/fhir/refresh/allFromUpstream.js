import { Sequelize, Utils, QueryTypes } from 'sequelize';
import { FHIR_INTERACTIONS, JOB_TOPICS } from 'shared/constants';
import { resourcesThatCanDo } from 'shared/utils/fhir/resources';

export async function allFromUpstream({ payload }, { log, sequelize, models }) {
  const { table, op, id, deletedRow = null } = payload;
  const [schema, tableName] = table.toLowerCase().split('.', 2);

  const materialisableResources = resourcesThatCanDo(
    models,
    FHIR_INTERACTIONS.INTERNAL.MATERIALISE,
  );
  const resources = materialisableResources.filter(resource =>
    resource.upstreams.some(upstream => {
      const upstreamTable = upstream.getTableName();
      if (typeof upstreamTable === 'string') {
        return schema === 'public' && upstreamTable.toLowerCase() === tableName;
      }

      return (
        upstreamTable.schema?.toLowerCase() === schema &&
        upstreamTable.tableName?.toLowerCase() === tableName
      );
    }),
  );
  if (resources.length === 0) {
    log.warn('No materialisable FHIR resource found for table', {
      table,
    });
    return;
  }

  for (const Resource of resources) {
    log.debug('finding upstream for row', {
      resource: Resource.fhirName,
      table,
      id,
      op,
    });

    for (const UpstreamModel of Resource.UpstreamModels) {
      const query = await Resource.queryToFindUpstreamIdsFromTable(
        UpstreamModel.tableName,
        tableName,
        id,
        deletedRow,
      );
      if (!query) {
        log.debug('no upstream found for row', {
          resource: Resource.fhirName,
          table,
          id,
          op,
        });
        continue;
      }

      const sql = await prepareQuery(UpstreamModel, query);
      const insertSql = `
        WITH upstreams AS (${sql.replace(/;$/, '')})
        INSERT INTO fhir.jobs (topic, discriminant, payload)
        SELECT
          $topic::text,
          concat($resource::text, ':', upstreams.id),
          json_build_object(
            'resource', $resource::text,
            'upstreamId', upstreams.id,
            'table', $table::text,
            'op', $op::text
          )
        FROM upstreams
        ON CONFLICT (discriminant) DO NOTHING
      `;

      const results = await sequelize.query(insertSql, {
        type: Sequelize.QueryTypes.INSERT,
        bind: {
          topic: JOB_TOPICS.FHIR.REFRESH.FROM_UPSTREAM,
          resource: Resource.fhirName,
          table,
          op,
        },
      });
      if (!results) {
        throw new Error(`Failed to insert jobs: ${JSON.stringify(results)}`);
      }

      log.debug('FhirWorker: submitted refresh jobs', {
        resource: Resource.fhirName,
        count: results[1],
      });
    }
  }
}

/* eslint-disable no-param-reassign */
// This is mostly copied from Model.findAll internals in sequelize
// and as such is highly coupled to the internals of sequelize 6.
// However, there's no other reliable way to get the SQL :(
async function prepareQuery(Model, options) {
  Model.warnOnInvalidOptions(options, Object.keys(Model.rawAttributes));
  const tableNames = {};
  tableNames[Model.getTableName(options)] = true;
  options.hooks = false;
  options.rejectOnEmpty = Object.prototype.hasOwnProperty.call(options, 'rejectOnEmpty')
    ? options.rejectOnEmpty
    : Model.options.rejectOnEmpty;
  Model._injectScope(options);
  if (options.hooks) {
    await Model.runHooks('beforeFind', options);
  }
  Model._conformIncludes(options, Model);
  Model._expandAttributes(options);
  Model._expandIncludeAll(options);
  if (options.hooks) {
    await Model.runHooks('beforeFindAfterExpandIncludeAll', options);
  }
  options.originalAttributes = Model._injectDependentVirtualAttributes(options.attributes);
  if (options.include) {
    options.hasJoin = true;
    Model._validateIncludedElements(options, tableNames);
    if (
      options.attributes &&
      !options.raw &&
      Model.primaryKeyAttribute &&
      !options.attributes.includes(Model.primaryKeyAttribute) &&
      (!options.group || !options.hasSingleAssociation || options.hasMultiAssociation)
    ) {
      options.attributes = [Model.primaryKeyAttribute].concat(options.attributes);
    }
  }
  if (!options.attributes) {
    options.attributes = Object.keys(Model.rawAttributes);
    options.originalAttributes = Model._injectDependentVirtualAttributes(options.attributes);
  }
  Model.options.whereCollection = options.where || null;
  Utils.mapFinderOptions(options, Model);
  options = Model._paranoidClause(Model, options);
  if (options.hooks) {
    await Model.runHooks('beforeFindAfterOptions', options);
  }

  const selectOptions = {
    ...options,
    tableNames: Object.keys(tableNames),
    type: QueryTypes.SELECT,
    model: Model,
  };

  return Model.queryGenerator.selectQuery(Model.getTableName(selectOptions), selectOptions, Model);
}
