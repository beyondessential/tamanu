interface ExampleProps {
  [key: string]: string | Date | number;
  city: string;
  name: string;
  gender: string;
  age: number;
  lastVisit: Date;
}

export const MaleExampleProps: ExampleProps = {
  city: 'Mbelagha',
  name: 'Taj Wangdi',
  gender: 'male',
  age: 34,
  lastVisit: new Date(),
};

export const FemaleExampleProps: ExampleProps = {
  city: 'nguvia',
  name: 'Leinani Tanangada',
  gender: 'female',
  age: 15,
  lastVisit: new Date(),
};
