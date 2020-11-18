import * as Yup from 'yup';
import { VerticalPosition } from '../VerticalPosition';
import { IProgram } from '~/types';

export type ProgramsFormProps = {
  onSubmit: (values: any) => void;
  formValidationSchema: Yup.ObjectSchema;
  initialValues: { [key: string]: any };
  verticalPositions: VerticalPosition;
  program: IProgram;
  components: any;
};
