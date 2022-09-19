import express from 'express';

import { constructPermission } from 'shared/permissions/middleware';
import { loginHandler, authMiddleware } from '../../middleware/auth';

import { user } from './user';
import { patient, patientCarePlan, patientIssue } from './patient';
import { encounter } from './encounter';
import { vitals } from './vitals';
import { procedure } from './procedure';
import { suggestions } from './suggestions';
import { triage } from './triage';
import { referenceData } from './referenceData';
import { diagnosis } from './diagnosis';
import { medication } from './medication';
import { allergy } from './allergy';
import { ongoingCondition } from './ongoingCondition';
import { note } from './note';
import { familyHistory } from './familyHistory';
import { labRequest, labTest } from './labs';
import { labRequestLog } from './labRequestLog';
import { program } from './program';
import { survey } from './survey';
import { surveyResponse } from './surveyResponse';
import { referral } from './referral';
import { imagingRequest } from './imaging';
import { reports } from './reports';
import { reportRequest } from './reportRequest';
import { appointments } from './appointments';
import { invoices, invoiceLineTypes } from './invoice';
import { resetPassword } from './resetPassword';
import { changePassword } from './changePassword';
import { certificateNotification } from './certificateNotification';

import { setting } from './setting';
import { asset } from './asset';
import { department } from './department';
import { location } from './location';
import { attachment } from './attachment';
import { scheduledVaccine } from './scheduledVaccine';
import { sync } from './sync';
import { syncHealth } from './syncHealth';

export const apiv1 = express.Router();

apiv1.post('/login', loginHandler);
apiv1.use('/resetPassword', resetPassword);
apiv1.use('/changePassword', changePassword);

apiv1.use(authMiddleware);
apiv1.use(constructPermission);

apiv1.use('/suggestions', suggestions);
apiv1.use('/user', user);
apiv1.use('/patient', patient);
apiv1.use('/encounter', encounter);
apiv1.use('/vitals', vitals);
apiv1.use('/procedure', procedure);
apiv1.use('/triage', triage);
apiv1.use('/referenceData', referenceData);
apiv1.use('/diagnosis', diagnosis);
apiv1.use('/patientIssue', patientIssue);
apiv1.use('/familyHistory', familyHistory);
apiv1.use('/allergy', allergy);
apiv1.use('/ongoingCondition', ongoingCondition);
apiv1.use('/medication', medication);
apiv1.use('/note', note);
apiv1.use('/labRequest', labRequest);
apiv1.use('/labTest', labTest);
apiv1.use('/labRequestLog', labRequestLog);
apiv1.use('/referral', referral);
apiv1.use('/imagingRequest', imagingRequest);
apiv1.use('/scheduledVaccine', scheduledVaccine);
apiv1.use('/program', program);
apiv1.use('/survey', survey);
apiv1.use('/surveyResponse', surveyResponse);
apiv1.use('/certificateNotification', certificateNotification);

apiv1.use('/reports', reports);
apiv1.use('/reportRequest', reportRequest);
apiv1.use('/patientCarePlan', patientCarePlan);
apiv1.use('/appointments', appointments);

apiv1.use('/invoices', invoices);
apiv1.use('/invoiceLineTypes', invoiceLineTypes);

apiv1.use('/setting', setting);

apiv1.use('/asset', asset);

apiv1.use('/department', department);
apiv1.use('/location', location);

apiv1.use('/attachment', attachment);

apiv1.use('/sync', sync);

apiv1.use('/syncHealth', syncHealth);
