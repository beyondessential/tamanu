import { Entity, Column, ManyToOne, OneToMany, BeforeUpdate, BeforeInsert, RelationId } from 'typeorm/browser';

import { BaseModel } from './BaseModel';
import { Survey } from './Survey';
import { Encounter } from './Encounter';
import { SurveyResponseAnswer } from './SurveyResponseAnswer';

import {
  getStringValue,
  getResultValue,
} from '~/ui/helpers/fields';

import { runCalculations } from '~/ui/helpers/calculations';

import { ISurveyResponse } from '~/types';

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

  @ManyToOne(() => Survey, survey => survey.responses)
  survey: Survey;

  @RelationId(({ survey }) => survey)
  surveyId: string;

  @ManyToOne(() => Encounter, encounter => encounter.surveyResponses)
  encounter: Encounter;

  @RelationId(({ encounter }) => encounter)
  encounterId: string;

  @OneToMany(() => SurveyResponseAnswer, answer => answer.response, { cascade: ['insert'] })
  answers: SurveyResponseAnswer[];

  @BeforeInsert()
  @BeforeUpdate()
  async markEncounterForUpload() {
    await this.markParentForUpload(Encounter, 'encounter');
  }

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

      const calculatedValues = runCalculations(components, values);

      const {
        result,
        resultText,
      } = getResultValue(components, calculatedValues);

      setNote("Creating response object...");
      const responseRecord = await SurveyResponse.create({
        encounter: encounter.id,
        survey: surveyId,
        startTime: Date.now(),
        endTime: Date.now(),
        result,
        resultText,
        ...otherData,
      });

      setNote("Attaching answers...");
      const findDataElement = (code: string): string => {
        const component = components.find(c => c.dataElement.code === code);
        if (!component) return '';
        return component.dataElement;
      };

      for (let a of Object.entries(calculatedValues)) {
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
    } catch (e) {
      setNote(`Error: ${e.message} (${JSON.stringify(e)})`);

      return null;
    }
  }
}

