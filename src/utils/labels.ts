import { StatusKind } from '../theme/colors';
import type { ChecklistUrgency, DocumentUrgency, ItemStatus, MaintenanceUrgency, VehicleType } from '../types';

export function maintenanceUrgencyLabel(urgency: MaintenanceUrgency): string {
  switch (urgency) {
    case 'sem_registro':
      return 'Sem registro';
    case 'ok':
      return 'Em dia';
    case 'atencao':
      return 'Atenção';
    case 'vencida':
      return 'Vencida';
  }
}

export function maintenanceUrgencyKind(urgency: MaintenanceUrgency): StatusKind {
  switch (urgency) {
    case 'ok':
      return 'ok';
    case 'atencao':
      return 'atencao';
    case 'vencida':
      return 'critico';
    default:
      return 'neutral';
  }
}

export function checklistUrgencyLabel(urgency: ChecklistUrgency): string {
  switch (urgency) {
    case 'sem_registro':
      return 'Sem registro';
    case 'ok':
      return 'Em dia';
    case 'atencao':
      return 'Fazer em breve';
    case 'atrasado':
      return 'Atrasado';
  }
}

export function checklistUrgencyKind(urgency: ChecklistUrgency): StatusKind {
  switch (urgency) {
    case 'ok':
      return 'ok';
    case 'atencao':
      return 'atencao';
    case 'atrasado':
      return 'critico';
    default:
      return 'neutral';
  }
}

export function documentUrgencyLabel(urgency: DocumentUrgency): string {
  switch (urgency) {
    case 'sem_registro':
      return 'Não cadastrado';
    case 'ok':
      return 'Em dia';
    case 'atencao':
      return 'Atenção';
    case 'vencido':
      return 'Vencido';
  }
}

export function documentUrgencyKind(urgency: DocumentUrgency): StatusKind {
  switch (urgency) {
    case 'ok':
      return 'ok';
    case 'atencao':
      return 'atencao';
    case 'vencido':
      return 'critico';
    default:
      return 'neutral';
  }
}

export function itemStatusLabel(status: ItemStatus): string {
  switch (status) {
    case 'ok':
      return 'OK';
    case 'atencao':
      return 'Atenção';
    case 'critico':
      return 'Crítico';
  }
}

export function itemStatusKind(status: ItemStatus): StatusKind {
  return status;
}

export function vehicleTypeLabel(type: VehicleType): string {
  return type === 'car' ? 'Carro' : 'Moto';
}

export function vehicleTypeIcon(type: VehicleType): 'car' | 'motorbike' {
  return type === 'car' ? 'car' : 'motorbike';
}
