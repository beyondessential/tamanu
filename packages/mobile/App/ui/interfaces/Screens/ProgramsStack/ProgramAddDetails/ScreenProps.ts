import * as Yup from 'yup';
import { VerticalPosition } from '../../../VerticalPosition';
import { ProgramModel } from '../../../../models/Program';

export interface ScreenProps {
  onSubmitForm: (values: any) => void;
  formValidationSchema: Yup.ObjectSchema;
  initialValues: { [key: string]: any };
  containerScrollView: any;
  verticalPositions: VerticalPosition;
  program: ProgramModel;
  scrollTo: (position: { x: number; y: number }) => void;
}
