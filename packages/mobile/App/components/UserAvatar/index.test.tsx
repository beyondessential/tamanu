import React from 'react';
import { render } from '@testing-library/react-native';
import { UserAvatar } from './index';
import { getUserInitials } from '../../helpers/user';

describe('<UserAvatar/>', () => {
  const withoutImageProps = {
    name: 'Johnatan Orange',
    gender: 'male',
  };

  const withImageProps = {
    name: 'Johnatan Orange',
    gender: 'male',
    image:
      'https://res.cloudinary.com/dqkhy63yu/image/upload/v1573676957/Ellipse_4.png',
  };

  it(' when no image should render user initials', () => {
    const { getByText } = render(<UserAvatar {...withoutImageProps} />);
    expect(getByText(getUserInitials(withImageProps.name))).not.toBeNull();
  });

  it('when have image should render user initials', () => {
    const { queryByText } = render(<UserAvatar {...withImageProps} />);
    expect(queryByText(getUserInitials(withImageProps.name))).toBeNull();
  });
});
