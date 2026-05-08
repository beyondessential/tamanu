import { DataTypes } from 'sequelize';

export async function up(query) {	
  await query.addColumn('encounters', 'discharge_draft', {	
    type: DataTypes.JSONB,	
    allowNull: true,
  });	
}	

export async function down(query) {	
  await query.removeColumn('encounters', 'discharge_draft');	
}	
