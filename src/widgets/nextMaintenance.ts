import { listVehicles } from '../db/vehicles';
import { getLastOilChange } from '../db/oilChanges';
import { getLastChecklist } from '../db/checklists';
import { getOilChangeState, getChecklistState } from '../utils/status';
import type { ChecklistState, MaintenanceState } from '../types';

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

const URGENCY_RANK: Record<string, number> = {
  sem_registro: 0,
  ok: 1,
  atencao: 2,
  vencida: 3,
  atrasado: 3,
  vencido: 3,
};

function oilDetail(state: MaintenanceState): string {
  if (state.urgency === 'vencida') return 'Troca de óleo vencida';
  if (state.kmRemaining != null && state.daysRemaining != null) {
    return `Faltam ${Math.max(state.kmRemaining, 0)} km ou ${Math.max(state.daysRemaining, 0)} dias`;
  }
  return 'Atenção com a troca de óleo';
}

function checklistDetail(state: ChecklistState): string {
  if (state.urgency === 'atrasado') return `Atrasado há ${state.daysSinceLast} dias`;
  return `Já fazem ${state.daysSinceLast} dias`;
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
    if (oilState.urgency !== 'sem_registro') {
      candidates.push({
        vehicleId: vehicle.id,
        vehicleName: vehicle.name,
        title: 'Troca de óleo',
        detail: oilDetail(oilState),
        rank: URGENCY_RANK[oilState.urgency],
        urgencyScore: oilState.daysRemaining ?? oilState.kmRemaining ?? 0,
      });
    }

    const checklistState = getChecklistState(lastChecklist?.date ?? null);
    if (checklistState.urgency !== 'sem_registro') {
      candidates.push({
        vehicleId: vehicle.id,
        vehicleName: vehicle.name,
        title: 'Checklist semanal',
        detail: checklistDetail(checklistState),
        rank: URGENCY_RANK[checklistState.urgency],
        urgencyScore: -(checklistState.daysSinceLast ?? 0),
      });
    }
  }

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => b.rank - a.rank || a.urgencyScore - b.urgencyScore);
  const [best] = candidates;
  return { vehicleId: best.vehicleId, vehicleName: best.vehicleName, title: best.title, detail: best.detail };
}
