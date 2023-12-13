import { ArrowForwardIcon } from '/components/Icons';
import { Separator } from '/components/Separator';
import { PatientParentsDataProps } from '/interfaces/PatientDetails';
import { RowView, StyledView } from '/styled/common';
import { theme } from '/styled/theme';
import React, { ReactElement } from 'react';
import { InformationBox } from './InformationBox';
import { PatientSection } from './PatientSection';

interface FamilyInformationProps extends PatientParentsDataProps {
  onEdit: () => void;
}

export const FamilyInformation = (
  props: FamilyInformationProps,
): ReactElement => (
  <PatientSection
    onEdit={props.onEdit}
    title="Family Information"
  >
    <StyledView marginTop={20}>
      <RowView alignItems="center" justifyContent="space-between">
        <InformationBox title="Mother" info={props.parentsInfo.motherName} />
        <ArrowForwardIcon size={15} fill={theme.colors.TEXT_SOFT} />
      </RowView>
    </StyledView>
    <Separator marginTop={10} marginBottom={10} width={370} />
    <StyledView>
      <RowView alignItems="center" justifyContent="space-between">
        <InformationBox title="Father" info={props.parentsInfo.fatherName} />
        <ArrowForwardIcon size={15} fill={theme.colors.TEXT_SOFT} />
      </RowView>
    </StyledView>
  </PatientSection>
);
