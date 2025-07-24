import type { Meta, StoryObj } from '@storybook/react-vite';

import { DashboardView } from '../../views/DashboardView';
import { MockedApi } from '../utils/mockedApi';
import { PrivatePageLayout } from '../../components/layouts/PrivatePageLayout';
import { type AdministeredVaccine } from '@tamanu/shared/schemas/patientPortal/responses/administeredVaccine.schema';
import { type UpcomingVaccination } from '@tamanu/shared/schemas/patientPortal/responses/upcomingVaccination.schema';
import { generateMock } from '@anatine/zod-mock';
import { AdministeredVaccineSchema } from '@tamanu/shared/schemas/patientPortal/responses/administeredVaccine.schema';
import { UpcomingVaccinationSchema } from '@tamanu/shared/schemas/patientPortal/responses/upcomingVaccination.schema';
import { PatientSchema } from '@tamanu/shared/schemas/patientPortal/responses/patient.schema';
import { PatientSurveyAssignmentSchema } from '@tamanu/shared/schemas/patientPortal/responses/patientSurveyAssignment.schema';
import { AppointmentSchema } from '@tamanu/shared/schemas/patientPortal/responses/appointment.schema';
import { OngoingConditionSchema } from '@tamanu/shared/schemas/patientPortal/responses/ongoingCondition.schema';
import { AllergySchema } from '@tamanu/shared/schemas/patientPortal/responses/allergy.schema';
import { OngoingPrescriptionSchema } from '@tamanu/shared/schemas/patientPortal/responses/ongoingPrescription.schema';

// Mock data for patient
const mockPatientData = generateMock(PatientSchema as any);

// Mock data for outstanding forms
const mockFormsData = {
  data: [
    generateMock(PatientSurveyAssignmentSchema as any),
    generateMock(PatientSurveyAssignmentSchema as any),
  ],
  count: 2,
};

// Mock data for appointments
const mockAppointmentsData = {
  data: [generateMock(AppointmentSchema as any)],
  count: 1,
};

// Mock data for ongoing conditions (matching OngoingConditionsSection)
const mockConditionsData = {
  data: [generateMock(OngoingConditionSchema as any), generateMock(OngoingConditionSchema as any)],
  count: 2,
};

// Mock data for allergies (matching AllergiesSection)
const mockAllergiesData = {
  data: [generateMock(AllergySchema as any), generateMock(AllergySchema as any)],
  count: 2,
};

// Mock data for medications (matching MedicationsSection)
const mockMedicationsData = {
  data: [
    generateMock(OngoingPrescriptionSchema as any),
    generateMock(OngoingPrescriptionSchema as any),
  ],
  count: 2,
};

// Mock data for administered vaccines (matching VaccinationsSection)
const mockAdministeredVaccinesData: { data: AdministeredVaccine[]; count: number } = {
  data: [
    generateMock(AdministeredVaccineSchema as any),
    generateMock(AdministeredVaccineSchema as any),
  ],
  count: 2,
};

// Mock data for upcoming vaccines
const mockUpcomingVaccinesData: { data: UpcomingVaccination[]; count: number } = {
  data: [
    generateMock(UpcomingVaccinationSchema as any, { stringMap: { dueDate: () => '2024-01-15' } }),
    generateMock(UpcomingVaccinationSchema as any, { stringMap: { dueDate: () => '2024-02-10' } }),
  ],
  count: 2,
};

const meta: Meta<typeof DashboardView> = {
  title: 'Views/Dashboard',
  component: DashboardView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Complete patient dashboard view showing all sections with patient data including outstanding forms, appointments, patient details, conditions, allergies, medications, and vaccinations.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    Story => (
      <MockedApi
        endpoints={{
          '/me': () => mockPatientData,
          '/me/forms/outstanding': () => mockFormsData,
          '/me/appointments/upcoming': () => mockAppointmentsData,
          '/me/ongoing-conditions': () => mockConditionsData,
          '/me/allergies': () => mockAllergiesData,
          '/me/ongoing-prescriptions': () => mockMedicationsData,
          '/me/vaccinations/administered': () => mockAdministeredVaccinesData,
          '/me/vaccinations/upcoming': () => mockUpcomingVaccinesData,
        }}
      >
        <PrivatePageLayout>
          <Story />
        </PrivatePageLayout>
      </MockedApi>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Default dashboard view with sample data across all sections.',
      },
    },
  },
};

export const EmptyState: Story = {
  decorators: [
    Story => (
      <MockedApi
        endpoints={{
          '/me': () => mockPatientData,
          '/me/forms/outstanding': () => ({ data: [], count: 0 }),
          '/me/appointments/upcoming': () => ({ data: [], count: 0 }),
          '/me/ongoing-conditions': () => ({ data: [], count: 0 }),
          '/me/allergies': () => ({ data: [], count: 0 }),
          '/me/ongoing-prescriptions': () => ({ data: [], count: 0 }),
          '/me/vaccinations/administered': () => ({ data: [], count: 0 }),
          '/me/vaccinations/upcoming': () => ({ data: [], count: 0 }),
        }}
      >
        <Story />
      </MockedApi>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Dashboard view showing empty states across all sections.',
      },
    },
  },
};

export const LoadingState: Story = {
  decorators: [
    Story => (
      <MockedApi
        endpoints={{
          '/me': () => new Promise(() => {}), // Never resolves to show loading state
          '/me/forms/outstanding': () => mockFormsData,
          '/me/appointments/upcoming': () => mockAppointmentsData,
          '/me/ongoing-conditions': () => mockConditionsData,
          '/me/allergies': () => mockAllergiesData,
          '/me/ongoing-prescriptions': () => mockMedicationsData,
          '/me/vaccinations/administered': () => mockAdministeredVaccinesData,
          '/me/vaccinations/upcoming': () => mockUpcomingVaccinesData,
        }}
      >
        <Story />
      </MockedApi>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Dashboard view in loading state while patient data is being fetched.',
      },
    },
  },
};

export const PatientWithNoName: Story = {
  decorators: [
    Story => (
      <MockedApi
        endpoints={{
          '/me': () => ({
            ...mockPatientData,
            firstName: null,
            lastName: null,
          }),
          '/me/forms/outstanding': () => mockFormsData,
          '/me/appointments/upcoming': () => mockAppointmentsData,
          '/me/ongoing-conditions': () => mockConditionsData,
          '/me/allergies': () => mockAllergiesData,
          '/me/ongoing-prescriptions': () => mockMedicationsData,
          '/me/vaccinations/administered': () => mockAdministeredVaccinesData,
          '/me/vaccinations/upcoming': () => mockUpcomingVaccinesData,
        }}
      >
        <Story />
      </MockedApi>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Dashboard view for a patient with missing name data - shows fallback "Hi there 👋".',
      },
    },
  },
};
