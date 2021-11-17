import config from 'config';
import express from 'express';
import asyncHandler from 'express-async-handler';

import * as schema from './schema';

export const routes = express.Router();

function patientToHL7Patient(patient, additional) {
  // TODO: import from TAN-941
  return {};
}

function hl7SortToTamanu(hl7Sort) {
  // hl7Sort can be quite complicated, we only support a single field `issued` in `-` order
  if (hl7Sort === '-issued') {
    return [['createdAt', 'DESC']];
  }
  throw new Error(`Unrecognised sort order: ${hl7Sort}`);
}

function getHl7Link(req, params) {
  const base = `${config.integrations.fijiVps.self}${req.baseUrl}${req.path}`;
  const query = Object.entries(params)
    .map(p => p.map(str => encodeURIComponent(str)).join('='))
    .join('&');
  return [base, query].filter(c => c).join('?');
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

routes.get(
  '/Patient',
  asyncHandler(async (req, res) => {
    const { Patient } = req.store.models;
    const query = await parseQuery(req.query, schema.patient.query);
    const displayId = query['subject:identifier'].match(schema.IDENTIFIER_REGEXP)[1];
    const { _count, _page, _sort } = query;

    // there should only be one record returned, but we treat it as an array to make future expansion easier
    const tamanuPatients = await Patient.findAll({
      where: { displayId },
      limit: _count,
      offset: _count * _page,
      order: hl7SortToTamanu(_sort),
      include: [{ association: 'additionalData' }],
      nest: true,
      raw: true,
    });
    const hl7FhirPatients = tamanuPatients.map(({ additionalData, ...patient }) =>
      patientToHL7Patient(patient, additionalData),
    );

    const link = [
      {
        relation: 'self',
        link: getHl7Link(req, query),
      },
    ];
    const lastRecord = tamanuPatients[tamanuPatients.length - 1];
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

    const lastUpdated = tamanuPatients.reduce(
      (acc, p) => (acc > p.updatedAt.getTime() ? acc : p.updatedAt),
      null,
    );

    res.send({
      resourceType: 'Bundle',
      id: 'patients',
      meta: {
        lastUpdated: lastUpdated ? lastUpdated.toISOString() : null,
      },
      type: 'searchset',
      total: hl7FhirPatients.length,
      link,
      entry: hl7FhirPatients,
    });
  }),
);

routes.get(
  '/DiagnosticReport',
  asyncHandler(async (req, res) => {
    // TODO
  }),
);

routes.get(
  '/Observation',
  asyncHandler(async (req, res) => {
    // TODO
  }),
);
