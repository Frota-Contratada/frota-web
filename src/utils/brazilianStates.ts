export interface BrazilianState {
  label: string;
  value: string;
  nome: string;
  sigla: string;
}

export const BRAZILIAN_STATES: BrazilianState[] = [
  { label: 'Acre (AC)', value: 'AC', nome: 'Acre', sigla: 'AC' },
  { label: 'Alagoas (AL)', value: 'AL', nome: 'Alagoas', sigla: 'AL' },
  { label: 'Amapá (AP)', value: 'AP', nome: 'Amapá', sigla: 'AP' },
  { label: 'Amazonas (AM)', value: 'AM', nome: 'Amazonas', sigla: 'AM' },
  { label: 'Bahia (BA)', value: 'BA', nome: 'Bahia', sigla: 'BA' },
  { label: 'Ceará (CE)', value: 'CE', nome: 'Ceará', sigla: 'CE' },
  { label: 'Distrito Federal (DF)', value: 'DF', nome: 'Distrito Federal', sigla: 'DF' },
  { label: 'Espírito Santo (ES)', value: 'ES', nome: 'Espírito Santo', sigla: 'ES' },
  { label: 'Goiás (GO)', value: 'GO', nome: 'Goiás', sigla: 'GO' },
  { label: 'Maranhão (MA)', value: 'MA', nome: 'Maranhão', sigla: 'MA' },
  { label: 'Mato Grosso (MT)', value: 'MT', nome: 'Mato Grosso', sigla: 'MT' },
  { label: 'Mato Grosso do Sul (MS)', value: 'MS', nome: 'Mato Grosso do Sul', sigla: 'MS' },
  { label: 'Minas Gerais (MG)', value: 'MG', nome: 'Minas Gerais', sigla: 'MG' },
  { label: 'Pará (PA)', value: 'PA', nome: 'Pará', sigla: 'PA' },
  { label: 'Paraíba (PB)', value: 'PB', nome: 'Paraíba', sigla: 'PB' },
  { label: 'Paraná (PR)', value: 'PR', nome: 'Paraná', sigla: 'PR' },
  { label: 'Pernambuco (PE)', value: 'PE', nome: 'Pernambuco', sigla: 'PE' },
  { label: 'Piauí (PI)', value: 'PI', nome: 'Piauí', sigla: 'PI' },
  { label: 'Rio de Janeiro (RJ)', value: 'RJ', nome: 'Rio de Janeiro', sigla: 'RJ' },
  { label: 'Rio Grande do Norte (RN)', value: 'RN', nome: 'Rio Grande do Norte', sigla: 'RN' },
  { label: 'Rio Grande do Sul (RS)', value: 'RS', nome: 'Rio Grande do Sul', sigla: 'RS' },
  { label: 'Rondônia (RO)', value: 'RO', nome: 'Rondônia', sigla: 'RO' },
  { label: 'Roraima (RR)', value: 'RR', nome: 'Roraima', sigla: 'RR' },
  { label: 'Santa Catarina (SC)', value: 'SC', nome: 'Santa Catarina', sigla: 'SC' },
  { label: 'São Paulo (SP)', value: 'SP', nome: 'São Paulo', sigla: 'SP' },
  { label: 'Sergipe (SE)', value: 'SE', nome: 'Sergipe', sigla: 'SE' },
  { label: 'Tocantins (TO)', value: 'TO', nome: 'Tocantins', sigla: 'TO' },
];

export const stateSelectOptions = BRAZILIAN_STATES.map((s) => ({
  label: `${s.nome} - ${s.sigla}`,
  value: s.sigla,
}));
