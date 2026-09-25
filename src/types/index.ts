export type VehicleType = 'car' | 'moto';

export type ItemStatus = 'ok' | 'atencao' | 'critico';

export interface Vehicle {
  id: string;
  name: string;
  type: VehicleType;
  plate: string | null;
  renavam: string | null;
  uf: string | null;
  odometer: number;
  oilIntervalKm: number;
  oilIntervalMonths: number;
  ipvaDueDate: string | null;
  licensingDueDate: string | null;
  photoUri: string | null;
  fipeBrandCode: string | null;
  fipeModelCode: string | null;
  fipeYearCode: string | null;
  fipeLabel: string | null;
  createdAt: string;
}

export interface FipeValue {
  id: string;
  vehicleId: string;
  referenceMonth: string;
  value: number;
  fetchedAt: string;
}

export interface OilChange {
  id: string;
  vehicleId: string;
  date: string;
  odometer: number;
  nextDueOdometer: number;
  nextDueDate: string;
  notes: string | null;
  createdAt: string;
}

export interface Checklist {
  id: string;
  vehicleId: string;
  date: string;
  tireStatus: ItemStatus;
  tirePhotoUri: string | null;
  waterStatus: ItemStatus;
  waterPhotoUri: string | null;
  oilStatus: ItemStatus;
  oilPhotoUri: string | null;
  odometer: number | null;
  notes: string | null;
  createdAt: string;
}

export type MaintenanceUrgency = 'sem_registro' | 'ok' | 'atencao' | 'vencida';

export interface MaintenanceState {
  urgency: MaintenanceUrgency;
  kmRemaining: number | null;
  daysRemaining: number | null;
}

export type ChecklistUrgency = 'sem_registro' | 'ok' | 'atencao' | 'atrasado';

export interface ChecklistState {
  urgency: ChecklistUrgency;
  daysSinceLast: number | null;
}

export type DocumentUrgency = 'sem_registro' | 'ok' | 'atencao' | 'vencido';

export interface DocumentState {
  urgency: DocumentUrgency;
  daysRemaining: number | null;
}
