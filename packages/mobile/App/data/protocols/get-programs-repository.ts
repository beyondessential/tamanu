import { ProgramModel } from '../../domain/models/Program';

export interface GetProgramsRepository {
  get(): Promise<ProgramModel[]>;
}
