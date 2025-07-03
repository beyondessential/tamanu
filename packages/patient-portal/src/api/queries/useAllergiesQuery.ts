import { useQuery } from '@tanstack/react-query';
import { AllergiesArraySchema, type Allergy } from '@tamanu/shared/dtos/responses/AllergySchema';
import { useApi } from '../useApi';
import { useAuth } from '@auth/useAuth';

const USE_MOCK_DATA = false;

const mockAllergiesData = {
  data: [
    {
      id: 'allergy-1',
      note: 'Patient experiences skin rash when exposed to penicillin',
      recordedDate: '2023-02-10T09:30:00.000Z',
      patientId: 'patient-123',
      practitionerId: 'practitioner-1',
      allergyId: 'ref-penicillin',
      reactionId: 'ref-rash',
      allergy: {
        id: 'ref-penicillin',
        name: 'Penicillin',
        code: 'PENICILLIN',
        type: 'allergy',
      },
      reaction: {
        id: 'ref-rash',
        name: 'rash',
        code: 'RASH',
        type: 'allergic-reaction',
      },
    },
    {
      id: 'allergy-2',
      note: 'Severe anaphylactic reaction to aspirin reported by patient',
      recordedDate: '2022-11-20T14:15:00.000Z',
      patientId: 'patient-123',
      practitionerId: 'practitioner-2',
      allergyId: 'ref-aspirin',
      reactionId: 'ref-anaphylaxis',
      allergy: {
        id: 'ref-aspirin',
        name: 'Aspirin',
        code: 'ASPIRIN',
        type: 'allergy',
      },
      reaction: {
        id: 'ref-anaphylaxis',
        name: 'anaphylaxis',
        code: 'ANAPHYLAXIS',
        type: 'allergic-reaction',
      },
    },
    {
      id: 'allergy-3',
      note: 'Food allergy causing digestive issues',
      recordedDate: '2023-05-08T11:45:00.000Z',
      patientId: 'patient-123',
      practitionerId: 'practitioner-1',
      allergyId: 'ref-shellfish',
      reactionId: 'ref-digestive',
      allergy: {
        id: 'ref-shellfish',
        name: 'Shellfish',
        code: 'SHELLFISH',
        type: 'allergy',
      },
      reaction: {
        id: 'ref-digestive',
        name: 'digestive issues',
        code: 'DIGESTIVE',
        type: 'allergic-reaction',
      },
    },
  ],
  count: 3,
};

const transformData = (response: { data: unknown; count: number }): Allergy[] => {
  if (!response?.data) {
    return [];
  }

  const parsedData = AllergiesArraySchema.parse(response.data);
  return parsedData;
};

export const useAllergiesQuery = () => {
  const api = useApi();
  const { user } = useAuth();

  return useQuery<{ data: unknown; count: number }, Error, Allergy[]>({
    queryKey: ['allergies', user?.id],
    queryFn: USE_MOCK_DATA
      ? () => Promise.resolve(mockAllergiesData)
      : () => api.get('/patient/me/allergies'),
    enabled: !!user?.id,
    select: transformData,
  });
};
