import { addMinutes } from 'date-fns';
import { toDateTimeString } from 'shared/utils/dateTime';
import { chance } from '../../../chance';

export const insertSurveyResponse = async (
  { SurveyResponse, SurveyResponseAnswer },
  setupData,
  { encounterId, startTime },
) => {
  const { survey } = setupData.programSurveyAndQuestions;
  const response = await SurveyResponse.create({
    encounterId,
    surveyId: survey.id,
    startTime: toDateTimeString(startTime),
    endTime: toDateTimeString(addMinutes(startTime, 10)),
  });

  const readableAnswers = generateAnswers(setupData);
  for (const [readableName, answer] of Object.entries(readableAnswers)) {
    const code = humanReadableQuestionsToCode[readableName];
    await SurveyResponseAnswer.create({
      responseId: response.id,
      name: code,
      body: answer,
      dataElementId: `pde-${code}`,
    });
  }
  return response;
};

const humanReadableQuestionsToCode = {
  consent: 'FijCOVSamp2',
  contactNumber: 'FijCOVSamp11',
  subdivision: 'FijCOVSamp62', // village
  publicOrPrivate: 'FijCOVSamp53',
  publicHealthFacility: 'FijCOVSamp4',
  privateHealthFacility: 'FijCOVSamp54',
  ethnicity: 'FijCOVSamp10',
  address: 'FijCOVSamp12',
  isRDT: 'FijCOVSamp42',
  purpose: 'FijCOVSamp15',
  otherPurpose: 'FijCOVSamp18',
  isRecentAdmission: 'FijCOVSamp16',
  placeOfAdmission: 'FijCOVSamp20',
  admissionDischargeDate: 'FijCOVSamp22',
  medicalHistory: 'FijCOVSamp24',
  medicalProblems: 'FijCOVSamp23',
  medicalProblemsOther: 'FijCOVSamp25',
  isHealthcareWorker: 'FijCOVSamp26',
  isPregnant: 'FijCOVSamp32',
  hasSymptoms: 'FijCOVSamp34',
  dateOfFirstSymptom: 'FijCOVSamp35',
  listOfSymptoms: 'FijCOVSamp36',
  otherSymptoms: 'FijCOVSamp37',
  isVaccinated: 'FijCOVSamp38',
  firstDoseDate: 'FijCOVSamp39',
  secondDoseDate: 'FijCOVSamp40',
  isHighRisk: 'FijCOVSamp59',
  isContactHighRisk: 'FijCOVSamp60',
};

const generateAnswers = ({ villages, facilitiesDepartmentsAndLocations }) => {
  // screen 1
  const consent = 'Yes'; // if they don't consent then the form isn't filled in
  const contactNumber = chance.integer({ min: 1000000, max: 9999999 }); // yes, in this survey it's a number
  const subdivision = chance.pickone(villages).id;
  const [facility] = chance.pickone(facilitiesDepartmentsAndLocations);
  const publicOrPrivate = chance.pickone(['Public', 'Private']);
  let publicHealthFacility;
  let privateHealthFacility;
  if (publicOrPrivate === 'Public') {
    publicHealthFacility = facility.id; // TODO: actual survey uses ReferenceData
  } else {
    privateHealthFacility = `${chance.city()} ${chance.pickone([
      'Hospital',
      'Clinic',
      'Medical Center',
    ])}`;
  }
  const address = `${chance.address()} ${chance.city()}`;

  // screen 2
  const isRDT = chance.pickone(['Yes', 'No']);
  const purpose = chance.pickone([
    'Symptoms',
    'Contact tracing',
    'High risk group screening',
    'Screening for hospital admission',
    'Pre-departure travel',
    'Border quarantine traveller',
    'Other',
  ]);
  let otherPurpose;
  if (purpose === 'Other') {
    otherPurpose = chance.sentence();
  }
  const isHealthcareWorker = chance.pickone(['Yes', 'No']);
  const isPregnant = chance.pickone(['Yes', 'No']);

  // screen 3
  const hasSymptoms = chance.pickone(['Yes', 'No']);
  let dateOfFirstSymptom;
  let listOfSymptoms;
  let otherSymptoms;
  if (hasSymptoms) {
    dateOfFirstSymptom = chance.date({ year: chance.pickone([2021, 2022]) }).toISOString();
    const possibleSymptoms = [
      'Cough',
      'Runny nose/Nasal congestion/Sneezing',
      'Fever',
      'Sore throat',
      'Headache',
      'Body ache',
      'Loss of taste',
      'Loss of smell',
      'Shortness of breath',
      'Chest pain/heaviness',
      'Other',
    ];
    listOfSymptoms = chance.pickset(
      possibleSymptoms,
      chance.integer({ min: 1, max: possibleSymptoms.length }),
    );
    if (listOfSymptoms.includes('Other')) {
      otherSymptoms = chance.sentence();
    }
  }
  const isHighRisk = chance.pickone(['Yes', 'No']);
  const isContactHighRisk = chance.pickone(['Yes', 'No']);

  return {
    // screen 1
    consent,
    contactNumber,
    subdivision,
    publicOrPrivate,
    publicHealthFacility,
    privateHealthFacility,
    address,

    // screen 2
    isRDT,
    purpose,
    otherPurpose,
    isHealthcareWorker,
    isPregnant,

    // screen 3
    hasSymptoms,
    dateOfFirstSymptom,
    listOfSymptoms: listOfSymptoms.join(', '),
    otherSymptoms,
    isHighRisk,
    isContactHighRisk,
  };
};
