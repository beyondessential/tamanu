import React, { useState } from 'react';
import Accordion from 'react-native-collapsible/Accordion';
import Header from './Header';
import { VisitOverview } from '../VisitOverview';
import { StyledView } from '../../styled/common';
import { VisitOverviewProps } from '../../interfaces/VisitOverview';

interface AccordionListProps {
  dataArray: VisitOverviewProps[];
}

const AccordionList = ({ dataArray }: AccordionListProps) => {
  const [activeSections, setActiveSections] = useState(new Array());

  const updateSections = (newActiveSection: number[]) => {
    setActiveSections(newActiveSection);
  };

  return (
    <StyledView width={'100%'}>
      <Accordion
        sections={dataArray}
        underlayColor={'transparent'}
        activeSections={activeSections}
        renderHeader={Header}
        renderContent={VisitOverview}
        onChange={updateSections}
      />
    </StyledView>
  );
};

export default AccordionList;
