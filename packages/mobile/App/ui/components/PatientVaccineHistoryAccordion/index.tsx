import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Accordion from 'react-native-collapsible/Accordion';
import { StyledView } from '/styled/common';
import { Header } from './Header';
import { Content } from './Content';

export const PatientVaccineHistoryAccordion = ({
  dataArray,
}): JSX.Element => {
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
        renderContent={Content}
        onChange={updateSections}
      />
    </StyledView>
  );
};
