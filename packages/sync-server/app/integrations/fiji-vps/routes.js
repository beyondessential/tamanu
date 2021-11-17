import config from 'config';
import express from 'express';
import asyncHandler from 'express-async-handler';

import { patientToHL7Patient, labTestToHL7DiagnosticReport } from '../../hl7fhir';
import * as schema from './schema';

export const routes = express.Router();

function hl7SortToTamanu(hl7Sort) {
  // hl7Sort can be quite complicated, we only support a single field `issued` in `-` order
  if (hl7Sort === '-issued') {
    return [['createdAt', 'DESC']];
  }
  throw new Error(`Unrecognised sort order: ${hl7Sort}`);
}

function getHl7Link(baseUrl, params) {
  const query = Object.entries(params)
    .map(p => p.map(str => encodeURIComponent(str)).join('='))
    .join('&');
  return [baseUrl, query].filter(c => c).join('?');
}

function getBaseUrl(req) {
  return `${config.integrations.fijiVps.self}${req.baseUrl}${req.path}`;
}

function toSearchId(obj) {
  return btoa(encodeURIComponent(JSON.stringify(obj)));
}

function fromSearchId(searchId) {
  return JSON.parse(decodeURIComponent(atob(searchId)));
}

function parseQuery(unsafeQuery, querySchema) {
  const { searchId, ...rest } = unsafeQuery;
  let values = rest;
  if (searchId) {
    values = fromSearchId(searchId);
  }
  return querySchema.validate(values);
}

async function getRecords({ query, model, where, include }) {
  const { _count, _page, _sort } = query;

  return model.findAll({
    where,
    include,
    limit: _count,
    offset: _count * _page,
    order: hl7SortToTamanu(_sort),
    nest: true,
    raw: true,
  });
}

async function getHL7PayloadFromRecords({ query, records, bundleId, toHL7, baseUrl }) {
  // run in a loop instead of using `.map()` so embedded queries run in serial
  const hl7FhirRecords = [];
  for (const r of records) {
    hl7FhirRecords.push(await toHL7(r));
  }

  const link = [
    {
      relation: 'self',
      link: getHl7Link(baseUrl, query),
    },
  ];
  const lastRecord = records[records.length - 1];
  if (lastRecord) {
    // TODO: implement cursors (not necessary for patients)
    // link.push({
    //   relation: 'next',
    //   link: getHl7Link(req, {
    //     searchId: toSearchId({
    //       _count,
    //       _page,
    //       _sort,
    //       cursor: getCursorFromRecord(lastRecord),
    //     }),
    //   }),
    // });
  }

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
    total: hl7FhirRecords.length,
    link,
    entry: hl7FhirRecords,
  };
}

routes.get(
  '/Patient',
  asyncHandler(async (req, res) => {
    const { Patient } = req.store.models;
    const query = await parseQuery(req.query, schema.patient.query);
    const displayId = query['subject:identifier'].match(schema.IDENTIFIER_REGEXP)[1];

    const records = await getRecords({
      query,
      model: Patient,
      where: { displayId },
      include: [{ association: 'additionalData' }],
    });
    const payload = await getHL7PayloadFromRecords({
      query,
      records,
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
    const query = await schema.diagnosticReport.query.validate(req.query);
    const displayId = query['subject:identifier'].match(schema.IDENTIFIER_REGEXP)[1];
    const records = await getRecords({
      query,
      model: req.store.models.LabTest,
      where: {}, // deliberately empty, join with a patient instead
      include: [
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
    });
    const payload = await getHL7PayloadFromRecords({
      query,
      records,
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
