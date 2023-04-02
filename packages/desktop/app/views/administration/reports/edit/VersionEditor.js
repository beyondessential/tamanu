import { Box, CircularProgress, Tooltip } from '@material-ui/core';
import { JsonEditor } from 'jsoneditor-react/es';
import React, { useState } from 'react';
import styled from 'styled-components';
import Ajv from 'ajv';
import { toast } from 'react-toastify';
import {
  Button,
  CardDivider,
  CardHeader,
  CardItem,
  formatShort,
  formatTime,
} from '../../../../components';
import { DropdownButton } from '../../../../components/DropdownButton';
import { schema, schemaRefs, templates } from './schema';
import { useAuth } from '../../../../contexts/Auth';

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

const ErrorMessage = styled.div`
  word-break: break-word;
`;

const StyledDropdownButton = styled(DropdownButton)`
  margin-bottom: 20px;
  opacity: ${props => props.$disabled && 0.5};
  pointer-events: ${props => props.$disabled && 'none'};
`;

const VersionInfoCard = styled.div`
  background: white;
  box-shadow: rgba(0, 0, 0, 0.2) 0px 2px 1px -1px, rgba(0, 0, 0, 0.14) 0px 1px 1px 0px,
    rgba(0, 0, 0, 0.12) 0px 1px 3px 0px;
  border-radius: 5px;
  padding: 32px 30px;
`;

const VersionInfo = ({ name, version }) => (
  <VersionInfoCard>
    <CardHeader>
      <CardItem label="Name" value={name} />
      <CardItem label="Version" value={version.versionNumber} />
    </CardHeader>
    <CardDivider />
    <CardItem
      label="Created"
      value={`${formatShort(version.createdAt)} ${formatTime(version.createdAt)}`}
    />
    {version.createdAt !== version.updatedAt && (
      <CardItem label="Updated" value={formatShort(version.updatedAt)} />
    )}
    <CardItem label="Created by" value={version.createdBy?.displayName} />
  </VersionInfoCard>
);

const Error = ({ errorMessage, isCreate }) => (
  <div>
    <b>{isCreate ? 'Create' : 'Update'} version failed</b>
    <ErrorMessage>{errorMessage}</ErrorMessage>
  </div>
);

const SaveButtonLabel = ({ submitting }) => (
  <Box display="flex" alignItems="center">
    {submitting ? 'Saving' : 'Save'}
    {submitting && <InlineProgress size={12} />}
  </Box>
);

export const VersionEditor = ({ report, version, onBack, onSave }) => {
  const { id, updatedAt, createdAt, createdBy, versionNumber, ...editableData } = version;
  const { name } = report;
  const { currentUser } = useAuth();
  const [isValid, setIsValid] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [value, setValue] = useState(editableData);
  const [submitting, setSubmitting] = useState(false);

  // Handle change is debounced by jsoneditor-react
  const handleChange = json => {
    setValue(json);
    if (!dirty) {
      setDirty(true);
    }
    setIsValid(ajv.validate(schema, json));
  };

  const handleReset = () => {
    setDirty(false);
    setValue(null);
    // This has has to be deferred to reload jsoneditor window properly
    setTimeout(() => setValue(editableData), 0);
  };

  const handleSave = async saveAsNewVersion => {
    try {
      setSubmitting(true);
      const versionNum = saveAsNewVersion ? report.versionCount + 1 : versionNumber;
      const payload = {
        ...value,
        ...(saveAsNewVersion && { versionNumber: versionNum, userId: currentUser.id }),
      };
      await onSave(payload, saveAsNewVersion);
      toast.success(
        `Successfully ${saveAsNewVersion ? 'created new' : 'updated'} version ${versionNum}`,
      );
      setDirty(false);
    } catch (err) {
      toast.error(<Error isCreate={saveAsNewVersion} errorMessage={err.message} />);
    } finally {
      setSubmitting(false);
    }
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
                onClick: () => handleSave(false),
              },
              { label: 'Save as new version', onClick: () => handleSave(true) },
            ]}
          />
        </div>
      </Tooltip>
      <DetailList>
        <VersionInfo name={name} version={version} />
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
