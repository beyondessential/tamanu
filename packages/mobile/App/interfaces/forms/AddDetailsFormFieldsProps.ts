import { ProgramModel } from '../../models/Program';
import { VerticalPosition } from '../VerticalPosition';

export interface AddDetailsFormFieldsProps {
  program: ProgramModel;
  scrollTo: (item: { x: number; y: number }) => void;
  verticalPositions: VerticalPosition;
}
