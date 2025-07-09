import type { Meta, StoryObj } from '@storybook/react-vite';

import { DashboardView } from '../../views/DashboardView';
import { MockedApi } from '../utils/mockedApi';
import { PrivatePageLayout } from '../../components/layouts/PrivatePageLayout';

// Mock data for patient
const mockPatientData = {
  id: 'patient-1',
  displayId: 'PAT001',
  firstName: 'Sarah',
  lastName: 'Johnson',
  dateOfBirth: '1985-06-15T00:00:00.000Z',
  sex: 'female',
  villageId: 'village-1',
  village: {
    id: 'village-1',
    name: 'Wellington Central',
    code: 'WC001',
    type: 'village',
  },
};

// Mock data for outstanding forms
const mockFormsData = {
  data: [
    {
      id: 'form-1',
      title: 'Annual Health Assessment',
      description: 'Complete your yearly health check questionnaire',
      dueDate: '2024-02-15T00:00:00.000Z',
      priority: 'high',
      formType: 'health-assessment',
      status: 'pending',
      createdAt: '2024-01-15T08:00:00.000Z',
      updatedAt: '2024-01-15T08:00:00.000Z',
    },
    {
      id: 'form-2',
      title: 'Medication Review Form',
      description: 'Review and update your current medications',
      dueDate: '2024-01-20T00:00:00.000Z',
      priority: 'medium',
      formType: 'medication-review',
      status: 'overdue',
      createdAt: '2024-01-10T10:30:00.000Z',
      updatedAt: '2024-01-10T10:30:00.000Z',
    },
  ],
  count: 2,
};

// Mock data for appointments
const mockAppointmentsData = {
  data: [
    {
      id: 'appt-1',
      startTime: '2024-03-15T10:30:00.000Z',
      endTime: '2024-03-15T11:00:00.000Z',
      status: 'Confirmed',
      isHighPriority: false,
      clinician: {
        id: 'clinician-1',
        displayName: 'Dr. Sarah Wilson',
        firstName: 'Sarah',
        lastName: 'Wilson',
      },
      location: {
        id: 'location-1',
        name: 'Room 12',
        locationGroup: {
          id: 'location-group-1',
          name: 'General Practice',
          facility: {
            id: 'facility-1',
            name: 'City Medical Centre',
          },
        },
      },
      locationGroup: {
        id: 'location-group-1',
        name: 'General Practice',
        facility: {
          id: 'facility-1',
          name: 'City Medical Centre',
        },
      },
      appointmentType: {
        id: 'type-1',
        name: 'Follow-up Consultation',
        code: 'FOLLOW_UP',
        type: 'appointmentType',
      },
      bookingType: {
        id: 'booking-1',
        name: 'Standard',
        code: 'STANDARD',
        type: 'bookingType',
      },
    },
  ],
  count: 1,
};

// Mock data for ongoing conditions (matching OngoingConditionsSection)
const mockConditionsData = {
  data: [
    {
      id: 'condition-1',
      note: 'Essential hypertension, well controlled with medication',
      recordedDate: '2023-01-15T10:00:00.000Z',
      resolved: false,
      resolutionDate: null,
      resolutionNote: null,
      patientId: 'patient-1',
      conditionId: 'ref-hypertension',
      examinerId: 'examiner-1',
      resolutionPractitionerId: null,
      condition: {
        id: 'ref-hypertension',
        name: 'Essential Hypertension',
        code: 'I10',
        type: 'diagnosis',
      },
    },
    {
      id: 'condition-2',
      note: 'Type 2 diabetes mellitus, managed with diet and medication',
      recordedDate: '2022-08-20T14:30:00.000Z',
      resolved: false,
      resolutionDate: null,
      resolutionNote: null,
      patientId: 'patient-1',
      conditionId: 'ref-diabetes-t2',
      examinerId: 'examiner-2',
      resolutionPractitionerId: null,
      condition: {
        id: 'ref-diabetes-t2',
        name: 'Type 2 Diabetes Mellitus',
        code: 'E11',
        type: 'diagnosis',
      },
    },
  ],
  count: 2,
};

// Mock data for allergies (matching AllergiesSection)
const mockAllergiesData = {
  data: [
    {
      id: 'allergy-1',
      note: 'Patient experiences skin rash when exposed to penicillin',
      recordedDate: '2023-02-10T09:30:00.000Z',
      patientId: 'patient-1',
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
      patientId: 'patient-1',
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
  ],
  count: 2,
};

// Mock data for medications (matching MedicationsSection)
const mockMedicationsData = {
  data: [
    {
      id: 'medication-1',
      doseAmount: 10,
      units: 'mg',
      frequency: 'twice_daily',
      route: 'oral',
      date: '2024-01-15T00:00:00.000Z',
      startDate: '2024-01-15T08:00:00.000Z',
      indication: 'Hypertension',
      isPrn: false,
      discontinued: false,
      medication: {
        id: 'drug-lisinopril',
        name: 'Lisinopril',
        code: 'lisinopril',
        type: 'drug',
      },
      prescriber: {
        id: 'user-1',
        displayName: 'Dr. Sarah Wilson',
        firstName: 'Sarah',
        lastName: 'Wilson',
      },
    },
    {
      id: 'medication-2',
      doseAmount: 500,
      units: 'mg',
      frequency: 'twice_daily',
      route: 'oral',
      date: '2024-01-10T00:00:00.000Z',
      startDate: '2024-01-10T08:00:00.000Z',
      indication: 'Type 2 Diabetes',
      isPrn: false,
      discontinued: false,
      medication: {
        id: 'drug-metformin',
        name: 'Metformin',
        code: 'metformin',
        type: 'drug',
      },
      prescriber: {
        id: 'user-2',
        displayName: 'Dr. James Chen',
        firstName: 'James',
        lastName: 'Chen',
      },
    },
  ],
  count: 2,
};

// Mock data for administered vaccines (matching VaccinationsSection)
const mockAdministeredVaccinesData = {
  data: [
    {
      id: 'administered-1',
      status: 'GIVEN',
      date: '2023-06-15T09:00:00.000Z',
      batch: 'VAC123',
      injectionSite: 'Left arm',
      vaccineName: null,
      vaccineBrand: null,
      disease: null,
      givenBy: null,
      givenElsewhere: false,
      notGivenReason: null,
      certifiable: true,
      createdAt: '2023-06-15T09:00:00.000Z',
      updatedAt: '2023-06-15T09:00:00.000Z',
      encounterId: 'encounter-1',
      scheduledVaccineId: 'scheduled-1',
      scheduledVaccine: {
        id: 'scheduled-1',
        label: 'COVID-19 Pfizer',
        doseLabel: 'Dose 1',
        category: 'COVID',
        schedule: 'COVID-19',
      },
      encounter: {
        id: 'encounter-1',
        patientId: 'patient-1',
      },
      recorder: {
        id: 'user-1',
        displayName: 'Dr. Jane Smith',
        firstName: 'Jane',
        lastName: 'Smith',
      },
      location: {
        id: 'location-1',
        name: 'Main Hospital',
      },
      department: {
        id: 'department-1',
        name: 'Immunisation Clinic',
      },
    },
  ],
  count: 1,
};

// Mock data for upcoming vaccines
const mockUpcomingVaccinesData = {
  data: [
    {
      id: 'upcoming-1',
      dueDate: '2024-04-15T00:00:00.000Z',
      status: 'DUE',
      scheduledVaccineId: 'scheduled-3',
      scheduledVaccine: {
        id: 'scheduled-3',
        label: 'Annual Flu Shot',
        doseLabel: 'Annual dose',
        category: 'Routine',
        schedule: 'Yearly',
      },
      patientId: 'patient-1',
      createdAt: '2023-12-01T00:00:00.000Z',
      updatedAt: '2023-12-01T00:00:00.000Z',
    },
  ],
  count: 1,
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
          '/patient/me/administeredVaccines': () => mockAdministeredVaccinesData,
          '/patient/me/upcomingVaccinations': () => mockUpcomingVaccinesData,
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
          '/patient/me/administeredVaccines': () => ({ data: [], count: 0 }),
          '/patient/me/upcomingVaccinations': () => ({ data: [], count: 0 }),
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
          '/patient/me/administeredVaccines': () => mockAdministeredVaccinesData,
          '/patient/me/upcomingVaccinations': () => mockUpcomingVaccinesData,
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
          '/patient/me/administeredVaccines': () => mockAdministeredVaccinesData,
          '/patient/me/upcomingVaccinations': () => mockUpcomingVaccinesData,
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
