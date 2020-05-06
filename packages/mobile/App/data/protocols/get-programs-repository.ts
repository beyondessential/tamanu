import { ProgramModel } from '../../domain/models/Program';

export interface GetProgramsRepository {
  getAll(): Promise<ProgramModel[]>;
}
