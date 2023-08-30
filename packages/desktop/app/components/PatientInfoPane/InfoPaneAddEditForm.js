import React, { memo, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import styled from 'styled-components';
import { useApi } from '../../api';
import { Suggester } from '../../utils/suggester';
import {
  CONDITIONS_TITLE,
  ALLERGIES_TITLE,
  FAMILY_HISTORY_TITLE,
  ISSUES_TITLE,
  CARE_PLANS_TITLE,
} from './paneTitles';

const FormContainer = styled.div`
  margin: 1rem 0;
`;

const getSuggesters = (title, items) => {
  switch (title) {
    case CONDITIONS_TITLE:
      return { practitioner: {}, icd10: {} };
    case ALLERGIES_TITLE:
      return { practitioner: {}, allergy: {} };
    case FAMILY_HISTORY_TITLE:
      return { practitioner: {}, icd10: {} };
    case ISSUES_TITLE:
      return {};
    case CARE_PLANS_TITLE:
      return {
        practitioner: {},
        carePlan: {
          filterer: ({ code }) => !items.some(c => c.carePlan.code === code),
        },
      };
    default:
      return {};
  }
};

export const InfoPaneAddEditForm = memo(
  ({ patient, endpoint, onClose, Form, item, title, items }) => {
    const api = useApi();
    const queryClient = useQueryClient();

    const onSubmit = useCallback(
      async data => {
        if (data.id) {
          // don't need to include patientId as the existing record will already have it
          await api.put(`${endpoint}/${data.id}`, data);
        } else {
          await api.post(endpoint, { ...data, patientId: patient.id });
        }

        queryClient.invalidateQueries([`infoPaneListItem-${title}`, patient.id]);
        onClose();
      },
      [api, endpoint, onClose, patient.id, title, queryClient],
    );

    const suggesters = useMemo(
      () =>
        Object.fromEntries(
          Object.entries(getSuggesters(title, items)).map(([key, options = {}]) => [
            `${key}Suggester`,
            new Suggester(api, key, options),
          ]),
        ),
      [api, title, items],
    );

    return (
      <FormContainer>
        <Form
          onCancel={onClose}
          editedObject={item}
          onSubmit={onSubmit}
          patient={patient}
          {...suggesters}
        />
      </FormContainer>
    );
  },
);
