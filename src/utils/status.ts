import { daysBetweenIso, todayIso } from './date';
import type { ChecklistState, DocumentState, MaintenanceState, OilChange, Vehicle } from '../types';

const KM_ATTENTION_THRESHOLD = 300;
const DAYS_ATTENTION_THRESHOLD = 15;

const CHECKLIST_ATTENTION_DAYS = 5;
const CHECKLIST_LATE_DAYS = 7;

const DOCUMENT_ATTENTION_DAYS = 30;

export function getOilChangeState(vehicle: Vehicle, lastOilChange: OilChange | null): MaintenanceState {
  if (!lastOilChange) {
    return { urgency: 'sem_registro', kmRemaining: null, daysRemaining: null };
  }

  const kmRemaining = lastOilChange.nextDueOdometer - vehicle.odometer;
  const daysRemaining = daysBetweenIso(todayIso(), lastOilChange.nextDueDate);

  if (kmRemaining <= 0 || daysRemaining <= 0) {
    return { urgency: 'vencida', kmRemaining, daysRemaining };
  }
  if (kmRemaining <= KM_ATTENTION_THRESHOLD || daysRemaining <= DAYS_ATTENTION_THRESHOLD) {
    return { urgency: 'atencao', kmRemaining, daysRemaining };
  }
  return { urgency: 'ok', kmRemaining, daysRemaining };
}

export function getChecklistState(lastChecklistDate: string | null): ChecklistState {
  if (!lastChecklistDate) {
    return { urgency: 'sem_registro', daysSinceLast: null };
  }

  const daysSinceLast = daysBetweenIso(lastChecklistDate, todayIso());

  if (daysSinceLast > CHECKLIST_LATE_DAYS) {
    return { urgency: 'atrasado', daysSinceLast };
  }
  if (daysSinceLast >= CHECKLIST_ATTENTION_DAYS) {
    return { urgency: 'atencao', daysSinceLast };
  }
  return { urgency: 'ok', daysSinceLast };
}

export function getDocumentState(dueDate: string | null): DocumentState {
  if (!dueDate) {
    return { urgency: 'sem_registro', daysRemaining: null };
  }

  const daysRemaining = daysBetweenIso(todayIso(), dueDate);

  if (daysRemaining <= 0) {
    return { urgency: 'vencido', daysRemaining };
  }
  if (daysRemaining <= DOCUMENT_ATTENTION_DAYS) {
    return { urgency: 'atencao', daysRemaining };
  }
  return { urgency: 'ok', daysRemaining };
}

export function worstDocumentState(a: DocumentState, b: DocumentState): DocumentState {
  const rank: Record<DocumentState['urgency'], number> = {
    vencido: 3,
    atencao: 2,
    ok: 1,
    sem_registro: 0,
  };
  return rank[a.urgency] >= rank[b.urgency] ? a : b;
}
