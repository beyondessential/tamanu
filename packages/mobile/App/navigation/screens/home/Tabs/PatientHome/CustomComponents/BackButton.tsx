import React, { FC, ReactElement } from 'react';
import { Button } from '/components/Button';
import { LeftArrow } from '/components/Icons';
import { ButtonProps } from './fixture';


export const BackButton: FC<ButtonProps> = ({ onPress }: ButtonProps): ReactElement => (
  <Button
    onPress={onPress}
    backgroundColor="transparent"
    width={80}
  >
    <LeftArrow />
  </Button>
);
