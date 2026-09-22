import { listVehicles } from '../db/vehicles';
import { getLastOilChange } from '../db/oilChanges';
import { getLastChecklist } from '../db/checklists';
import { getOilChangeState, getChecklistState, getDocumentState } from '../utils/status';
import type { ChecklistState, DocumentState, MaintenanceState } from '../types';

export interface NextMaintenanceInfo {
  vehicleId: string;
  vehicleName: string;
  title: string;
  detail: string;
}

interface Candidate extends NextMaintenanceInfo {
  rank: number;
  urgencyScore: number;
}

const URGENCY_RANK = {
  ok: 0,
  sem_registro: 1,
  atencao: 2,
  overdue: 3,
} as const;

function rankOf(urgency: string): number {
  if (urgency === 'ok') return URGENCY_RANK.ok;
  if (urgency === 'sem_registro') return URGENCY_RANK.sem_registro;
  if (urgency === 'atencao') return URGENCY_RANK.atencao;
  return URGENCY_RANK.overdue; // vencida | atrasado | vencido
}

function oilDetail(state: MaintenanceState): string {
  if (state.urgency === 'sem_registro') return 'Nunca registrado — faça a primeira troca de óleo';
  if (state.urgency === 'vencida') return 'Troca de óleo vencida';
  if (state.kmRemaining != null && state.daysRemaining != null) {
    return `Faltam ${Math.max(state.kmRemaining, 0)} km ou ${Math.max(state.daysRemaining, 0)} dias`;
  }
  return 'Atenção com a troca de óleo';
}

function checklistDetail(state: ChecklistState): string {
  if (state.urgency === 'sem_registro') return 'Nenhum checklist feito ainda — faça o primeiro';
  if (state.urgency === 'atrasado') return `Atrasado há ${state.daysSinceLast} dias`;
  return `Já fazem ${state.daysSinceLast} dias`;
}

function documentDetail(state: DocumentState, label: string): string {
  if (state.urgency === 'sem_registro') return `${label} não cadastrado`;
  if (state.urgency === 'vencido') return `${label} vencido`;
  return `${label} vence em ${state.daysRemaining} dias`;
}

export async function computeNextMaintenance(): Promise<NextMaintenanceInfo | null> {
  const vehicles = await listVehicles();
  const candidates: Candidate[] = [];

  for (const vehicle of vehicles) {
    const [lastOilChange, lastChecklist] = await Promise.all([
      getLastOilChange(vehicle.id),
      getLastChecklist(vehicle.id),
    ]);

    const oilState = getOilChangeState(vehicle, lastOilChange);
    if (oilState.urgency !== 'ok') {
      candidates.push({
        vehicleId: vehicle.id,
        vehicleName: vehicle.name,
        title: 'Troca de óleo',
        detail: oilDetail(oilState),
        rank: rankOf(oilState.urgency),
        urgencyScore: oilState.daysRemaining ?? oilState.kmRemaining ?? 0,
      });
    }

    const checklistState = getChecklistState(lastChecklist?.date ?? null);
    if (checklistState.urgency !== 'ok') {
      candidates.push({
        vehicleId: vehicle.id,
        vehicleName: vehicle.name,
        title: 'Checklist semanal',
        detail: checklistDetail(checklistState),
        rank: rankOf(checklistState.urgency),
        urgencyScore: -(checklistState.daysSinceLast ?? 0),
      });
    }

    const ipvaState = getDocumentState(vehicle.ipvaDueDate);
    if (ipvaState.urgency !== 'ok') {
      candidates.push({
        vehicleId: vehicle.id,
        vehicleName: vehicle.name,
        title: 'IPVA',
        detail: documentDetail(ipvaState, 'IPVA'),
        rank: rankOf(ipvaState.urgency),
        urgencyScore: ipvaState.daysRemaining ?? 0,
      });
    }

    const licensingState = getDocumentState(vehicle.licensingDueDate);
    if (licensingState.urgency !== 'ok') {
      candidates.push({
        vehicleId: vehicle.id,
        vehicleName: vehicle.name,
        title: 'Licenciamento',
        detail: documentDetail(licensingState, 'Licenciamento'),
        rank: rankOf(licensingState.urgency),
        urgencyScore: licensingState.daysRemaining ?? 0,
      });
    }
  }

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => b.rank - a.rank || a.urgencyScore - b.urgencyScore);
  const [best] = candidates;
  return { vehicleId: best.vehicleId, vehicleName: best.vehicleName, title: best.title, detail: best.detail };
}
