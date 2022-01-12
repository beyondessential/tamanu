import express from 'express';
import asyncHandler from 'express-async-handler';
import { Op } from 'sequelize';
import { customAlphabet } from 'nanoid';
import { NotFoundError } from 'shared/errors';
import {
  LAB_REQUEST_STATUSES,
  DOCUMENT_SIZE_LIMIT,
  INVOICE_STATUS_TYPES,
  INVOICE_PAYMENT_STATUS_TYPES,
} from 'shared/constants';
import { NOTE_RECORD_TYPES } from 'shared/models/Note';
import { uploadAttachment } from '../../utils/uploadAttachment';

import {
  simpleGet,
  simpleGetHasOne,
  simpleGetList,
  permissionCheckingRouter,
  runPaginatedQuery,
} from './crudHelpers';

export const encounter = express.Router();

encounter.get('/:id', simpleGet('Encounter'));
encounter.post(
  '/$',
  asyncHandler(async (req, res) => {
    req.checkPermission('create', 'Encounter');

    const { models, body: encounterData, getLocalisation } = req;

    const newEncounter = await models.Encounter.create(encounterData);
    const localisation = await getLocalisation();

    if (!localisation?.features?.enableInvoicing) {
      res.send(newEncounter);
      return;
    }

    const { patientId } = encounterData;
    const displayId =
      customAlphabet('0123456789', 8)() + customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ', 2)();
    // Create a corresponding invoice with the encounter when admitting patient
    const invoice = await models.Invoice.create({
      encounterId: newEncounter.id,
      displayId,
      status: INVOICE_STATUS_TYPES.IN_PROGRESS,
      paymentStatus: INVOICE_PAYMENT_STATUS_TYPES.UNPAID,
    });

    // Expect to always have a patient additional data corresponding to a patient
    const { patientBillingTypeId } = await models.PatientAdditionalData.findOne({
      where: { patientId },
    });
    const invoicePriceChangeType = await models.InvoicePriceChangeType.findOne({
      where: { itemId: patientBillingTypeId },
    });

    // automatically apply price change (discount) based on patientBillingType
    if (invoicePriceChangeType) {
      await models.InvoicePriceChangeItem.create({
        description: invoicePriceChangeType.name,
        percentageChange: invoicePriceChangeType.percentageChange,
        invoicePriceChangeTypeId: invoicePriceChangeType.id,
        invoiceId: invoice.id,
      });
    }

    res.send(newEncounter);
  }),
);

encounter.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    const { referralId, id } = params;
    req.checkPermission('read', 'Encounter');
    const object = await models.Encounter.findByPk(id);
    if (!object) throw new NotFoundError();
    req.checkPermission('write', object);

    if (req.body.discharge) {
      req.checkPermission('write', 'Discharge');
      await models.Discharge.create({
        ...req.body.discharge,
        encounterId: id,
      });

      // Update medications that were marked for discharge and ensure
      // only isDischarge, quantity and repeats fields are edited
      const medications = req.body.medications || {};
      Object.entries(medications).forEach(async ([medicationId, medicationValues]) => {
        const { isDischarge, quantity, repeats } = medicationValues;
        if (isDischarge) {
          const medication = await models.EncounterMedication.findByPk(medicationId);

          try {
            await medication.update({ isDischarge, quantity, repeats });
          } catch (e) {
            console.error(
              `Couldn't update medication with id ${medicationId} when discharging. ${e.name} : ${e.message}`,
            );
          }
        }
      });
    }

    if (referralId) {
      const referral = await models.Referral.findByPk(referralId);
      referral.update({ encounterId: id });
    }
    await object.update(req.body);

    res.send(object);
  }),
);

encounter.post(
  '/:id/notes',
  asyncHandler(async (req, res) => {
    const { models, body, params } = req;
    const { id } = params;
    req.checkPermission('write', 'Encounter');
    const owner = await models.Encounter.findByPk(id);
    if (!owner) {
      throw new NotFoundError();
    }
    req.checkPermission('write', owner);
    const createdNote = await models.Note.create({
      recordId: id,
      recordType: 'Encounter',
      ...body,
    });

    res.send(createdNote);
  }),
);

encounter.post(
  '/:id/documentMetadata',
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    // TODO: figure out permissions with Attachment and DocumentMetadata
    req.checkPermission('write', 'DocumentMetadata');

    // Make sure the specified encounter exists
    const specifiedEncounter = await models.Encounter.findByPk(params.id);
    if (!specifiedEncounter) {
      throw new NotFoundError();
    }

    // Create file on the sync server
    const { attachmentId, metadata } = await uploadAttachment(req, DOCUMENT_SIZE_LIMIT);

    const documentMetadataObject = await models.DocumentMetadata.create({
      ...metadata,
      attachmentId,
      encounterId: params.id,
    });

    res.send(documentMetadataObject);
  }),
);

const encounterRelations = permissionCheckingRouter('read', 'Encounter');
encounterRelations.get('/:id/discharge', simpleGetHasOne('Discharge', 'encounterId'));
encounterRelations.get('/:id/vitals', simpleGetList('Vitals', 'encounterId'));
encounterRelations.get('/:id/diagnoses', simpleGetList('EncounterDiagnosis', 'encounterId'));
encounterRelations.get('/:id/medications', simpleGetList('EncounterMedication', 'encounterId'));
encounterRelations.get('/:id/procedures', simpleGetList('Procedure', 'encounterId'));
encounterRelations.get(
  '/:id/labRequests',
  simpleGetList('LabRequest', 'encounterId', {
    additionalFilters: {
      status: {
        [Op.ne]: LAB_REQUEST_STATUSES.DELETED,
      },
    },
  }),
);
encounterRelations.get('/:id/referral', simpleGetList('Referral', 'encounterId'));
encounterRelations.get('/:id/documentMetadata', simpleGetList('DocumentMetadata', 'encounterId'));
encounterRelations.get('/:id/imagingRequests', simpleGetList('ImagingRequest', 'encounterId'));
encounterRelations.get(
  '/:id/notes',
  simpleGetList('Note', 'recordId', {
    additionalFilters: { recordType: NOTE_RECORD_TYPES.ENCOUNTER },
  }),
);

encounterRelations.get(
  '/:id/programResponses',
  asyncHandler(async (req, res) => {
    const { db, models, params, query } = req;
    const encounterId = params.id;
    const { count, data } = await runPaginatedQuery(
      db,
      models.SurveyResponse,
      `
        SELECT COUNT(1) as count
        FROM
          survey_responses
          LEFT JOIN encounters
            ON (survey_responses.encounter_id = encounters.id)
          LEFT JOIN surveys
            ON (survey_responses.survey_id = surveys.id)
        WHERE
          survey_responses.encounter_id = :encounterId
        AND
          surveys.survey_type = 'programs'
      `,
      `
        SELECT
          survey_responses.*,
          surveys.name as survey_name,
          programs.name as program_name,
          users.display_name as assessor_name
        FROM
          survey_responses
          LEFT JOIN surveys
            ON (survey_responses.survey_id = surveys.id)
          LEFT JOIN programs
            ON (programs.id = surveys.program_id)
          LEFT JOIN encounters
            ON (encounters.id = survey_responses.encounter_id)
          LEFT JOIN users
            ON (users.id = encounters.examiner_id)
        WHERE
          survey_responses.encounter_id = :encounterId
        AND
          surveys.survey_type = 'programs'
      `,
      { encounterId },
      query,
    );

    res.send({
      count: parseInt(count, 10),
      data,
    });
  }),
);

encounterRelations.get('/:id/invoice', simpleGetHasOne('Invoice', 'encounterId'));

encounter.use(encounterRelations);
