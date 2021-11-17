import config from 'config';
import express from 'express';
import asyncHandler from 'express-async-handler';

import { patientToHL7Patient, labTestToHL7DiagnosticReport } from '../../hl7fhir';
import * as schema from './schema';
import { toSearchId, fromSearchId, hl7SortToTamanu, addPaginationToWhere } from './conversion';

export const routes = express.Router();

function getHl7Link(baseUrl, params) {
  const query = Object.entries(params)
    .filter(([, v]) => v !== null && v !== undefined)
    .map(p => p.map(str => encodeURIComponent(str)).join('='))
    .join('&');
  return [baseUrl, query].filter(c => c).join('?');
}

function getBaseUrl(req) {
  return `${config.integrations.fijiVps.self}${req.baseUrl}${req.path}`;
}

function parseQuery(unsafeQuery, querySchema) {
  const { searchId, ...rest } = unsafeQuery;
  let values = rest;
  if (searchId) {
    values = fromSearchId(searchId);
  }
  return querySchema.validate(values, { stripUnknown: true });
}

async function getHL7Payload({
  req,
  querySchema,
  model,
  getWhere,
  getInclude,
  bundleId,
  toHL7,
  baseUrl,
}) {
  const query = await parseQuery(req.query, querySchema);
  const displayId = query['subject:identifier'].match(schema.IDENTIFIER_REGEXP)[1];
  const { _count, _page, _sort, after } = query;
  const offset = _count * _page;
  const baseWhere = getWhere(displayId);
  const include = getInclude(displayId);

  const [records, total] = await Promise.all([
    model.findAll({
      where: addPaginationToWhere(baseWhere, after),
      include,
      limit: _count,
      offset,
      order: hl7SortToTamanu(_sort),
      nest: true,
      raw: true,
    }),
    model.count({
      where: baseWhere,
      include,
    }),
  ]);

  // run in a loop instead of using `.map()` so embedded queries run in serial
  const hl7FhirRecords = [];
  for (const r of records) {
    hl7FhirRecords.push(await toHL7(r));
  }

  const lastRecord = records[records.length - 1];
  const link = [
    {
      relation: 'self',
      link: getHl7Link(baseUrl, req.query), // use original query
    },
    {
      relation: 'next',
      link: getHl7Link(baseUrl, {
        searchId: toSearchId({
          ...query, // use parsed query
          after: lastRecord,
        }),
      }),
    },
  ];

  const lastUpdated = records.reduce(
    (acc, p) => (acc > p.updatedAt.getTime() ? acc : p.updatedAt),
    null,
  );

  return {
    resourceType: 'Bundle',
    id: bundleId,
    meta: {
      lastUpdated: lastUpdated ? lastUpdated.toISOString() : null,
    },
    type: 'searchset',
    total,
    link,
    entry: hl7FhirRecords,
  };
}

routes.get(
  '/Patient',
  asyncHandler(async (req, res) => {
    const { Patient } = req.store.models;
    const payload = await getHL7Payload({
      req,
      querySchema: schema.patient.query,
      model: Patient,
      getWhere: displayId => ({ displayId }),
      getInclude: () => [{ association: 'additionalData' }],
      bundleId: 'patients',
      toHL7: ({ additionalData, ...patient }) => patientToHL7Patient(patient, additionalData),
      baseUrl: getBaseUrl(req),
    });

    res.send(payload);
  }),
);

routes.get(
  '/DiagnosticReport',
  asyncHandler(async (req, res) => {
    const payload = await getHL7Payload({
      req,
      querySchema: schema.diagnosticReport.query,
      model: req.store.models.LabTest,
      getWhere: () => ({}), // deliberately empty, join with a patient instead
      getInclude: displayId => [
        { association: 'labTestType' },
        { association: 'labTestMethod' },
        {
          association: 'labRequest',
          required: true,
          include: [
            { association: 'laboratory' },
            {
              association: 'encounter',
              required: true,
              include: [
                { association: 'examiner' },
                {
                  association: 'patient',
                  where: { displayId },
                },
              ],
            },
          ],
        },
      ],
      bundleId: 'diagnostic-reports',
      toHL7: labTestToHL7DiagnosticReport,
      baseUrl: getBaseUrl(req),
    });

    res.send(payload);
  }),
);

routes.get(
  '/Observation',
  asyncHandler(async (req, res) => {
    // TODO
  }),
);
