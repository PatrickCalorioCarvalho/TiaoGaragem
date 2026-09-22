import type { VehicleType } from '../types';

const BASE_URL = 'https://parallelum.com.br/fipe/api/v1';

export interface FipeOption {
  codigo: string;
  nome: string;
}

export interface FipePrice {
  Valor: string;
  Marca: string;
  Modelo: string;
  AnoModelo: number;
  Combustivel: string;
  CodigoFipe: string;
  MesReferencia: string;
}

function vehiclePath(type: VehicleType): string {
  return type === 'car' ? 'carros' : 'motos';
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`);
  if (!response.ok) {
    throw new Error(`Falha na consulta FIPE (${response.status})`);
  }
  return response.json() as Promise<T>;
}

function normalize(options: { codigo: string | number; nome: string }[]): FipeOption[] {
  return options.map((option) => ({ codigo: String(option.codigo), nome: option.nome }));
}

export function listBrands(type: VehicleType): Promise<FipeOption[]> {
  return fetchJson<{ codigo: string | number; nome: string }[]>(`/${vehiclePath(type)}/marcas`).then(normalize);
}

export function listModels(type: VehicleType, brandCode: string): Promise<FipeOption[]> {
  return fetchJson<{ modelos: { codigo: string | number; nome: string }[] }>(
    `/${vehiclePath(type)}/marcas/${brandCode}/modelos`,
  ).then((result) => normalize(result.modelos));
}

export function listYears(type: VehicleType, brandCode: string, modelCode: string): Promise<FipeOption[]> {
  return fetchJson<{ codigo: string | number; nome: string }[]>(
    `/${vehiclePath(type)}/marcas/${brandCode}/modelos/${modelCode}/anos`,
  ).then(normalize);
}

export function getPrice(
  type: VehicleType,
  brandCode: string,
  modelCode: string,
  yearCode: string,
): Promise<FipePrice> {
  return fetchJson(`/${vehiclePath(type)}/marcas/${brandCode}/modelos/${modelCode}/anos/${yearCode}`);
}

/** Converts a FIPE "R$ 45.678,00" string into a plain number. */
export function parseFipeValue(valor: string): number {
  const digits = valor.replace(/[^0-9,]/g, '').replace(',', '.');
  const parsed = Number(digits);
  return Number.isFinite(parsed) ? parsed : 0;
}
