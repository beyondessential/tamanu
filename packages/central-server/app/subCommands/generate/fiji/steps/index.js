import villages from './villages';
import examiners from './examiners';
import facilitiesDepartmentsAndLocations from './facilitiesDepartmentsAndLocations';
import scheduledVaccines from './scheduledVaccines';
import programSurveyAndQuestions from './programSurveyAndQuestions';
import labTestCategories from './labTestCategories';
import patient from './patient';
import patientAdditionalData from './patientAdditionalData';
import administeredVaccines from './administeredVaccines';
import testsAndSurveys from './testsAndSurveys';

export const STEPS = {
  // SETUP steps may be specified as dependencies of other steps, not run directly
  SETUP: {
    villages,
    examiners,
    facilitiesDepartmentsAndLocations,
    scheduledVaccines,
    programSurveyAndQuestions,
    labTestCategories,
  },
  // PATIENT step is special and runs before PER_PATIENT steps
  // must return a patient
  PATIENT: patient,
  // PER_PATIENT steps are run after each patient is created and receive the patient's id
  PER_PATIENT: {
    patientAdditionalData,
    administeredVaccines,
    testsAndSurveys,
  },
};
