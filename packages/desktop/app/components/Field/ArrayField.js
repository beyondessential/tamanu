import React, { useState } from 'react';
import styled from 'styled-components';
import { FieldArray } from 'formik';
import { IconButton } from '@material-ui/core';
import { AddCircleOutline, RemoveCircleOutline } from '@material-ui/icons';
import { generate } from 'shortid';
import { Button } from '../Button';

const AddButton = styled(Button)`
  justify-self: start;
  padding-left: 10px;
  margin-top: -10px;
  margin-bottom: -20px;
`;

const RemoveButton = styled(IconButton)`
  position: relative;
  align-self: flex-end;
  margin-right: -8px;
  top: -1px;
  padding: 8px;

  .MuiSvgIcon-root {
    font-size: 20px;
  }
`;

export const ArrayField = ({ field, renderField, maxFields = 4 }) => {
  const [fields, setFields] = useState([{ id: generate() }]);

  return (
    <FieldArray name={field.name} validateOnChange={false}>
      {({ remove }) => (
        <>
          {fields.map(({ id }, index) => {
            // Create the button for removing fields from the array but leave it to the
            // implementor to place the button on the page
            const DeleteButton = (
              <RemoveButton
                color="primary"
                onClick={() => {
                  setFields(currentFields => currentFields.filter(x => x.id !== id));
                  remove(index);
                }}
              >
                <RemoveCircleOutline />
              </RemoveButton>
            );

            return <React.Fragment key={id}>{renderField(index, DeleteButton)}</React.Fragment>;
          })}

          {/* Render the button to add another field below the array of fields */}
          {fields.length < maxFields && (
            <AddButton
              startIcon={<AddCircleOutline />}
              type="button"
              color="primary"
              onClick={() => {
                setFields(currentFields => [...currentFields, { id: generate() }]);
              }}
            >
              Add additional
            </AddButton>
          )}
        </>
      )}
    </FieldArray>
  );
};
