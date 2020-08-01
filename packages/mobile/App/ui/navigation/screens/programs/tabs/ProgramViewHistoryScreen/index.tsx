import React, { useMemo, useRef, useCallback, ReactElement, useState } from 'react';
import { Screen } from './Screen';
import {
  getFormInitialValues,
  getFormSchema,
  mapInputVerticalPosition,
} from './helpers';
import { ProgramAddDetailsScreenProps } from '/interfaces/screens/ProgramsStack/ProgramAddDetails/ProgramAddDetailsScreenProps';
import { useNavigation } from '@react-navigation/native';
import { Routes } from '/helpers/routes';

import { StyledView, StyledText } from '/styled/common';

export const ProgramViewHistoryScreen = ({
  route,
}: ProgramAddDetailsScreenProps): ReactElement => {
  const { program } = route.params;
  const navigation = useNavigation();

  // TODO: read values from DDD repo

  return <StyledText>This is where a list of submitted surveys goes.</StyledText>
};
