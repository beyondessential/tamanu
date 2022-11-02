const { RuleTester } = require('eslint');
const rule = require('./no-timestamp-with-timezone');

const ruleTester = new RuleTester({ parserOptions: { ecmaVersion: 2018 } });

ruleTester.run('no-timestamp-with-timezone', rule, {
  valid: [
    {
      // With excluded columns created_at, updated_at, deleted_at
      code: `
      up: async query => {
          await query.createTable('mock_table', {
              created_at: {
                  type: Sequelize.DATE,
                  defaultValue: Sequelize.NOW,
                  allowNull: false,
              },
              updated_at: {
                type: Sequelize.DATE,
              },
              deleted_at: {
                type: Sequelize.DATE,
              },
      })
    }
  `,
    },
    {
      // With non specified sequelize migration util function
      code: `
        up: async query => {
            await query.mockFunction('mock_table', {
                mock_column: {
                    type: Sequelize.DATE,
                    defaultValue: Sequelize.NOW,
                    allowNull: false,
                },
            })
        }
        `,
    },
    {
      // With non DATE type
      code: `
          up: async query => {
              await query.createTable('mock_table', {
                  mock_column: {
                      type: Sequelize.TEXT,
                      allowNull: false,
                  },
              })
          }
          `,
    },
    // Models excluded columns
    {
      code: `
              class MockModel extends Model {
                  static init({ primaryKey, ...options }) {
                    super.init(
                      {
                        createdAt: { type: Sequelize.DATE, allowNull: false },
                        updatedAt: { type: Sequelize.DATE, allowNull: false },
                        deletedAt: { type: Sequelize.DATE, allowNull: true },
                      },
                      options,
                    );
                  }
                }`,
      errors: [
        {
          messageId: 'models',
        },
      ],
    },
  ],
  invalid: [
    // Create table Sequelize.DATE
    {
      code: `
    up: async query => {
        await query.createTable('mock_table', {
            mock_column: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.NOW,
                allowNull: false,
            },
        });
    }
`,
      errors: [
        {
          messageId: 'migrations',
        },
      ],
    },
    // Create table DataTypes.DATE
    {
      code: `
      up: async query => {
          await query.createTable('mock_table', {
              mockColumn: {
                  type: DataTypes.DATE,
              },
          });
      }
  `,
      errors: [
        {
          messageId: 'migrations',
        },
      ],
    },
    // addColumn Sequelize.DATE
    {
      code: `
        up: async query => {
            await query.addColumn('mock_table', 'mock_column', {
                type: Sequelize.DATE,
              });
        }
    `,
      errors: [
        {
          messageId: 'migrations',
        },
      ],
    },
    // change column Sequelize.DATE
    {
      code: `
          up: async query => {
              await query.changeColumn('mock_table', 'mock_column', {
                  type: Sequelize.DATE,
                });
          }
      `,
      errors: [
        {
          messageId: 'migrations',
        },
      ],
    },
    // change column Sequelize.DATEONLY
    {
      code: `
          up: async query => {
              await query.changeColumn('mock_table', 'mock_column', {
                  type: Sequelize.DATEONLY,
                });
          }
      `,
      errors: [
        {
          messageId: 'migrations',
        },
      ],
    },
    // models Sequelize.DATE
    {
      code: `
        class MockModel extends Model {
            static init({ primaryKey, ...options }) {
              super.init(
                {
                  mockColumn: { type: Sequelize.DATE, allowNull: false },
                },
                options,
              );
            }
          }`,
      errors: [
        {
          messageId: 'models',
        },
      ],
    },
    // models DataTypes.DATE
    {
      code: `
          class MockModel extends Model {
              static init({ primaryKey, ...options }) {
                super.init(
                  {
                    mockColumn: { type: DataTypes.DATE, allowNull: false },
                  },
                  options,
                );
              }
            }`,
      errors: [
        {
          messageId: 'models',
        },
      ],
    },
  ],
});
