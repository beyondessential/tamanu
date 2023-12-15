import React, { memo, useState, useCallback } from 'react';
import * as yup from 'yup';

import { ASSET_NAMES } from '@tamanu/constants/importable';
import { useApi } from '../../api';
import { Form, Field, SelectField } from '../../components/Field';
import { FileChooserField, FILTER_IMAGES } from '../../components/Field/FileChooserField';
import { ContentPane } from '../../components/ContentPane';
import { FormGrid } from '../../components/FormGrid';
import { ButtonRow } from '../../components/ButtonRow';
import { LargeSubmitButton } from '../../components/Button';
import { AdminViewContainer } from './components/AdminViewContainer';

const ResultDisplay = ({ result }) => {
  if (!result) return null;

  if (result.error) {
    return <div>Error: {result.error.message}.</div>;
  }

  return (
    <div>
      Asset {result.name} successfully {result.action}.
    </div>
  );
};

export const AssetUploaderView = memo(() => {
  const [resetKey, setResetKey] = useState(Math.random());
  const [result, setResult] = useState(null);

  const nameOptions = Object.values(ASSET_NAMES).map(v => ({ label: v, value: v }));

  const api = useApi();
  // const { readFile } = useElectron(); // TODO(web)

  const onSubmitUpload = useCallback(
    async ({ filename, name }) => {
      setResult(null);

      try {
        const contents = new Blob; // await readFile(filename); // TODO(web)
        const data = contents.toString('base64');

        const response = await api.put(`admin/asset/${name}`, {
          filename,
          data,
        });

        setResult(response);
        setResetKey(Math.random());
      } catch (e) {
        setResult({
          action: 'error',
          error: e,
        });
      }
    },
    [api, readFile, setResult, setResetKey],
  );

  return (
    <Form
      key={resetKey}
      onSubmit={onSubmitUpload}
      validationSchema={yup.object().shape({
        name: yup.string().required(),
        filename: yup.string().required(),
      })}
      render={({ isSubmitting }) => (
        <AdminViewContainer title="Asset upload" showLoadingIndicator={isSubmitting}>
          <ContentPane>
            <FormGrid columns={1}>
              <Field
                component={SelectField}
                options={nameOptions}
                label="Select asset"
                name="name"
                required
              />
              <Field
                component={FileChooserField}
                filters={[FILTER_IMAGES]}
                label="Select file"
                name="filename"
                required
              />
              <ButtonRow>
                <LargeSubmitButton text="Import" />
              </ButtonRow>
              <ResultDisplay result={result} />
            </FormGrid>
          </ContentPane>
        </AdminViewContainer>
      )}
    />
  );
});
