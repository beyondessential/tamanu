import * as Yup from 'yup';
import { VerticalPosition } from '../../../VerticalPosition';
import { IProgram } from '~/types';

export interface ScreenProps {
  onSubmitForm: (values: any) => void;
  formValidationSchema: Yup.ObjectSchema;
  initialValues: { [key: string]: any };
  containerScrollView: any;
  verticalPositions: VerticalPosition;
  program: IProgram;
  scrollTo: (position: { x: number; y: number }) => void;
}
