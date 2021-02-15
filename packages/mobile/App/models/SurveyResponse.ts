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

import { ISurveyResponse, IProgramDataElement, ISurveyScreenComponent } from '~/types';

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

  @OneToMany(() => SurveyResponseAnswer, answer => answer.response)
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

  static async submit(
    patientId: string,
    surveyData: ISurveyResponse & {
      encounterReason: string,
      components: ISurveyScreenComponent[],
    },
    values: object,
    setNote: (note: string) => void = () => null,
  ): Promise<SurveyResponse> {
    const {
      surveyId,
      encounterReason,
      components,
      ...otherData
    } = surveyData;

    try {
      setNote("Creating encounter...");
      const encounter = await Encounter.createAndSaveOne({
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
      const responseRecord: SurveyResponse = await SurveyResponse.createAndSaveOne({
        encounter: encounter.id,
        survey: surveyId,
        startTime: Date.now(),
        endTime: Date.now(),
        result,
        resultText,
        ...otherData,
      });

      setNote("Attaching answers...");
      const findDataElement = (code: string): IProgramDataElement => {
        const component = components.find(c => c.dataElement.code === code);
        if (!component) return null;
        return component.dataElement;
      };

      for (const a of Object.entries(calculatedValues)) {
        const [dataElementCode, value] = a;
        const dataElement = findDataElement(dataElementCode);
        if (dataElement === null) {
          // better to fail entirely than save partial data
          throw new Error(`no data element for code: ${dataElementCode}`);
        }

        const body = getStringValue(dataElement.type, value);

        setNote(`Attaching answer for ${dataElement.id}...`);
        await SurveyResponseAnswer.createAndSaveOne({
          dataElement: dataElement.id,
          body,
          response: responseRecord.id,
        });
      }
      setNote('Done');

      return responseRecord;
    } catch (e) {
      setNote(`Error: ${e.message} (${JSON.stringify(e)})`);

      return null;
    }
  }

  static async getForPatient(patientId: string): Promise<SurveyResponse[]> {
    return this.getRepository()
      .createQueryBuilder('survey_response')
      .leftJoinAndSelect('survey_response.encounter', 'encounter')
      .leftJoinAndSelect('survey_response.survey', 'survey')
      .where('encounter.patient.id = :patient', { patient: patientId })
      .getMany();
  }
}
