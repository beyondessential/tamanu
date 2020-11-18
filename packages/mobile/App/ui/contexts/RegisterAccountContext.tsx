import React, { ReactNode } from 'react';

export interface RegisterAccountFormStep1Props {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: string | null;
}

export interface RegisterAccountFormStep2Props {
  role: string;
  homeFacility: string;
  profession: string;
  professionalRegistrationNumber: string;
  firstYearOfRegistration: string;
}

export interface RegisterAccountFormStep3Props {
  password: string;
  confirmPassword: string;
  readPrivacyPolice: boolean;
}

export type RegisterAccountContextFormProps = RegisterAccountFormStep1Props
  & RegisterAccountFormStep2Props
  & RegisterAccountFormStep3Props

export type UpdateFormTypes = | RegisterAccountFormStep1Props
  | RegisterAccountFormStep2Props
  | RegisterAccountFormStep3Props

export interface RegisterAccountContextProps {
  registerFormState: RegisterAccountContextFormProps;
  updateForm: Function;
}

export const RegisterAccountContext = React.createContext<RegisterAccountContextProps>({
  registerFormState: {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: null,
    role: null,
    homeFacility: null,
    profession: '',
    professionalRegistrationNumber: '',
    firstYearOfRegistration: '',
    password: '',
    confirmPassword: '',
    readPrivacyPolice: false,
  },
  updateForm: () => null,
});

export class RegisterAccountProvider extends React.Component<{}, RegisterAccountContextProps> {
  constructor(props: {}) {
    super(props);
    this.state = {
      registerFormState: {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        gender: null,
        role: null,
        homeFacility: null,
        profession: '',
        professionalRegistrationNumber: '',
        firstYearOfRegistration: '',
        password: '',
        confirmPassword: '',
        readPrivacyPolice: false,
      },
      updateForm: this.updateForm,
    };
  }

  updateForm = (newValues: any): void => {
    this.setState((state: RegisterAccountContextProps) => ({
      ...state,
      registerFormState: {
        ...state.registerFormState,
        ...newValues,
      },
    }));
  };

  render(): ReactNode {
    return (
      <RegisterAccountContext.Provider
        value={this.state}
      >
        {this.props.children}
      </RegisterAccountContext.Provider>
    );
  }
}
