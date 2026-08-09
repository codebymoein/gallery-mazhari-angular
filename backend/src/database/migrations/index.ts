import { CreateOrders1785500000000 } from './1785500000000-CreateOrders';
import { CreateNotificationsAndConsultations1785600000000 } from './1785600000000-CreateNotificationsAndConsultations';
import { AddConsultationPreferenceProfile1785700000000 } from './1785700000000-AddConsultationPreferenceProfile';
import { CreatePasswordResetTokens1785700000000 } from './1785700000000-CreatePasswordResetTokens';
import { CreateCustomRequests1785800000000 } from './1785800000000-CreateCustomRequests';
import { AddCustomRequestContactDetails1785900000000 } from './1785900000000-AddCustomRequestContactDetails';
import { CreateAuthSessions1786000000000 } from './1786000000000-CreateAuthSessions';
import { AddImportBatchReplayProtection1786100000000 } from './1786100000000-AddImportBatchReplayProtection';
import { CreateWeddingPlanners1786200000000 } from './1786200000000-CreateWeddingPlanners';

/**
 * Canonical migration order. Two historical migrations share timestamp
 * 1785700000000; their deployed class names must not be rewritten because
 * TypeORM stores those names in the migrations table. The explicit stable
 * ordering below resolves the ambiguity without replaying an applied migration.
 */
export const ALL_MIGRATIONS = [
  CreateOrders1785500000000,
  CreateNotificationsAndConsultations1785600000000,
  AddConsultationPreferenceProfile1785700000000,
  CreatePasswordResetTokens1785700000000,
  CreateCustomRequests1785800000000,
  AddCustomRequestContactDetails1785900000000,
  CreateAuthSessions1786000000000,
  AddImportBatchReplayProtection1786100000000,
  CreateWeddingPlanners1786200000000,
];
