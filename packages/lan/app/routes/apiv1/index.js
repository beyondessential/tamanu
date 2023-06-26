import express from 'express';

import { constructPermission } from 'shared/permissions/middleware';
import { loginHandler, refreshHandler, authMiddleware } from '../../middleware/auth';

import { allergy } from './allergy';
import { appointments } from './appointments';
import { asset } from './asset';
import { attachment } from './attachment';
import { certificateNotification } from './certificateNotification';
import { changePassword } from './changePassword';
import { department } from './department';
import { diagnosis } from './diagnosis';
import { encounter } from './encounter';
import { familyHistory } from './familyHistory';
import { imagingRequest } from './imaging';
import { invoices, invoiceLineTypes } from './invoice';
import { labRequest, labTest, labTestType } from './labs';
import { labRequestLog } from './labRequestLog';
import { location } from './location';
import { locationGroup } from './locationGroup';
import { medication } from './medication';
import { notePages } from './note';
import { ongoingCondition } from './ongoingCondition';
import { patient, patientCarePlan, patientIssue, patientFieldDefinition } from './patient';
import { patientFacility } from './patientFacility';
import { procedure } from './procedure';
import { program } from './program';
import { referenceData } from './referenceData';
import { referral } from './referral';
import { reportRequest } from './reportRequest';
import { reports } from './reports';
import { resetPassword } from './resetPassword';
import { scheduledVaccine } from './scheduledVaccine';
import { suggestions } from './suggestions';
import { survey } from './survey';
import { surveyResponse } from './surveyResponse';
import { sync } from './sync';
import { syncHealth } from './syncHealth';
import { triage } from './triage';
import { user } from './user';
import { vitals } from './vitals';
import { template } from './template';
import { vaccinationSettings } from './vaccinationSettings';

export const apiv1 = express.Router();
const patientDataRoutes = express.Router();
const referenceDataRoutes = express.Router();
const syncRoutes = express.Router();

// auth endpoints (added pre auth check)
apiv1.post('/login', loginHandler);
apiv1.use('/resetPassword', resetPassword);
apiv1.use('/changePassword', changePassword);

apiv1.use(authMiddleware);
apiv1.use(constructPermission);

apiv1.post('/refresh', refreshHandler);
apiv1.use(patientDataRoutes); // see below for specifics
apiv1.use(referenceDataRoutes); // see below for specifics
apiv1.use(syncRoutes); // see below for specifics

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
patientDataRoutes.use('/medication', medication);
patientDataRoutes.use('/notePages', notePages);
patientDataRoutes.use('/ongoingCondition', ongoingCondition);
patientDataRoutes.use('/patient', patient);
patientDataRoutes.use('/patientCarePlan', patientCarePlan);
patientDataRoutes.use('/patientIssue', patientIssue);
patientDataRoutes.use('/procedure', procedure);
patientDataRoutes.use('/referral', referral);
patientDataRoutes.use('/surveyResponse', surveyResponse);
patientDataRoutes.use('/triage', triage);
patientDataRoutes.use('/vitals', vitals);

// reference data endpoints
referenceDataRoutes.use('/asset', asset);
referenceDataRoutes.use('/attachment', attachment);
referenceDataRoutes.use('/certificateNotification', certificateNotification);
referenceDataRoutes.use('/department', department);
referenceDataRoutes.use('/invoiceLineTypes', invoiceLineTypes);
referenceDataRoutes.use('/labRequestLog', labRequestLog);
referenceDataRoutes.use('/location', location);
referenceDataRoutes.use('/locationGroup', locationGroup);
referenceDataRoutes.use('/patientFieldDefinition', patientFieldDefinition);
referenceDataRoutes.use('/program', program);
referenceDataRoutes.use('/referenceData', referenceData);
referenceDataRoutes.use('/reportRequest', reportRequest);
referenceDataRoutes.use('/reports', reports);
referenceDataRoutes.use('/scheduledVaccine', scheduledVaccine);
referenceDataRoutes.use('/suggestions', suggestions);
referenceDataRoutes.use('/survey', survey);
referenceDataRoutes.use('/user', user);
referenceDataRoutes.use('/template', template);
referenceDataRoutes.use('/vaccinationSettings', vaccinationSettings);

// sync endpoints
syncRoutes.use('/sync', sync);
syncRoutes.use('/syncHealth', syncHealth);
syncRoutes.use('/patientFacility', patientFacility);
