import { Box, CircularProgress, Tooltip } from '@material-ui/core';
import { JsonEditor } from 'jsoneditor-react/es';
import React, { useState } from 'react';
import styled from 'styled-components';
import Ajv from 'ajv';
import { BodyText, Button, Heading4, formatShort, formatTime } from '../../../components';
import { DropdownButton } from '../../../components/DropdownButton';
import { schema, schemaRefs, templates } from './schema';

const ajv = new Ajv({ allErrors: true });

const EditorContainer = styled.div`
  width: 1000px;
  padding-bottom: 30px;
`;

const ButtonContainer = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  > button:first-child {
    margin-right: 10px;
  }
`;

const InlineProgress = styled(CircularProgress)`
  margin-left: 10px;
`;

const DetailList = styled.div`
  & > * {
    margin-bottom: 10px;
  }
`;

const StyledDropdownButton = styled(DropdownButton)`
  margin-bottom: 20px;
  opacity: ${props => props.$disabled && 0.5};
  pointer-events: ${props => props.$disabled && 'none'};
`;

const SaveButtonLabel = ({ submitting }) => (
  <Box display="flex" alignItems="center">
    {submitting ? 'Saving' : 'Save'}
    {submitting && <InlineProgress size={12} />}
  </Box>
);

export const VersionEditor = ({ report, version, onBack }) => {
  const { id, updatedAt, createdAt, createdBy, versionNumber, ...editableData } = version;
  const { name } = report;
  const [isValid, setIsValid] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [value, setValue] = useState(editableData);
  const [submitting, setSubmitting] = useState(false);

  const handleSave = async () => {
    setSubmitting(true);
  };

  const handleSaveAsNewVersion = async () => {
    setSubmitting(true);
  };

  // Handle change is debounced by jsoneditor-react
  const handleChange = json => {
    setValue(json);
    setDirty(JSON.stringify(json) !== JSON.stringify(editableData));
    setIsValid(ajv.validate(schema, json));
  };

  const handleReset = () => {
    setValue(null);
    setDirty(false);
    // This has has to be deferred to reload content properly
    setTimeout(() => setValue(editableData), 0);
  };

  return (
    <EditorContainer>
      <ButtonContainer>
        <Button variant="outlined" onClick={onBack}>
          Back
        </Button>
        <Button variant="outlined" onClick={handleReset}>
          Reset
        </Button>
      </ButtonContainer>
      <Tooltip
        disableHoverListener={isValid && dirty}
        title={!dirty ? 'No changes to json' : !isValid && 'Please fix any errors before saving.'}
        placement="top"
        arrow
      >
        <div style={{ width: 'fit-content' }}>
          <StyledDropdownButton
            variant="outlined"
            $disabled={!isValid || !dirty}
            actions={[
              {
                label: <SaveButtonLabel submitting={submitting} />,
                onClick: handleSave,
              },
              { label: 'Save as new version', onClick: handleSaveAsNewVersion },
            ]}
          />
        </div>
      </Tooltip>
      <DetailList>
        <Heading4>{name}</Heading4>
        <BodyText>Version: {versionNumber}</BodyText>
        <BodyText>Created by: {createdBy.displayName}</BodyText>
        <BodyText>
          Created at: {formatShort(createdAt)} {formatTime(createdAt)}
          {createdAt !== updatedAt &&
            `, last updated: ${formatShort(updatedAt)} ${formatTime(updatedAt)}`}
        </BodyText>
        {value && (
          <JsonEditor
            schema={schema}
            schemaRefs={schemaRefs}
            ajv={ajv}
            value={value}
            onChange={handleChange}
            allowSchemaSuggestions
            mainMenuBar={false}
            templates={templates}
          />
        )}
      </DetailList>
    </EditorContainer>
  );
};
