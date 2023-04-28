import React from 'react';
import styled from 'styled-components';
import { Colors } from '../../../constants';
import { Button, DateDisplay } from '../../../components';

const Card = styled.div`
  padding: 20px 30px;
  background: ${Colors.white};
  border: 1px solid ${Colors.outline}};
  border-radius: 5px;
  display: flex;
  flex-wrap: wrap;
`;

const SectionWithBorder = styled.div`
  width: 50%;
  border-right: 1px solid ${Colors.outline};
`;

const Section = styled.div`
  width: 50%;
  padding-left: 30px;
`;

const Result = styled.div`
  margin-bottom: 12px;
`;

const Title = styled.div`
  font-size: 14px;
  color: ${Colors.midText};
`;

const Value = styled.div`
  font-size: 14px;
  color: ${Colors.darkestText};
  font-weight: 500;
`;

const HorizontalDivider = styled.div`
  width: 100%;
  height: 1px;
  background: ${Colors.outline};
  margin-top: 30px;
  margin-bottom: 30px;
`;

const ButtonWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
`;

export const LabResultReadOnlyCard = ({ labTest, onClose }) => {
  const { result, completedDate, laboratoryOfficer, labTestMethod, verification } = labTest;
  return (
    <>
      <Card>
        <SectionWithBorder>
          <Result>
            <Title>Result</Title>
            <Value>{result}</Value>
          </Result>
          <Result>
            <Title>Laboratory officer</Title>
            <Value>{laboratoryOfficer}</Value>
          </Result>
        </SectionWithBorder>
        <Section>
          <Result>
            <Title>Completed</Title>
            <Value>
              <DateDisplay date={completedDate} showTime />
            </Value>
          </Result>
          <Result>
            <Title>Test Method</Title>
            <Value>{labTestMethod?.name}</Value>
          </Result>
        </Section>
        <Result>
          <Title>Verification</Title>
          <Value>{verification}</Value>
        </Result>
      </Card>
      <HorizontalDivider />
      <ButtonWrapper>
        <Button onClick={onClose}>Close</Button>
      </ButtonWrapper>
    </>
  );
};
