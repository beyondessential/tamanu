import React, { ReactElement } from 'react';
import { PatientParentsDataProps } from '/interfaces/PatientDetails';
import { StyledView, RowView } from '/styled/common';
import { Separator } from '/components/Separator';
import { InformationBox } from './InformationBox';
import { ArrowForward } from '/components/Icons';
import { theme } from '/styled/theme';
import { PatientSection } from './PatientSection';

interface FamilyInformationProps extends PatientParentsDataProps {
  onEdit: () => void;
}

export const FamilyInformation = (
  props: FamilyInformationProps,
): ReactElement => (
  <PatientSection
    hasSeparator={false}
    onEdit={props.onEdit}
    title="Family Information"
  >
    <StyledView marginTop={20}>
      <RowView alignItems="center" justifyContent="space-between">
        <InformationBox title="Mother" info={props.parentsInfo.motherName} />
        <ArrowForward size={15} fill={theme.colors.TEXT_SOFT} />
      </RowView>
    </StyledView>
    <Separator marginTop={10} marginBottom={10} width={370} />
    <StyledView>
      <RowView alignItems="center" justifyContent="space-between">
        <InformationBox title="Father" info={props.parentsInfo.fatherName} />
        <ArrowForward size={15} fill={theme.colors.TEXT_SOFT} />
      </RowView>
    </StyledView>
  </PatientSection>
);
