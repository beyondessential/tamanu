export interface SignInFormModel {
  email: string;
  password: string;
}

export interface SignInFormProps {
  onSubmitForm: (values: SignInFormModel) => Promise<void>;
}
