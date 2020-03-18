import React, { FC, ReactElement } from 'react';
import { Button } from '/components/Button';
import { ButtonProps } from './fixture';
import { DotsMenu } from '/components/Icons';


export const DotsMenuButton: FC<ButtonProps> = ({ onPress }: ButtonProps): ReactElement => (
  <Button
    width={80}
    onPress={onPress}
    backgroundColor="transparent"
  >
    <DotsMenu />
  </Button>
);
