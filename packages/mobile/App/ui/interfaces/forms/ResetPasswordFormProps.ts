export interface ResetPasswordFormModel {
  email: string;
  server: string;
}

export interface ResetPasswordFormProps {
  onSubmitForm: (values: ResetPasswordFormModel) => Promise<void>;
}
