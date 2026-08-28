import { useQuery } from '@tanstack/react-query';
import { groupBy } from 'es-toolkit/compat';
import { Database } from '~/infra/db';
import { PatientFieldDefinition } from '~/models/PatientFieldDefinition';
import { PatientFieldValue } from '~/models/PatientFieldValue';
import { PatientAdditionalData } from '~/models/PatientAdditionalData';
import { patientKeys } from './queries/queryKeys';

export type CustomPatientFieldValues = {
  [key: string]: PatientFieldValue[];
};

const loadPatientAdditionalData = async (patientId: string) => {
  const { models } = Database;
  const [record, fieldDefinitions, fieldValues] = (await Promise.all([
    models.PatientAdditionalData.find({
      where: {
        patient: { id: patientId },
      },
    }),
    models.PatientFieldDefinition.findVisible({
      relations: ['category'],
      order: {
        // Nested ordering only works with typeorm version > 0.3.0
        // category: { name: 'DESC' },
        name: 'DESC',
      },
    }),
    models.PatientFieldValue.find({
      where: { patient: { id: patientId } },
    }),
  ])) as [PatientAdditionalData[], PatientFieldDefinition[], PatientFieldValue[]];

  return {
    // Since nested ordering does not work on typeorm version < 0.3.0
    // we sort the categories on the frontend using .sort()
    customPatientSections: Object.entries(
      groupBy(
        fieldDefinitions.sort((a, b) => a.category?.name.localeCompare(b.category?.name)),
        'categoryId',
      ),
    ),
    customPatientFieldDefinitions: fieldDefinitions,
    customPatientFieldValues: groupBy(fieldValues, 'definitionId') as CustomPatientFieldValues,
    patientAdditionalData: record?.[0] ?? null,
  };
};

export const usePatientAdditionalData = (
  patientId: string | undefined,
): {
  customPatientSections: [string, PatientFieldDefinition[]][];
  customPatientFieldDefinitions: PatientFieldDefinition[];
  customPatientFieldValues: CustomPatientFieldValues;
  patientAdditionalData: PatientAdditionalData;
  loading: boolean;
  error: Error | null;
} => {
  const { data, error, isPending } = useQuery({
    queryKey: patientKeys.additionalData(patientId),
    queryFn: () => loadPatientAdditionalData(patientId),
    enabled: Boolean(patientId),
  });

  return {
    customPatientSections: data?.customPatientSections ?? [],
    customPatientFieldDefinitions: data?.customPatientFieldDefinitions ?? [],
    customPatientFieldValues: data?.customPatientFieldValues ?? {},
    patientAdditionalData: data?.patientAdditionalData ?? null,
    loading: Boolean(patientId) && isPending,
    error,
  };
};
