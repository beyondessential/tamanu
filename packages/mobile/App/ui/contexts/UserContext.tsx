import React, { createContext, PropsWithChildren, ReactElement } from 'react';
import { compose } from 'redux';
import { withAuth } from '../containers/Auth';
import { WithAuthStoreProps } from '/store/ducks/auth';
import { userRolesOptions } from '../helpers/constants';
import { Genders } from '../helpers/user';
import { useBackendEffect } from '../hooks';

interface UserContextData {
  getUserData: () => Promise<void>;
}

const UserContext = createContext<UserContextData>({} as UserContextData);

const Provider = ({
  token,
  children,
  ...props
}: PropsWithChildren<WithAuthStoreProps>): ReactElement => {
  const [data, error] = useBackendEffect(
    ({ models }) => models.User.getRepository().findOne(),
    [],
  );

  const getUserData = async (): Promise<void> => {
    // makeUserController
    // setUser action
    props.setUser(data);
  };
  return (
    <UserContext.Provider value={{ getUserData }}>
      {children}
    </UserContext.Provider>
  );
};

export const UserProvider = compose(withAuth)(Provider);
export default UserContext;
