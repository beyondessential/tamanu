import * as Yup from 'yup';
import { VerticalPosition } from '../../../VerticalPosition';
import { IProgram } from '~/types';

export interface ScreenProps {
  onSubmitForm: (values: any) => void;
  containerScrollView: any;
  scrollTo: (position: { x: number; y: number }) => void;
  verticalPositions?: VerticalPosition;
  formValidationSchema?: Yup.ObjectSchema;
  program?: IProgram;
  initialValues?: { [key: string]: any };
  survey?: any;
  patient?: any;
}
