import { IQuestion } from './IQuestion';

export interface IProgram { id: number;
  name: string;
  questions: IQuestion[];
}
