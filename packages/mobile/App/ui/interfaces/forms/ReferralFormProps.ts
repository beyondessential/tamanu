import { ISurveyResponse, IUser } from '~/types';
import { Suggester } from '~/ui/helpers/suggester';

export type ReferralFormProps = {
    handleSubmit: (value: any) => void;
    icd10Suggester: Suggester;
    practitionerSuggester: Suggester;
    navigation: any;
    loggedInUser: IUser;
    surveyResponses: ISurveyResponse[];
}
