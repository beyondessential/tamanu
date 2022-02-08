import React, { useState } from 'react';
import styled from 'styled-components';
import MuiBox from '@material-ui/core/Box';
import { Button, OutlinedButton } from '../Button';
import { Form } from './Form';

const Box = styled(MuiBox)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 30px;
  padding-top: 24px;
  margin-left: -32px;
  margin-right: -32px;
  margin-bottom: -6px;
  padding-left: 32px;
  padding-right: 32px;
  border-top: 1px solid #dedede;
`;

export const PaginatedFormActions = ({ onStepBack, onStepForward, submitForm, isLast }) => {
  return (
    <Box>
      <OutlinedButton onClick={onStepBack || undefined} disabled={!onStepBack}>
        Back
      </OutlinedButton>
      {isLast ? (
        <Button color="primary" variant="contained" onClick={submitForm}>
          Submit
        </Button>
      ) : (
        <Button color="primary" variant="contained" onClick={onStepForward}>
          Continue
        </Button>
      )}
    </Box>
  );
};

export const PaginatedForm = ({ children, onSubmit, renderFormActions, Stepper }) => {
  const [screenIndex, setScreenIndex] = useState(0);

  const onStepBack = () => {
    setScreenIndex(screenIndex - 1);
  };

  const onStepForward = () => {
    setScreenIndex(screenIndex + 1);
  };

  const handleStep = step => () => {
    setScreenIndex(step);
  };

  const isLast = React.Children.toArray(children).length - 1 === screenIndex;

  return (
    <div>
      {Stepper && Stepper}
      <Form
        onSubmit={onSubmit}
        render={({ submitForm }) => (
          <>
            {React.Children.map(children, (child, i) => (i === screenIndex ? child : null))}
            {renderFormActions ? (
              renderFormActions({
                onStepBack,
                onStepForward,
                screenIndex,
                isLast,
                submitForm,
              })
            ) : (
              <PaginatedFormActions
                onStepBack={onStepBack}
                onStepForward={onStepForward}
                isLast={isLast}
                submitForm={submitForm}
              />
            )}
          </>
        )}
      />
    </div>
  );
};
