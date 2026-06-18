import React from 'react';
import { render } from '@testing-library/react-native';
import { UserAvatar, UserAvatarProps } from './index';
import { getUserInitials, Genders } from '/helpers/user';

describe('<UserAvatar/>', () => {
  const makeUserAvatar = (image?: string): UserAvatarProps => ({
    size: 25,
    displayName: 'Name LastName',
    sex: Genders.MALE,
    image,
  });

  const withImageProps = makeUserAvatar(
    'https://res.cloudinary.com/dqkhy63yu/image/upload/v1573676957/Ellipse_4.png',
  );
  const withoutImageProps = makeUserAvatar();

  it(' when no image provided should render user initials', async () => {
    const { getByText } = await render(<UserAvatar {...withoutImageProps} />);
    expect(
      getByText(getUserInitials(withImageProps.displayName!)),
    ).not.toBeNull();
  });

  it('when image is provided should render user initials', async () => {
    const { queryByText } = await render(<UserAvatar {...withImageProps} />);
    expect(
      queryByText(getUserInitials(withImageProps.displayName!)),
    ).toBeNull();
  });

  it('should render "user" when no displayName is provided', async () => {
    const userAvatarWithNoName = makeUserAvatar();
    delete userAvatarWithNoName.displayName;
    const { queryByText } = await render(<UserAvatar {...userAvatarWithNoName} />);
    expect(queryByText('user')).toBeTruthy();
  });
});
