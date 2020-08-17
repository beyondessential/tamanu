import { Chance } from 'chance'
import { PatientEntity } from "/root/App/entities/PatientEntity";

const chance = new Chance()


export const generatePatient = (): PatientEntity => {      
  const patient = new PatientEntity();
  const [firstName, middleName, lastName] = chance
    .name({ middle: true })
    .split(' ');                  
  patient.displayId = 'valid-id';
  patient.firstName = firstName;
  patient.middlename = middleName;
  patient.lastName = lastName;
  patient.lastDate = new Date();
  patient.culturalName = 'cultural-name';
  patient.sex = 'male';
  patient.dateOfBirth = new Date();
  return patient;
}      
