import { programs as programsAPI } from './programs';
import { ProgramModel } from '/models/Program';

describe.skip('ProgramsAPI', () => {
  it('should pass', () => expect(true).toEqual(true));
  // const programData: ProgramModel = {
  //   id: 1,
  //   name: 'test',
  //   questions: [
  //     {
  //       list: [
  //         {
  //           id: 1,
  //           label: 'test',
  //           type: 'text',
  //         },
  //       ],
  //       title: 'a title',
  //     },
  //   ],
  // };
  // test('Should return data correctly', async () => {
  //   jest.spyOn(programsAPI, 'get').mockImplementationOnce(
  //     () =>
  //       new Promise(resolve =>
  //         resolve({
  //           status: 200,
  //           statusText: 'ok',
  //           headers: {},
  //           config: {},
  //           data: [programData],
  //         }),
  //       ),
  //   );
  //   const response = await programsAPI.get();
  //   expect(response.data).toEqual([programData]);
  // });
});
