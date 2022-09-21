import { Entity, Column, AfterLoad } from 'typeorm/browser';
import { SYNC_DIRECTIONS } from './types';
import { BaseModel } from './BaseModel';
import { SurveyResponseAnswer } from './SurveyResponseAnswer';
import { readFileInDocuments, deleteFileInDocuments } from '../ui/helpers/file';

@Entity('attachment')
export class Attachment extends BaseModel {
  static syncDirection = SYNC_DIRECTIONS.PULL_FROM_CENTRAL;

  @Column({ nullable: true })
  size?: number; //size in bytes

  @Column({ type: 'varchar' })
  type: string;

  @Column({ type: 'blob', nullable: true })
  data: Buffer;

  @Column()
  filePath: string; // will not be synced up, only for local usage

  static uploadLimit = 1;

  static async filterExportRecords(ids: string[]) {
    // Only export attachments that are attached to a survey response answers
    // Attachments that are orphaned will be cleaned up later.
    const attachmentAnswers = await SurveyResponseAnswer.getRepository()
      .createQueryBuilder('survey_response_answer')
      .where('survey_response_answer.body IN (:...ids)', { ids })
      .getMany();

    return attachmentAnswers.map(a => a.body);
  }

  static async postExportCleanUp(): Promise<void> {
    // Clean up all attachments and their associated files after export.
    // We might have a lot of scenarios that attachments may hang around
    // like exiting while doing survey,... So I feel that it is safest
    // to do clean everything after exporting.
    const attachments = await this.getRepository()
      .createQueryBuilder('attachment')
      .select('filePath')
      .getRawMany();
    for (const { filePath } of attachments) {
      await deleteFileInDocuments(filePath);
    }
    await this.getRepository().clear();
  }

  @AfterLoad()
  async populateDataFromPath(): Promise<void> {
    // Sqlite cannot handle select query with very large blob.
    // So this is a work around to avoid that.
    // 'data' will also be synced up.
    // Ideally, with file compressing, attachments should not
    // be too large, but this is just in case.
    if (this.filePath) {
      const base64 = await readFileInDocuments(this.filePath);
      this.data = Buffer.from(base64, 'base64');
    }
  }

  static excludedSyncColumns: string[] = [
    ...BaseModel.excludedSyncColumns,
    'filePath'
  ];
}
