interface ExampleProps {
  [key: string]: string | Date | number;
  id: string;
  city: string;
  name: string;
  gender: string;
  dateOfBirth: Date;
  lastVisit: Date;
}

export const MaleExampleProps: ExampleProps = {
  id: 'as212654',
  city: 'Mbelagha',
  name: 'Taj Wangdi',
  gender: 'Male',
  lastVisit: new Date(),
  dateOfBirth: new Date(),
};

export const FemaleExampleProps: ExampleProps = {
  id: 'as212654',
  city: 'nguvia',
  name: 'Leinani Tanangada',
  gender: 'female',
  lastVisit: new Date(),
  dateOfBirth: new Date(),
};
