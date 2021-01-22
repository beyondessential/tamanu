import express from 'express';

import { loginHandler, authMiddleware } from '~/middleware/auth';
import { constructPermission } from '~/middleware/permission';

import { user } from './user';
import { patient } from './patient';
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
import { ongoingCondition } from './ongoingCondition';
import { labRequest, labTest } from './labs';
import { program } from './program';
import { survey } from './survey';
import { surveyResponse } from './surveyResponse';
import { referral } from './referral';
import { imagingRequest } from './imaging';
import { immunisation } from './immunisation';

export const apiv1 = express.Router();

apiv1.post('/login', loginHandler);

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
apiv1.use('/familyHistory', familyHistory);
apiv1.use('/allergy', allergy);
apiv1.use('/ongoingCondition', ongoingCondition);
apiv1.use('/medication', medication);
apiv1.use('/note', note);
apiv1.use('/labRequest', labRequest);
apiv1.use('/labTest', labTest);
apiv1.use('/referral', referral);
apiv1.use('/imagingRequest', imagingRequest);
apiv1.use('/immunisation', immunisation);

apiv1.use('/program', program);
apiv1.use('/survey', survey);
apiv1.use('/surveyResponse', surveyResponse);
