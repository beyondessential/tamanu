import { FieldTypes, PatientFieldDefinitionTypes } from './fields';

import { LimitedTextField, TextField } from '~/ui/components/TextField/TextField';
import { RadioButtonGroup } from '~/ui/components/RadioButtonGroup';
import { DateField } from '~/ui/components/DateField/DateField';
import { Dropdown, MultiSelectDropdown } from '~/ui/components/Dropdown';
import { Checkbox } from '~/ui/components/Checkbox';
import { NumberField } from '~/ui/components/NumberField';
import { ReadOnlyField } from '~/ui/components/ReadOnlyField';
import { UploadPhoto } from '~/ui/components/UploadPhoto';
import { SignatureField } from '~/ui/components/SignatureField';

import { SurveyQuestionAutocomplete } from '../components/AutocompleteModal/SurveyQuestionAutocomplete';
import { SurveyLink } from '../components/Forms/SurveyForm/SurveyLink';
import { SurveyResult } from '../components/Forms/SurveyForm/SurveyResult';
import { SurveyAnswerField } from '../components/Forms/SurveyForm/SurveyAnswerField';
import { SurveyGeolocationField } from '../components/Forms/SurveyForm/SurveyGeolocationField';

export const FieldByType = {
  [FieldTypes.TEXT]: LimitedTextField,
  [FieldTypes.MULTILINE]: TextField,
  [FieldTypes.RADIO]: RadioButtonGroup,
  [FieldTypes.SELECT]: Dropdown,
  [FieldTypes.MULTI_SELECT]: MultiSelectDropdown,
  [FieldTypes.AUTOCOMPLETE]: SurveyQuestionAutocomplete,
  [FieldTypes.DATE]: DateField,
  [FieldTypes.DATE_TIME]: DateField,
  [FieldTypes.SUBMISSION_DATE]: DateField,
  [FieldTypes.NUMBER]: NumberField,
  [FieldTypes.BINARY]: Checkbox,
  [FieldTypes.CHECKBOX]: Checkbox,
  [FieldTypes.CALCULATED]: ReadOnlyField,
  [FieldTypes.SURVEY_LINK]: SurveyLink,
  [FieldTypes.SURVEY_RESULT]: SurveyResult,
  [FieldTypes.SURVEY_ANSWER]: SurveyAnswerField,
  [FieldTypes.PATIENT_DATA]: ReadOnlyField,
  [FieldTypes.USER_DATA]: ReadOnlyField,
  [FieldTypes.PHOTO]: UploadPhoto,
  [FieldTypes.SIGNATURE]: SignatureField,
  [FieldTypes.INSTRUCTION]: null,
  [FieldTypes.RESULT]: null,
  [FieldTypes.PATIENT_ISSUE_GENERATOR]: ReadOnlyField,
  [FieldTypes.GEOLOCATE]: SurveyGeolocationField,
};

export const PatientFieldDefinitionComponents = {
  [PatientFieldDefinitionTypes.STRING]: FieldByType[FieldTypes.TEXT],
  [PatientFieldDefinitionTypes.NUMBER]: FieldByType[FieldTypes.NUMBER],
  [PatientFieldDefinitionTypes.SELECT]: FieldByType[FieldTypes.SELECT],
};
