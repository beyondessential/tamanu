import type { Meta, StoryObj } from '@storybook/react-vite';

import { DashboardView } from '../../views/DashboardView';
import { MockedApi } from '../utils/mockedApi';
import { PrivatePageLayout } from '../../components/layouts/PrivatePageLayout';
import { type AdministeredVaccine } from '@tamanu/shared/schemas/responses/administeredVaccine.schema';
import { type UpcomingVaccine } from '@tamanu/shared/schemas/responses/upcomingVaccine.schema';
import { generateMock } from '@anatine/zod-mock';
import { AdministeredVaccineSchema } from '@tamanu/shared/schemas/responses/administeredVaccine.schema';
import { UpcomingVaccineSchema } from '@tamanu/shared/schemas/responses/upcomingVaccine.schema';
import { PatientSchema } from '@tamanu/shared/schemas/responses/patient.schema';
import { OutstandingFormSchema } from '@tamanu/shared/schemas/responses/outstandingForm.schema';
import { AppointmentSchema } from '@tamanu/shared/schemas/responses/appointment.schema';
import { OngoingConditionSchema } from '@tamanu/shared/schemas/responses/ongoingCondition.schema';
import { AllergySchema } from '@tamanu/shared/schemas/responses/allergy.schema';
import { MedicationSchema } from '@tamanu/shared/schemas/responses/medication.schema';

// Mock data for patient
const mockPatientData = generateMock(PatientSchema as any);

// Mock data for outstanding forms
const mockFormsData = {
  data: [generateMock(OutstandingFormSchema as any), generateMock(OutstandingFormSchema as any)],
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
  data: [generateMock(MedicationSchema as any), generateMock(MedicationSchema as any)],
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
const mockUpcomingVaccinesData: { data: UpcomingVaccine[]; count: number } = {
  data: [
    generateMock(UpcomingVaccineSchema as any, { stringMap: { dueDate: () => '2024-01-15' } }),
    generateMock(UpcomingVaccineSchema as any, { stringMap: { dueDate: () => '2024-02-10' } }),
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
          '/patient/me': () => mockPatientData,
          '/patient/me/outstanding-forms': () => mockFormsData,
          '/patient/me/appointments': () => mockAppointmentsData,
          '/patient/me/ongoing-conditions': () => mockConditionsData,
          '/patient/me/allergies': () => mockAllergiesData,
          '/patient/me/medications': () => mockMedicationsData,
          '/patient/me/vaccinations/administered': () => mockAdministeredVaccinesData,
          '/patient/me/vaccinations/upcoming': () => mockUpcomingVaccinesData,
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
          '/patient/me': () => mockPatientData,
          '/patient/me/outstanding-forms': () => ({ data: [], count: 0 }),
          '/patient/me/appointments': () => ({ data: [], count: 0 }),
          '/patient/me/ongoing-conditions': () => ({ data: [], count: 0 }),
          '/patient/me/allergies': () => ({ data: [], count: 0 }),
          '/patient/me/medications': () => ({ data: [], count: 0 }),
          '/patient/me/vaccinations/administered': () => ({ data: [], count: 0 }),
          '/patient/me/vaccinations/upcoming': () => ({ data: [], count: 0 }),
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
          '/patient/me': () => new Promise(() => {}), // Never resolves to show loading state
          '/patient/me/outstanding-forms': () => mockFormsData,
          '/patient/me/appointments': () => mockAppointmentsData,
          '/patient/me/ongoing-conditions': () => mockConditionsData,
          '/patient/me/allergies': () => mockAllergiesData,
          '/patient/me/medications': () => mockMedicationsData,
          '/patient/me/vaccinations/administered': () => mockAdministeredVaccinesData,
          '/patient/me/vaccinations/upcoming': () => mockUpcomingVaccinesData,
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
          '/patient/me': () => ({
            ...mockPatientData,
            firstName: null,
            lastName: null,
          }),
          '/patient/me/outstanding-forms': () => mockFormsData,
          '/patient/me/appointments': () => mockAppointmentsData,
          '/patient/me/ongoing-conditions': () => mockConditionsData,
          '/patient/me/allergies': () => mockAllergiesData,
          '/patient/me/medications': () => mockMedicationsData,
          '/patient/me/vaccinations/administered': () => mockAdministeredVaccinesData,
          '/patient/me/vaccinations/upcoming': () => mockUpcomingVaccinesData,
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
