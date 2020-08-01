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

export const Container = ({
  route,
}: ProgramAddDetailsScreenProps): ReactElement => {
  const { program } = route.params;
  const navigation = useNavigation();
  const initialValues = useMemo(() => getFormInitialValues(program), [program]);
  const formValidationSchema = useMemo(() => getFormSchema(program), [program]);
  const containerScrollView = useRef<any>(null);
  const verticalPositions = useMemo(() => mapInputVerticalPosition(program), [
    program,
  ]);
  const scrollTo = useCallback(
    (verticalPosition: { x: number; y: number }) => {
      if (containerScrollView) {
        containerScrollView.current.scrollTo(verticalPosition);
      }
    },
    [containerScrollView],
  );

  const onSubmitForm = useCallback((values: any) => {
    // TODO: submit values to DDD repo
    // setSubmittedValues(values);
    navigation.navigate(
      Routes.HomeStack.ProgramStack.ProgramTabs.ViewHistory,
      {
        program,
      },
    );
  }, []);

  return (
    <Screen
      onSubmitForm={onSubmitForm}
      program={program}
      verticalPositions={verticalPositions}
      containerScrollView={containerScrollView}
      formValidationSchema={formValidationSchema}
      initialValues={initialValues}
      scrollTo={scrollTo}
    />
  );
};
