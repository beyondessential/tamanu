import { test as fixtureTest } from './fixtures';
import { TestHelper } from '../utils/TestHelper';                                                       
import { AllPatientPage } from '../pages/AllPatientPage';
import { PatientPage } from '../pages/PatientPage';

fixtureTest.describe('Add New Patient Feature', () => {
    let allPatientPage: AllPatientPage;
    let patientPage: PatientPage;

    fixtureTest.beforeEach(async ({ loggedInPage }) => {
        allPatientPage = new AllPatientPage(loggedInPage);
        await allPatientPage.navigateToAllPatients();
    });

    fixtureTest('Should be able to add a new patient with required fields', async ({ loggedInPage }) => {
        const patientData = await TestHelper.addNewPatientWithRequiredFields(loggedInPage);
        patientPage = new PatientPage(loggedInPage);
        await patientPage.verifyPatientDetails(patientData);
    });
});

