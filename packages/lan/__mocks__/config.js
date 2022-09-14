const actual = jest.requireActual('config');
const foo = {
  ...actual,
  serverFacilityId: 'ref/facility/ba',
};
export default foo;
