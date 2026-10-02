import React from 'react';
import { render } from '@testing-library/react-native';
import { UserAvatar, type UserAvatarProps } from './index';
import { getUserInitials, Genders } from '/helpers/user';

describe('<UserAvatar/>', () => {
  const makeUserAvatar = (): UserAvatarProps => ({
    size: 25,
    displayName: 'Name LastName',
    sex: Genders.MALE,
  });

  it('should render user initials', async () => {
    const props = makeUserAvatar();
    const { getByText } = await render(<UserAvatar {...props} />);
    expect(getByText(getUserInitials(props.displayName))).not.toBeNull();
  });

  it('should render "user" when no displayName is provided', async () => {
    const userAvatarWithNoName = makeUserAvatar();
    delete userAvatarWithNoName.displayName;
    const { queryByText } = await render(<UserAvatar {...userAvatarWithNoName} />);
    expect(queryByText('user')).toBeTruthy();
  });
});
