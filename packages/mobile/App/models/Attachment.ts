import { Entity, Column } from 'typeorm/browser';
import { BaseModel } from './BaseModel';
import { SurveyResponseAnswer } from './SurveyResponseAnswer';

export enum FileType {
  JPEG = 'jpeg',
  PNG = 'png',
  WEBP = 'webp',
}

@Entity('attachment')
export class Attachment extends BaseModel {
  @Column()
  size: number; //size in bytes

  @Column({ type: 'varchar' })
  type: FileType;

  @Column({ type: 'blob'})
  data: Buffer;

  static shouldImport = false;

  static shouldExport = true;

  static uploadLimit = 10;

  static async filterExportRecords(ids: string[]) {
    // Only export attachments that are attached to a survey response answers
    // Attachments that are orphaned will be cleaned up later.
    const attachmentAnswers = await SurveyResponseAnswer.getRepository()
      .createQueryBuilder('survey_response_answer')
      .where('survey_response_answer.body IN (:...ids)', { ids })
      .getMany();
    
    return attachmentAnswers.map(a => a.body);
  }

  static async postExportCleanUp() {
    // Don't need to store attachments locally after export.
    await this.getRepository().clear();
  }
}
