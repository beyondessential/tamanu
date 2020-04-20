import React, { useMemo, useRef, useCallback, ReactElement } from 'react';
import { Screen } from './Screen';
import {
  getFormInitialValues,
  getFormSchema,
  mapInputVerticalPosition,
} from './helpers';
import { ProgramAddDetailsScreenProps } from '../../../../../interfaces/screens/ProgramsStack/ProgramAddDetails/ProgramAddDetailsScreenProps';

export const Container = ({
  route,
}: ProgramAddDetailsScreenProps): ReactElement => {
  const { program } = route.params;
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
    console.log(values);
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
