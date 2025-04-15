import { faker } from "@faker-js/faker";
import { AllPatientsPage } from "../pages/patients/AllPatientsPage";

function generatePatientData() {
  const gender = faker.helpers.arrayElement(["male", "female"]);
  const firstName = faker.person.firstName(gender);
  const lastName = faker.person.lastName();
  const dob = faker.date.birthdate({ min: 18, max: 80, mode: "age" });
  const formattedDOB = dob.toISOString().split("T")[0]; // Convert to YYYY-MM-DD format

  return { firstName, lastName, gender, formattedDOB, nhn: '' };
}

export async function addNewPatientWithRequiredFields(allPatientsPage: AllPatientsPage) {
  await allPatientsPage.addNewPatientBtn.click();

  const patientData = generatePatientData();

  allPatientsPage.setPatientData(patientData);

  await allPatientsPage.fillNewPatientDetails(
    patientData.firstName,
    patientData.lastName,
    patientData.formattedDOB,
    patientData.gender,
  );

  const nhn = await allPatientsPage.NewPatientNHN.textContent() || '';
  patientData.nhn = nhn;

  await allPatientsPage.NewPatientConfirmBtn.click();

  return patientData;
}
