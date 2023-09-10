import { QueryTypes } from 'sequelize';

async function setRoleForConnection(connection, roleName) {
  await connection.query(`SET ROLE ${roleName}`);
}

async function resetRoleForConnection(connection) {
  await connection.query('RESET ROLE');
}

export async function performAssumedRoleOperation(context, query, role) {
  const { sequelize } = context;
  let connection;
  try {
    // Acquire a connection from the pool
    connection = await sequelize.getConnection();

    await setRoleForConnection(connection, role);
    return await connection.query(query, { type: QueryTypes.SELECT });
  } finally {
    if (connection) {
      await resetRoleForConnection(connection);
      // Release the connection back to the pool
      await connection.release();
    }
  }
}
