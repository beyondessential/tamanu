import express from 'express';

import { constructPermission } from '@tamanu/shared/permissions/middleware';
import { settingsCache } from '@tamanu/settings';
import { attachAuditUserToDbSession } from '@tamanu/database/utils/audit';

import {
  authMiddleware,
  loginHandler,
  refreshHandler,
  setFacilityHandler,
} from '../../middleware/auth';
import asyncHandler from 'express-async-handler';
import { keyBy, mapValues } from 'lodash';

import { allergy } from './allergy';
import { appointments } from './appointments';
import { asset } from './asset';
import { attachment } from './attachment';
import { certificateNotification } from './certificateNotification';
import { changePassword } from './changePassword';
import { department } from './department';
import { diagnosis } from './diagnosis';
import { encounter } from './encounter';
import { facility } from './facility';
import { familyHistory } from './familyHistory';
import { imagingRequest } from './imaging';
import { invoices } from './invoice';
import { labRequest, labTest, labTestPanel, labTestType } from './labs';
import { labRequestLog } from './labRequestLog';
import { location } from './location';
import { locationGroup } from './locationGroup';
import { medication } from './medication';
import { notes } from './note';
import { ongoingCondition } from './ongoingCondition';
import { patient, patientCarePlan, patientFieldDefinition, patientIssue } from './patient';
import { patientFacility } from './patientFacility';
import { template } from './template';
import { procedure } from './procedure';
import { program } from './program';
import { programRegistry } from './programRegistry';
import { referenceData } from './referenceData';
import { referral } from './referral';
import { reportRequest } from './reportRequest';
import { reports } from './reports';
import { resetPassword } from './resetPassword';
import { scheduledVaccine } from './scheduledVaccine';
import { suggestions } from './suggestions';
import { survey } from './survey';
import { surveyResponse } from './surveyResponse';
import { surveyResponseAnswer } from './surveyResponseAnswer';
import { sync } from './sync';
import { syncHealth } from './syncHealth';
import { triage } from './triage';
import { user } from './user';
import { vitals } from './vitals';
import { translation } from './translation';
import { upcomingVaccinations } from './upcomingVaccinations';
import { telegramRoutes } from './telegram/telegramRoutes';
import { tasks } from './task/tasks';
import { notifications } from './notifications';

export const apiv1 = express.Router();
const patientDataRoutes = express.Router();
const referenceDataRoutes = express.Router();
const syncRoutes = express.Router();

// auth endpoints (added pre auth check)
apiv1.post('/login', loginHandler);
apiv1.use('/resetPassword', resetPassword);
apiv1.use('/changePassword', changePassword);

apiv1.get(
  '/public/ping',
  asyncHandler((req, res) => {
    req.flagPermissionChecked();
    return res.send({ ok: 'ok' });
  }),
);

apiv1.get('/public/translation/languageOptions', async (req, res) => {
  req.flagPermissionChecked();
  const { TranslatedString } = req.models;
  const response = await TranslatedString.getPossibleLanguages();
  res.send(response);
});

apiv1.get(
  '/public/translation/:language',
  asyncHandler(async (req, res) => {
    // Everyone can access translations
    req.flagPermissionChecked();

    const {
      models: { TranslatedString },
      params: { language },
    } = req;

    const translatedStringRecords = await TranslatedString.findAll({
      where: { language },
      attributes: ['stringId', 'text'],
    });

    res.send(mapValues(keyBy(translatedStringRecords, 'stringId'), 'text'));
  }),
);

apiv1.use(authMiddleware);

apiv1.use(constructPermission);

apiv1.use(attachAuditUserToDbSession);

apiv1.delete(
  '/admin/settings/cache',
  asyncHandler(async (req, res) => {
    req.checkPermission('manage', 'all');
    settingsCache.reset();
    res.status(204).send();
  }),
);

apiv1.post('/refresh', refreshHandler);
apiv1.post('/setFacility', setFacilityHandler);
apiv1.use(patientDataRoutes); // see below for specifics
apiv1.use(referenceDataRoutes); // see below for specifics
apiv1.use(syncRoutes); // see below for specifics
apiv1.use('/telegram', telegramRoutes);

// patient data endpoints
patientDataRoutes.use('/allergy', allergy);
patientDataRoutes.use('/appointments', appointments);
patientDataRoutes.use('/diagnosis', diagnosis);
patientDataRoutes.use('/encounter', encounter);
patientDataRoutes.use('/familyHistory', familyHistory);
patientDataRoutes.use('/imagingRequest', imagingRequest);
patientDataRoutes.use('/invoices', invoices);
patientDataRoutes.use('/labRequest', labRequest);
patientDataRoutes.use('/labTest', labTest);
patientDataRoutes.use('/labTestType', labTestType);
patientDataRoutes.use('/labTestPanel', labTestPanel);
patientDataRoutes.use('/medication', medication);
patientDataRoutes.use('/notes', notes);
patientDataRoutes.use('/ongoingCondition', ongoingCondition);
patientDataRoutes.use('/patient', patient);
patientDataRoutes.use('/patientCarePlan', patientCarePlan);
patientDataRoutes.use('/patientIssue', patientIssue);
patientDataRoutes.use('/procedure', procedure);
patientDataRoutes.use('/referral', referral);
patientDataRoutes.use('/surveyResponse', surveyResponse);
patientDataRoutes.use('/surveyResponseAnswer', surveyResponseAnswer);
patientDataRoutes.use('/triage', triage);
patientDataRoutes.use('/vitals', vitals);
patientDataRoutes.use('/tasks', tasks);
patientDataRoutes.use('/notifications', notifications);

// reference data endpoints
referenceDataRoutes.use('/asset', asset);
referenceDataRoutes.use('/attachment', attachment);
referenceDataRoutes.use('/certificateNotification', certificateNotification);
referenceDataRoutes.use('/department', department);
referenceDataRoutes.use('/facility', facility);
referenceDataRoutes.use('/labRequestLog', labRequestLog);
referenceDataRoutes.use('/location', location);
referenceDataRoutes.use('/locationGroup', locationGroup);
referenceDataRoutes.use('/patientFieldDefinition', patientFieldDefinition);
referenceDataRoutes.use('/template', template);
referenceDataRoutes.use('/program', program);
referenceDataRoutes.use('/programRegistry', programRegistry);
referenceDataRoutes.use('/referenceData', referenceData);
referenceDataRoutes.use('/reportRequest', reportRequest);
referenceDataRoutes.use('/reports', reports);
referenceDataRoutes.use('/scheduledVaccine', scheduledVaccine);
referenceDataRoutes.use('/suggestions', suggestions);
referenceDataRoutes.use('/survey', survey);
referenceDataRoutes.use('/user', user);
referenceDataRoutes.use('/upcomingVaccinations', upcomingVaccinations);
referenceDataRoutes.use('/translation', translation);

// sync endpoints
syncRoutes.use('/sync', sync);
syncRoutes.use('/syncHealth', syncHealth);
syncRoutes.use('/patientFacility', patientFacility);
