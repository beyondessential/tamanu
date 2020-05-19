import React, { createContext, PropsWithChildren, ReactElement } from 'react';
import { compose } from 'redux';
import { withAuth } from '../containers/Auth';
import { WithAuthStoreProps } from '/store/ducks/auth';
import { userRolesOptions } from '../helpers/constants';
import { Genders } from '../helpers/user';

interface UserContextData {
  getUserData: () => Promise<void>;
}

const UserContext = createContext<UserContextData>({} as UserContextData);

const Provider = ({
  token,
  children,
  ...props
}: PropsWithChildren<WithAuthStoreProps>): ReactElement => {
  const getUserData = async (): Promise<void> => {
    // makeUserController
    // setUser action
    props.setUser({
      id: 0,
      displayName: 'Tony Smith',
      email: 'tony@email.com',
      role: userRolesOptions[0].value,
      gender: Genders.MALE,
    });
  };
  return (
    <UserContext.Provider value={{ getUserData }}>
      {children}
    </UserContext.Provider>
  );
};

export const UserProvider = compose(withAuth)(Provider);
export default UserContext;
