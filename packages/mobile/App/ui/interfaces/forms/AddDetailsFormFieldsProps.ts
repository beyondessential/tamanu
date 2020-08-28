import { ISurveyScreenComponent } from '~/types';
import { VerticalPosition } from '../VerticalPosition';

export interface AddDetailsFormFieldsProps {
  components: ISurveyScreenComponent;
  scrollTo: (item: { x: number; y: number }) => void;
  verticalPositions: VerticalPosition;
}
