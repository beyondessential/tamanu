import React, { memo } from 'react';
import styled from 'styled-components';
import { connectApi } from '../../api';
import { Suggester } from '../../utils/suggester';
import { reloadPatient } from '../../store/patient';

const FormContainer = styled.div`
  margin: 1rem 0;
`;

export const InfoPaneAddEditForm = connectApi(
  (api, dispatch, { patient, endpoint, onClose, suggesters = [] }) => ({
    onSubmit: async data => {
      if (data.id) {
        // don't need to include patientId as the existing record will already have it
        await api.put(`${endpoint}/${data.id}`, data);
      } else {
        await api.post(endpoint, { ...data, patientId: patient.id });
      }
      dispatch(reloadPatient(patient.id));
      onClose();
    },
    ...Object.fromEntries(
      Object.entries(suggesters).map(([key, options = {}]) => [
        `${key}Suggester`,
        new Suggester(api, key, options),
      ]),
    ),
  }),
)(
  memo(({ Form, item, onClose, ...restOfProps }) => (
    <FormContainer>
      <Form onCancel={onClose} editedObject={item} {...restOfProps} />
    </FormContainer>
  )),
);
