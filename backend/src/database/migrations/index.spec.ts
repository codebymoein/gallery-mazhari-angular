import { ALL_MIGRATIONS } from './index';

describe('ALL_MIGRATIONS', () => {
  it('keeps the migration chain explicit and deterministic', () => {
    expect(ALL_MIGRATIONS.map((migration) => migration.name)).toEqual([
      'CreateOrders1785500000000',
      'CreateNotificationsAndConsultations1785600000000',
      'AddConsultationPreferenceProfile1785700000000',
      'CreatePasswordResetTokens1785700000000',
      'CreateCustomRequests1785800000000',
      'AddCustomRequestContactDetails1785900000000',
    ]);
  });

  it('documents the historical duplicate timestamp without renaming applied migrations', () => {
    const duplicateTimestampMigrations = ALL_MIGRATIONS.filter((migration) =>
      migration.name.endsWith('1785700000000'),
    );

    expect(
      duplicateTimestampMigrations.map((migration) => migration.name),
    ).toEqual([
      'AddConsultationPreferenceProfile1785700000000',
      'CreatePasswordResetTokens1785700000000',
    ]);
  });
});
