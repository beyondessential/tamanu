export interface ChangePasswordFormModel {
  email: string;
  token: string;
  newPassword: string;
  server: string;
}

export interface ChangePasswordFormProps {
  onSubmitForm: (values: ChangePasswordFormModel) => Promise<void>;
  email: string;
}
