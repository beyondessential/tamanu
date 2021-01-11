import { Entity, Column, ManyToOne } from 'typeorm/browser';

import { BaseModel } from './BaseModel';
import { Survey } from './Survey';
import { ProgramDataElement } from './ProgramDataElement';
import { Encounter } from './Encounter';
import { SurveyResponseAnswer } from './SurveyResponseAnswer';

import { 
  FieldTypes, 
  getStringValue,
  getResultValue,
  checkVisibilityCriteria
} from '~/ui/helpers/fields';
import { DataElementType, ISurveyResponse } from '~/types';

@Entity('survey_response')
export class SurveyResponse extends BaseModel implements ISurveyResponse {
  @Column()
  startTime: Date;

  @Column()
  endTime: Date;

  @Column({ default: 0 })
  result: number;

  @Column({ default: '' })
  resultText: string;

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
    const { 
      surveyId, 
      encounterReason, 
      components,
      ...otherData
    } = surveyData;

    try {
      setNote("Creating encounter...");
      const encounter = await Encounter.create({
        patient: patientId,
        startDate: new Date(),
        endDate: new Date(),
        encounterType: 'surveyResponse',
        reasonForEncounter: encounterReason,
      });

      // find a component with a Result data type and use its value as the overall result
      const resultComponents = components
        .filter(c => c.dataElement.type === DataElementType.Result)
        .filter(c => checkVisibilityCriteria(c, componenets, values));

      const { 
        result,
        resultText,
      } = getResultValue(resultComponents[0], values);

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

      for(let a of Object.entries(values)) { 
        const [dataElementCode, value] = a;
        const dataElement = findDataElement(dataElementCode);
        const body = getStringValue(dataElement.type, value);

        setNote(`Attaching answer for ${dataElement.id}...`);
        await SurveyResponseAnswer.create({
          dataElement: dataElement.id,
          body,
          response: responseRecord.id,
        });
      }
      setNote(`Done`);

      return responseRecord;
    } catch(e) {
      setNote(`Error: ${e.message} (${JSON.stringify(e)})`);     

      return null;
    }
  }
}

