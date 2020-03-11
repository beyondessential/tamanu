import React, { ReactElement } from 'react';
import { Button } from '../../../../../components/Button';
import { theme } from '../../../../../styled/theme';
import { TouchableProps } from '../../../../../interfaces/TouchableProps';


export const EditButton = ({ onPress }: TouchableProps): ReactElement => (
  <Button
    textColor={theme.colors.TEXT_SUPER_DARK}
    backgroundColor="#EEEEEE"
    width={62}
    height={34}
    buttonText="Edit"
    onPress={onPress}
  />
);
