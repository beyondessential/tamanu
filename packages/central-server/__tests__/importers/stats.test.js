import { coalesceStats } from "../../app/admin/stats";

describe('Importer statistics utility functions', () => {

  it('Should coalesce stats correctly', () => {
    const stats = coalesceStats([
        { Foo: { created: 100 } },
        { Foo: { created: 1 } },
        { Bar: { updated: 1 } },
        { Bar: { created: 1 } },
    ]);
    expect(stats).toMatchObject({
        Foo: {
            created: 101,
            updated: 0, // coalesceStats should add this key
        },
        Bar: {
            created: 1,
            updated: 1,
        }
    })
  });
});
