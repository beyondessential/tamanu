import { IUser } from '~/types';
import { Suggester } from '~/ui/helpers/suggester';

export type ReferralFormProps = {
    scrollViewRef: any;
    scrollToComponent: (field: string) => void;
    handleSubmit: (value: any) => void;
    icd10Suggester: Suggester;
    practitionerSuggester: Suggester;
    navigation: any;
    loggedInUser: IUser;
}
