import { FieldTypes } from './fields';

import { TextField, LimitedTextField } from '~/ui/components/TextField/TextField';
import { RadioButtonGroup } from '~/ui/components/RadioButtonGroup';
import { DateField } from '~/ui/components/DateField/DateField';
import { Dropdown, MultiSelectDropdown } from '~/ui/components/Dropdown';
import { Checkbox } from '~/ui/components/Checkbox';
import { NumberField } from '~/ui/components/NumberField';
import { ReadOnlyField } from '~/ui/components/ReadOnlyField';
import { UploadPhoto } from '~/ui/components/UploadPhoto';

import { SurveyQuestionAutocomplete } from '../components/AutocompleteModal/SurveyQuestionAutocomplete';
import { SurveyLink } from '../components/Forms/SurveyForm/SurveyLink';
import { SurveyResult } from '../components/Forms/SurveyForm/SurveyResult';
import { SurveyAnswerField } from '../components/Forms/SurveyForm/SurveyAnswerField';
import { PatientDataField } from '../components/Forms/SurveyForm/PatientDataField';
import { UserDataField } from '../components/Forms/SurveyForm/UserDataField';

export const FieldByType = {
  [FieldTypes.TEXT]: LimitedTextField,
  [FieldTypes.MULTILINE]: TextField,
  [FieldTypes.RADIO]: RadioButtonGroup,
  [FieldTypes.SELECT]: Dropdown,
  [FieldTypes.MULTI_SELECT]: MultiSelectDropdown,
  [FieldTypes.AUTOCOMPLETE]: SurveyQuestionAutocomplete,
  [FieldTypes.DATE]: DateField,
  [FieldTypes.SUBMISSION_DATE]: DateField,
  [FieldTypes.NUMBER]: NumberField,
  [FieldTypes.BINARY]: Checkbox,
  [FieldTypes.CHECKBOX]: Checkbox,
  [FieldTypes.CALCULATED]: ReadOnlyField,
  [FieldTypes.SURVEY_LINK]: SurveyLink,
  [FieldTypes.SURVEY_RESULT]: SurveyResult,
  [FieldTypes.SURVEY_ANSWER]: SurveyAnswerField,
  [FieldTypes.PATIENT_DATA]: PatientDataField,
  [FieldTypes.USER_DATA]: UserDataField,
  [FieldTypes.PHOTO]: UploadPhoto,
  [FieldTypes.INSTRUCTION]: null,
  [FieldTypes.RESULT]: null,
};
