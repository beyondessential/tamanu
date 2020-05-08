interface ExampleProps {
  [key: string]: string | Date | number;
  id: string;
  city: string;
  name: string;
  gender: string;
  age: number;
  lastVisit: Date;
}

export const MaleExampleProps: ExampleProps = {
  id: 'as212654',
  city: 'Mbelagha',
  name: 'Taj Wangdi',
  gender: 'Male',
  age: 34,
  lastVisit: new Date(),
};

export const FemaleExampleProps: ExampleProps = {
  id: 'as212654',
  city: 'nguvia',
  name: 'Leinani Tanangada',
  gender: 'female',
  age: 15,
  lastVisit: new Date(),
};
