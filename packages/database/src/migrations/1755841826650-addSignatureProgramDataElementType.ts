import { DatabaseError, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  // This migration can fail if enum_program_data_elements_type already includes Signature
  // so if it fails we can just ignore it
  try {
    await query.sequelize.query("ALTER TYPE enum_program_data_elements_type ADD VALUE 'Signature'");
  } catch (e) {
    if (e instanceof DatabaseError) {
      if (e.message.match(`already exists`)) {
        return;
      }
    }
    // it failed for a different reason - rethrow
    throw e;
  }
}

export async function down(): Promise<void> {
  // Note: PostgreSQL doesn't support removing enum values directly
  // This would require recreating the enum type which is complex and risky
  // For now, we'll leave the value in the enum
}
