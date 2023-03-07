/** Hack to get around spyOn import * being spec-illegal */
export function spyOnModule(jest, path) {
  jest.mock(path, () => {
    const actualModule = jest.requireActual(path);
    return {
      __esModule: true,
      ...actualModule,
    };
  });
}
