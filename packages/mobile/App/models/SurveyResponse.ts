import { Entity, Column, ManyToOne } from 'typeorm/browser';

import { BaseModel } from './BaseModel';
import { Survey } from './Survey';
import { ProgramDataElement } from './ProgramDataElement';
import { Encounter } from './Encounter';
import { SurveyResponseAnswer } from './SurveyResponseAnswer';

import { FieldTypes } from '~/ui/helpers/fields';
import { ISurveyResponse } from '~/types';

@Entity('survey_response')
export class SurveyResponse extends BaseModel implements ISurveyResponse {
  @Column()
  startTime: Date;

  @Column()
  endTime: Date;

  @Column()
  result: number;

  @ManyToOne(type => Survey, survey => survey.responses)
  survey: Survey;

  @ManyToOne(type => Encounter, encounter => encounter.surveyResponses)
  encounter: Encounter;

  static async getFullResponse(surveyId: string) {
    const repo = this.getRepository();
    const response = await repo.findOne(surveyId, {
      relations: ['survey', 'encounter', 'encounter.patient'],
    });
    const questions = await response.survey.getComponents();
    const answers = await SurveyResponseAnswer.getRepository().find({
      where: {
        response: response.id,
      },
      relations: ['dataElement'],
    });

    return {
      ...response,
      questions: [...questions],
      answers: [...answers],
    };
  }

  static async submit(patientId, surveyData, values, setNote = () => null): Promise<SurveyResponse> {
    const { surveyId, encounterReason, components, ...otherData } = surveyData;

    try {
      setNote("Creating encounter...");
      const encounter = await Encounter.create({
        patient: patientId,
        startDate: new Date(),
        endDate: new Date(),
        encounterType: 'surveyResponse',
        reasonForEncounter: encounterReason,
      });

      setNote("Creating response object...");
      const responseRecord = await SurveyResponse.create({
        encounter: encounter.id,
        survey: surveyId,
        startTime: Date.now(),
        endTime: Date.now(),
        ...otherData,
      });

      setNote("Attaching answers...");
      const findDataElement = (code: string): string => {
        const component = components.find(c => c.dataElement.code === code);
        if(!component) return '';
        return component.dataElement;
      };

      const getStringValue = (type: string, value: any): string  => {
        switch(type) {
          case FieldTypes.TEXT:
          case FieldTypes.MULTILINE:
            return value;
          case FieldTypes.DATE:
          case FieldTypes.SUBMISSION_DATE:
            return value && value.toISOString();
          case FieldTypes.BINARY:
          case FieldTypes.CHECKBOX:
            if(typeof value === 'string') return value;
            // booleans should all be stored as Yes/No to match meditrak
            return value ? "Yes" : "No";
          default:
            return `${value}`;
        }
      }

      for(let a of Object.entries(values)) { 
        const [dataElementCode, value] = a;
        const dataElement = findDataElement(dataElementCode);
        const body = getStringValue(dataElement.type, value);

        console.log(`${dataElement.code} (${dataElement.type}): ${body}`);

        setNote(`Attaching answer for ${dataElement.id}...`);
        try {
          await SurveyResponseAnswer.create({
            dataElement: dataElement.id,
            body,
            response: responseRecord.id,
          });
        } catch(e) {
          console.warn(e);
        }
      }
      setNote(`Done`);

      return responseRecord;
    } catch(e) {
      setNote(`Error: ${e.message} (${JSON.stringify(e)})`);     

      return null;
    }
  }
}

