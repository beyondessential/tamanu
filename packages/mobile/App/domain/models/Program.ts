import { QuestionModel } from './Question';

export interface ProgramModel {
  id: number;
  name: string;
  questions: [
    {
      title: string;
      list: QuestionModel[];
    },
  ];
}
