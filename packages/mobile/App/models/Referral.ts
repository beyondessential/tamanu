import { Column, Entity, ManyToOne, RelationId } from 'typeorm/browser';
import { BaseModel } from './BaseModel';
import { IReferral, ISurveyResponse, ISurveyScreenComponent } from '~/types';
import { Encounter } from './Encounter';
import { SurveyResponse } from './SurveyResponse';

@Entity('referral')
export class Referral extends BaseModel implements IReferral {
  @Column()
  referredFacility?: string;

  @ManyToOne(() => Encounter, encounter => encounter.initiatedReferrals)
  initiatingEncounter: Encounter;
  @RelationId(({ initiatingEncounter }) => initiatingEncounter)
  initiatingEncounterId: string;

  @ManyToOne(() => Encounter, encounter => encounter.completedReferrals)
  completingEncounter: Encounter;
  @RelationId(({ completingEncounter }) => completingEncounter)
  completingEncounterId: string;

  @ManyToOne(() => SurveyResponse, surveyResponse => surveyResponse.referral)
  surveyResponse: SurveyResponse;
  @RelationId(({ surveyResponse }) => surveyResponse)
  surveyResponseId: string;


  static async submit(
    patientId: string,
    surveyData: ISurveyResponse & {
      encounterReason: string,
      components: ISurveyScreenComponent[],
    },
    values: object,
    setNote: (note: string) => void = () => null,
  ) {
    const response = await SurveyResponse.submit(patientId, surveyData, values, setNote);
    const referralRecord: Referral = await Referral.createAndSaveOne({
      initiatingEncounter: response.encounter,
      surveyResponse: response.id,
    });

    return referralRecord;
  }

  static async getForPatient(patientId: string): Promise<Referral[]> {
    return this.getRepository()
      .createQueryBuilder('referral')
      .leftJoin('referral.initiatingEncounter', 'initiatingEncounter')
      .leftJoinAndSelect('referral.surveyResponse', 'surveyResponse')
      .leftJoinAndSelect('surveyResponse.survey', 'survey')
      .leftJoinAndSelect('surveyResponse.answers', 'answers')
      .leftJoinAndSelect('answers.dataElement', 'dataElement')
      .where('initiatingEncounter.patientId = :patientId', { patientId })
      .getMany();
  }
}
