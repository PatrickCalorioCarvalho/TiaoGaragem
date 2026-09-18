export interface BrazilState {
  uf: string;
  name: string;
  detranUrl: string;
}

export const BRAZIL_STATES: BrazilState[] = [
  { uf: 'AC', name: 'Acre', detranUrl: 'https://www.detran.ac.gov.br' },
  { uf: 'AL', name: 'Alagoas', detranUrl: 'https://www.detran.al.gov.br' },
  { uf: 'AP', name: 'Amapá', detranUrl: 'https://www.detran.ap.gov.br' },
  { uf: 'AM', name: 'Amazonas', detranUrl: 'https://www.detran.am.gov.br' },
  { uf: 'BA', name: 'Bahia', detranUrl: 'https://www.detran.ba.gov.br' },
  { uf: 'CE', name: 'Ceará', detranUrl: 'https://www.detran.ce.gov.br' },
  { uf: 'DF', name: 'Distrito Federal', detranUrl: 'https://www.detran.df.gov.br' },
  { uf: 'ES', name: 'Espírito Santo', detranUrl: 'https://detran.es.gov.br' },
  { uf: 'GO', name: 'Goiás', detranUrl: 'https://www.detran.go.gov.br' },
  { uf: 'MA', name: 'Maranhão', detranUrl: 'https://www.detran.ma.gov.br' },
  { uf: 'MT', name: 'Mato Grosso', detranUrl: 'https://www.detran.mt.gov.br' },
  { uf: 'MS', name: 'Mato Grosso do Sul', detranUrl: 'https://www.detran.ms.gov.br' },
  { uf: 'MG', name: 'Minas Gerais', detranUrl: 'https://www.detran.mg.gov.br' },
  { uf: 'PA', name: 'Pará', detranUrl: 'https://www.detran.pa.gov.br' },
  { uf: 'PB', name: 'Paraíba', detranUrl: 'https://www.detran.pb.gov.br' },
  { uf: 'PR', name: 'Paraná', detranUrl: 'https://www.detran.pr.gov.br' },
  { uf: 'PE', name: 'Pernambuco', detranUrl: 'https://www.detran.pe.gov.br' },
  { uf: 'PI', name: 'Piauí', detranUrl: 'https://www.detran.pi.gov.br' },
  { uf: 'RJ', name: 'Rio de Janeiro', detranUrl: 'https://www.detran.rj.gov.br' },
  { uf: 'RN', name: 'Rio Grande do Norte', detranUrl: 'https://www.detran.rn.gov.br' },
  { uf: 'RS', name: 'Rio Grande do Sul', detranUrl: 'https://www.detran.rs.gov.br' },
  { uf: 'RO', name: 'Rondônia', detranUrl: 'https://www.detran.ro.gov.br' },
  { uf: 'RR', name: 'Roraima', detranUrl: 'https://www.detran.rr.gov.br' },
  { uf: 'SC', name: 'Santa Catarina', detranUrl: 'https://www.detran.sc.gov.br' },
  { uf: 'SP', name: 'São Paulo', detranUrl: 'https://www.detran.sp.gov.br' },
  { uf: 'SE', name: 'Sergipe', detranUrl: 'https://www.detran.se.gov.br' },
  { uf: 'TO', name: 'Tocantins', detranUrl: 'https://www.detran.to.gov.br' },
];

const BY_UF = new Map(BRAZIL_STATES.map((state) => [state.uf, state]));

export function findState(uf: string | null | undefined): BrazilState | null {
  if (!uf) return null;
  return BY_UF.get(uf.toUpperCase()) ?? null;
}

export function isValidUf(uf: string): boolean {
  return BY_UF.has(uf.toUpperCase());
}
