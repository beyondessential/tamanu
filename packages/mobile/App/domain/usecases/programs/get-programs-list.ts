import { ProgramModel } from '../../models/Program';

export interface GetProgramsList {
  get(): Promise<ProgramModel[]>;
}
