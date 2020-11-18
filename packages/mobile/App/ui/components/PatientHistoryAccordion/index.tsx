import React, { useState } from 'react';
import Accordion from 'react-native-collapsible/Accordion';
import { StyledView } from '/styled/common';
import Header from './Header';
import { DataDebugView } from '../DataDebugView';

interface AccordionListProps {
  dataArray: VisitOverviewProps[];
}

export const PatientHistoryAccordion = ({
  dataArray,
}: AccordionListProps): JSX.Element => {
  const [activeSections, setActiveSections] = useState<number[]>([]);

  const updateSections = (newActiveSection: number[]): void => {
    setActiveSections(newActiveSection);
  };

  return (
    <StyledView flex={1} width="100%">
      <Accordion
        sections={dataArray}
        underlayColor="transparent"
        activeSections={activeSections}
        renderHeader={Header}
        renderContent={DataDebugView}
        onChange={updateSections}
      />
    </StyledView>
  );
};
