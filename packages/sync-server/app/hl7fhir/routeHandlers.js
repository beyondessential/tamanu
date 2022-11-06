import config from 'config';
import asyncHandler from 'express-async-handler';
import { isArray } from 'lodash';

import { patientToHL7Patient, getPatientWhereClause } from './patient';
import {
  hl7StatusToLabRequestStatus,
  labTestToHL7Device,
  labTestToHL7DiagnosticReport,
  labTestToHL7Observation,
} from './labTest';
import * as schema from './schema';
import {
  toSearchId,
  fromSearchId,
  hl7SortToTamanu,
  addPaginationToWhere,
  decodeIdentifier,
} from './utils';

// TODO (TAN-943): fix auth to throw an error if X-Tamanu-Client and X-Tamanu-Version aren't set

function getHL7Link(baseUrl, params) {
  const query = Object.entries(params)
    .filter(([, v]) => v !== null && v !== undefined)
    .map(([k, v]) => {
      const encodedKey = encodeURIComponent(k);
      const toPair = val => `${encodedKey}=${encodeURIComponent(val)}`;
      if (isArray(v)) {
        return v.map(toPair);
      }
      return [toPair(v)];
    })
    .flat()
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
  /*
  Validation notes:

  - stripUnknown needs to be false because otherwise yup will
  remove those fields before validation occurs. We want to throw
  an error message when the query has unsupported parameters.

  - abortEarly needs to be false because we want to return a list of
  all errors found.

  - We can't validate schema strictly because we want defaults for
  required fields and possibly type coercion.
  */
  return querySchema.validate(values, { stripUnknown: false, abortEarly: false });
}

async function getHL7Payload({ req, querySchema, model, getWhere, getInclude, bundleId, toHL7 }) {
  const query = await parseQuery(req.query, querySchema);
  const [, displayId] = decodeIdentifier(query['subject:identifier']);
  const { _count, _page, _sort, after } = query;
  const offset = _count * _page;
  const baseWhere = getWhere(displayId, query);
  const afterWhere = addPaginationToWhere(baseWhere, after);
  const include = getInclude(displayId, query);

  const [records, total, remaining] = await Promise.all([
    model.findAll({
      where: afterWhere,
      include,
      limit: _count,
      offset,
      order: hl7SortToTamanu(_sort, model.name),
      subQuery: false,
    }),
    model.count({
      where: baseWhere,
      include,
    }),
    model.count({
      where: afterWhere,
      include,
      limit: _count + 1, // we can stop once we've found n+1 remaining records
      subQuery: false,
    }),
  ]);

  // run in a loop instead of using `.map()` so embedded queries run in serial
  const hl7FhirResources = [];
  const hl7FhirIncludedResources = [];
  for (const r of records) {
    const { mainResource, includedResources } = await toHL7(r, query);
    hl7FhirResources.push(mainResource);
    if (includedResources) {
      hl7FhirIncludedResources.push(...includedResources);
    }
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
    entry: [...hl7FhirResources, ...hl7FhirIncludedResources],
  };
}

export function patientHandler() {
  return asyncHandler(async (req, res) => {
    const { Patient } = req.store.models;
    const payload = await getHL7Payload({
      req,
      querySchema: schema.patient.query,
      model: Patient,
      getWhere: getPatientWhereClause,
      getInclude: () => [{ association: 'additionalData' }],
      bundleId: 'patients',
      toHL7: patient => ({ mainResource: patientToHL7Patient(patient, patient.additionalData[0]) }),
    });

    res.send(payload);
  });
}

export function diagnosticReportHandler() {
  return asyncHandler(async (req, res) => {
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
        const includedResources = [];
        if (_include && _include.includes(schema.DIAGNOSTIC_REPORT_INCLUDES.RESULT)) {
          includedResources.push(labTestToHL7Observation(labTest));
        }
        if (_include && _include.includes(schema.DIAGNOSTIC_REPORT_INCLUDES.DEVICE)) {
          includedResources.push(labTestToHL7Device(labTest));
        }
        return {
          mainResource: {
            resource: labTestToHL7DiagnosticReport(labTest),
          },
          includedResources: includedResources.map(resource => ({ resource })),
        };
      },
    });

    res.send(payload);
  });
}
