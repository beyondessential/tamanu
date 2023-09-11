import { QueryTypes } from 'sequelize';

async function setRoleForConnection(connection, roleName) {
  await connection.query(`SET ROLE ${roleName}`);
}

async function resetRoleForConnection(connection) {
  await connection.query('RESET ROLE');
}

export async function performAssumedRoleOperation(context, role, query, replacements) {
  const { sequelize } = context;
  let connection;
  try {
    // Acquire a connection from the pool
    connection = await sequelize.connectionManager.getConnection();

    await setRoleForConnection(connection, role);
    const res = await connection.query('SELECT * from patients', []);
    return res;
  } finally {
    if (connection) {
      await resetRoleForConnection(connection);
      // Release the connection back to the pool
      await sequelize.connectionManager.releaseConnection(connection);
    }
  }
}
