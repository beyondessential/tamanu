import React, { useState } from 'react';
import Accordion from 'react-native-collapsible/Accordion';
import { StyledView } from '/styled/common';
import { VisitOverviewProps } from '../../interfaces/VisitOverview';
import Header from './Header';
import { VisitOverview } from '../VisitOverview';

interface AccordionListProps {
  dataArray: VisitOverviewProps[];
}

export const AccordionList = ({
  dataArray,
}: AccordionListProps): JSX.Element => {
  const [activeSections, setActiveSections] = useState<number[]>([]);

  const updateSections = (newActiveSection: number[]): void => {
    setActiveSections(newActiveSection);
  };

  return (
    <StyledView width="100%">
      <Accordion
        sections={dataArray}
        underlayColor="transparent"
        activeSections={activeSections}
        renderHeader={Header}
        renderContent={VisitOverview}
        onChange={updateSections}
      />
    </StyledView>
  );
};
