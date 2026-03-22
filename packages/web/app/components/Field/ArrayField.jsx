import React, { useState } from 'react';
import styled from 'styled-components';
import { FieldArray } from 'formik';
import { IconButton } from '@material-ui/core';
import { Add, Remove } from '@material-ui/icons';
import { generate } from 'shortid';
import { Button } from '@tamanu/ui-components';
import { TranslatedText } from '../Translation/TranslatedText';

const AddButton = styled(Button)`
  justify-self: start;
  padding-left: 10px;
  margin-top: -10px;
  margin-bottom: -20px;

  .MuiButton-startIcon {
    margin-right: 0;
  }
  .MuiSvgIcon-root {
    margin-right: 0;
  }
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

export const ArrayField = ({
  form,
  field,
  renderField,
  initialFieldNumber = null,
  maxFields = 4,
}) => {
  const data = initialFieldNumber
    ? Array.from({ length: initialFieldNumber })
    : form.values[field.name];
  // If there are initial values, generate the same number of fields in the ui,
  // otherwise just display one field
  const initialState =
    data?.length > 0 ? data.map(() => ({ id: generate() })) : [{ id: generate() }];

  const [fields, setFields] = useState(initialState);

  return (
    <FieldArray name={field.name} validateOnChange={false} data-testid="fieldarray-a1xx">
      {({ remove }) => (
        <>
          {fields.map(({ id }, index) => {
            // Create the button for removing fields from the array but leave it to the
            // implementor to place the button on the page
            const DeleteButton = (
              <RemoveButton
                color="primary"
                onClick={() => {
                  setFields((currentFields) => currentFields.filter((x) => x.id !== id));
                  remove(index);
                }}
                data-testid={`removebutton-qmfs-${index}`}
              >
                <Remove />
              </RemoveButton>
            );

            return <React.Fragment key={id}>{renderField(index, DeleteButton)}</React.Fragment>;
          })}

          {/* Render the button to add another field below the array of fields */}
          {fields.length < maxFields && (
            <AddButton
              startIcon={<Add />}
              type="button"
              variant="text"
              onClick={() => {
                setFields((currentFields) => [...currentFields, { id: generate() }]);
              }}
              data-testid="addbutton-4ojv"
            >
              <TranslatedText
                stringId="general.action.addAdditional"
                fallback="Add additional"
                data-testid="translatedtext-add-additional"
              />
            </AddButton>
          )}
        </>
      )}
    </FieldArray>
  );
};
