import React, { useMemo, useRef, useEffect, useCallback, ReactElement, useState } from 'react';
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

import { surveyStore } from '../../surveyStore';
import { useCancelableEffect } from '/helpers/hooks';

export const ProgramViewHistoryScreen = ({
  route,
}: ProgramAddDetailsScreenProps): ReactElement => {
  const { program } = route.params;
  const navigation = useNavigation();

  const [responses] = useCancelableEffect([], () => surveyStore.getResponses());

  const responseItems = responses.map((r, i) => (
    <StyledText>{`${r.program.name} - ${r.name}`}</StyledText>
  ));

  return <StyledView>{responseItems}</StyledView>
};
