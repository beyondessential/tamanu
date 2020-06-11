import { Chance } from 'chance'
import { Patient } from "../entities/patient";

const chance = new Chance()


export const generatePatient = (): Patient => {      
    const patient = new Patient()                
      const [firstName, middleName, lastName] = chance
        .name({ middle: true })
        .split(' ');                  
        patient.displayId =  'valid-id'
        patient.firstName = firstName
        patient.middlename = middleName
        patient.lastName = lastName
        patient.lastDate = new Date()
        patient.culturalName = 'cultural-name'
        patient.sex = 'male'
        patient.dateOfBirth = new Date()
        return patient   
    }      