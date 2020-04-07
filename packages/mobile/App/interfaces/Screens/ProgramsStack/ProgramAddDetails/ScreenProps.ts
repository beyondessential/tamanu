import { VerticalPosition } from '/interfaces/VerticalPosition';
import * as Yup from 'yup';
import { ProgramModel } from '/models/Program';

export interface ScreenProps {
  onSubmitForm: (values: any) => void;
  formValidationSchema: Yup.ObjectSchema;
  initialValues: { [key: string]: any };
  containerScrollView: any;
  verticalPositions: VerticalPosition;
  program: ProgramModel;
  scrollTo: (position: { x: number; y: number }) => void;
}
