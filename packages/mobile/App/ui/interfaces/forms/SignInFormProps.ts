export interface SignInFormModel {
  email: string;
  password: string;
  server: string;
}

export interface SignInFormProps {
  onSubmitForm: (values: SignInFormModel) => Promise<void>;
}
