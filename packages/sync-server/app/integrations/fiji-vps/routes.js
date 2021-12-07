import config from 'config';
import express from 'express';
import asyncHandler from 'express-async-handler';

import {
  patientToHL7Patient,
  labTestToHL7DiagnosticReport,
  hl7StatusToLabRequestStatus,
} from '../../hl7fhir';
import * as schema from './schema';
import {
  toSearchId,
  fromSearchId,
  hl7SortToTamanu,
  addPaginationToWhere,
  decodeIdentifier,
} from './conversion';

// TODO (TAN-943): fix auth to throw an error if X-Tamanu-Client and X-Tamanu-Version aren't set

export const routes = express.Router();

function getHL7Link(baseUrl, params) {
  const query = Object.entries(params)
    .filter(([, v]) => v !== null && v !== undefined)
    .map(p => p.map(str => encodeURIComponent(str)).join('='))
    .join('&');
  return [baseUrl, query].filter(c => c).join('?');
}

function getBaseUrl(req) {
  return `${config.canonicalHostName}${req.baseUrl}${req.path}`;
}

function parseQuery(unsafeQuery, querySchema) {
  const { searchId, ...rest } = unsafeQuery;
  let values = rest;
  if (searchId) {
    values = fromSearchId(searchId);
  }
  return querySchema.validate(values, { stripUnknown: true, abortEarly: false });
}

async function getHL7Payload({ req, querySchema, model, getWhere, getInclude, bundleId, toHL7 }) {
  const query = await parseQuery(req.query, querySchema);
  const [, displayId] = decodeIdentifier(query['subject:identifier']);
  const { _count, _page, _sort, after } = query;
  const offset = _count * _page;
  const baseWhere = getWhere(displayId);
  const afterWhere = addPaginationToWhere(baseWhere, after);
  const include = getInclude(displayId, query);

  const [records, total, remaining] = await Promise.all([
    model.findAll({
      where: afterWhere,
      include,
      limit: _count,
      offset,
      order: hl7SortToTamanu(_sort),
    }),
    model.count({
      where: baseWhere,
      include,
    }),
    model.count({
      where: afterWhere,
      include,
      limit: _count + 1, // we can stop once we've found n+1 remaining records
    }),
  ]);

  // run in a loop instead of using `.map()` so embedded queries run in serial
  const hl7FhirResources = [];
  for (const r of records) {
    hl7FhirResources.push(await toHL7(r, query));
  }

  const baseUrl = getBaseUrl(req);
  const link = [
    {
      relation: 'self',
      url: getHL7Link(baseUrl, req.query), // use original query
    },
  ];
  const lastRecord = records[records.length - 1];
  if (remaining > records.length) {
    link.push({
      relation: 'next',
      url: getHL7Link(baseUrl, {
        searchId: toSearchId({
          ...query, // use parsed query
          after: lastRecord,
        }),
      }),
    });
  }

  const lastUpdated = records.reduce(
    (acc, r) => (acc > r.updatedAt.getTime() ? acc : r.updatedAt),
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
    entry: hl7FhirResources,
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
      toHL7: patient => patientToHL7Patient(patient, patient.additionalData[0]),
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
      getInclude: (displayId, { status }) => [
        { association: 'labTestType' },
        { association: 'labTestMethod' },
        {
          association: 'labRequest',
          required: true,
          where: status ? { status: hl7StatusToLabRequestStatus(status) } : null,
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
      toHL7: (labTest, { _include }) => {
        const shouldEmbedResult = _include === schema.DIAGNOSTIC_REPORT_INCLUDES.RESULT;
        return {
          resource: labTestToHL7DiagnosticReport(labTest, { shouldEmbedResult }),
        };
      },
    });

    res.send(payload);
  }),
);
