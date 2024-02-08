import Sequelize, { DataTypes } from 'sequelize';

export async function up(query) {
    await query.addColumn('encounter_history', 'barbaz', {
        type: Sequelize.STRING,
        allowNull: true,
        // defaultValue: Sequelize.fn('uuid_generate_v4'), // using uuid_generate_v4 here
    });
}

export async function down(query) {
    await query.removeColumn('encounter_history', 'barbaz');
}
