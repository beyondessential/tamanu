import { render, screen } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { PatientInitialsIcon } from '../../app/components/PatientInitialsIcon';

const patient = { firstName: 'Sarah', lastName: 'Wallace' };

describe('PatientInitialsIcon', () => {
  it("shows the patient's initials when they have no photo", () => {
    render(<PatientInitialsIcon patient={patient} />);

    expect(screen.getByText('SW')).not.toBeNull();
    expect(screen.queryByTestId('patientphotoavatar')).toBeNull();
  });

  it('shows the initials when the photo could not be loaded', () => {
    render(<PatientInitialsIcon patient={patient} photo={null} />);

    expect(screen.getByText('SW')).not.toBeNull();
  });

  it('shows the photo in place of the initials when the patient has one', () => {
    render(
      <PatientInitialsIcon patient={patient} photo={{ mimeType: 'image/jpeg', data: 'abc123' }} />,
    );

    const image = screen.getByTestId('patientphotoavatar').querySelector('img');
    expect(image.getAttribute('src')).toBe('data:image/jpeg;base64,abc123');
    expect(screen.queryByText('SW')).toBeNull();
  });

  it('keeps the initials when a photo carries no image data', () => {
    render(<PatientInitialsIcon patient={patient} photo={{ mimeType: 'image/jpeg' }} />);

    expect(screen.getByText('SW')).not.toBeNull();
    expect(screen.queryByTestId('patientphotoavatar')).toBeNull();
  });
});
