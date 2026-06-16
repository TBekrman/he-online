const APP = Object.freeze({
  NAME: 'HE - Online',
  FULL_NAME: 'Historico Escolar Online',
  VERSION: '1.0.0',
  SPREADSHEET_NAME: 'Modulo: Historico Escolar Online',
  DATE_FORMAT: 'dd/MM/yyyy',
  TIMEZONE: 'America/Sao_Paulo'
});

const SHEETS = Object.freeze({
  ALUNOS: 'ALUNOS',
  HISTORICOS: 'HISTORICOS',
  NOTAS: 'NOTAS',
  CERTIFICADOS: 'CERTIFICADOS',
  CONFIG: 'CONFIG'
});

const HEADERS = Object.freeze({
  ALUNOS: ['ID', 'NOME', 'NATURALIDADE', 'UF', 'NACIONALIDADE', 'SEXO', 'DATA_NASCIMENTO', 'MAE', 'PAI', 'RG', 'ORGAO_EXPEDIDOR', 'UF_RG', 'CPF', 'ENDERECO', 'TELEFONE', 'EMAIL', 'OBSERVACOES', 'DATA_CADASTRO'],
  HISTORICOS: ['ID', 'ALUNO_ID', 'TIPO', 'ANO_LETIVO', 'SERIE', 'ESCOLA', 'MUNICIPIO', 'UF', 'DIAS_LETIVOS', 'CH_ANUAL', 'SITUACAO', 'FALTAS', 'OBSERVACOES'],
  NOTAS: ['ID', 'HISTORICO_ID', 'DISCIPLINA', 'NOTA', 'CARGA_HORARIA'],
  CERTIFICADOS: ['ID', 'ALUNO_ID', 'DATA_CONCLUSAO', 'ETAPA', 'DATA_EMISSAO'],
  CONFIG: ['CHAVE', 'VALOR']
});

const ENSINO_FUNDAMENTAL_SERIES = ['Fase Introdutoria', 'Fase I', 'Fase II', 'Fase III', 'Fase IV', '6o Ano', '7o Ano', '8o Ano', '9o Ano'];
const ENSINO_MEDIO_SERIES = ['1o Ano', '2o Ano', '3o Ano'];
const DISCIPLINAS_FUNDAMENTAL = ['Lingua Portuguesa', 'Matematica', 'Ciencias', 'Geografia', 'Historia', 'Ensino Religioso', 'Educacao Fisica', 'Arte', 'Ingles'];
const DISCIPLINAS_MEDIO = ['Lingua Portuguesa', 'Arte', 'Educacao Fisica', 'Matematica', 'Fisica', 'Biologia', 'Quimica', 'Historia', 'Geografia', 'Sociologia', 'Filosofia'];
const SITUACOES = ['Aprovado', 'Reprovado', 'Cursando', 'Transferido', 'Concluido'];

function getSpreadsheet() {
  const props = PropertiesService.getScriptProperties();
  const storedId = props.getProperty('SPREADSHEET_ID');
  if (storedId) return SpreadsheetApp.openById(storedId);

  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) {
    props.setProperty('SPREADSHEET_ID', active.getId());
    return active;
  }

  const created = SpreadsheetApp.create(APP.SPREADSHEET_NAME);
  props.setProperty('SPREADSHEET_ID', created.getId());
  return created;
}

function normalizeText(value) {
  return String(value || '').trim();
}

function nowIso() {
  return Utilities.formatDate(new Date(), APP.TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss");
}

function formatDateBr(value) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) return String(value);
  return Utilities.formatDate(date, APP.TIMEZONE, APP.DATE_FORMAT);
}

function generateId(prefix) {
  const random = Utilities.getUuid().split('-')[0].toUpperCase();
  const stamp = Utilities.formatDate(new Date(), APP.TIMEZONE, 'yyyyMMddHHmmss');
  return `${prefix}-${stamp}-${random}`;
}

function requireFields(payload, fields) {
  const missing = fields.filter((field) => !normalizeText(payload && payload[field]));
  if (missing.length) throw new Error('Campos obrigatorios: ' + missing.join(', '));
}

function cleanObject(payload, allowedFields) {
  const result = {};
  allowedFields.forEach((field) => {
    result[field] = payload && payload[field] !== undefined && payload[field] !== null ? payload[field] : '';
  });
  return result;
}

function stripMeta(row) {
  const copy = Object.assign({}, row);
  delete copy._rowNumber;
  return copy;
}
