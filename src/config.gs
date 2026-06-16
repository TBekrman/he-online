/**
 * Configurações Globais do Sistema
 */

// ==================== PLANILHA ====================
const SPREADSHEET = SpreadsheetApp.getActiveSpreadsheet();
const SPREADSHEET_ID = SPREADSHEET.getId();

// ==================== NOMES DAS ABAS ====================
const SHEETS = {
  ALUNOS: 'ALUNOS',
  HISTORICOS: 'HISTORICOS',
  NOTAS: 'NOTAS',
  CERTIFICADOS: 'CERTIFICADOS',
  CONFIG: 'CONFIG'
};

// ==================== CONFIGURAÇÕES DE DISCIPLINAS ====================
const DISCIPLINES_FUNDAMENTAL = [
  'Língua Portuguesa',
  'Matemática',
  'Ciências',
  'Geografia',
  'História',
  'Ensino Religioso',
  'Educação Física',
  'Arte',
  'Inglês'
];

const DISCIPLINES_MEDIUM = [
  'Língua Portuguesa',
  'Arte',
  'Educação Física',
  'Matemática',
  'Física',
  'Biologia',
  'Química',
  'História',
  'Geografia',
  'Sociologia',
  'Filosofia'
];

// ==================== TIPOS DE EDUCAÇÃO ====================
const EDUCATION_TYPES = {
  FUNDAMENTAL: 'Fundamental',
  MEDIUM: 'Médio'
};

// ==================== SÉRIE/ANO ====================
const GRADES_FUNDAMENTAL = [
  'Fase Introdutória',
  'Fase I',
  'Fase II',
  'Fase III',
  'Fase IV',
  '6º Ano',
  '7º Ano',
  '8º Ano',
  '9º Ano'
];

const GRADES_MEDIUM = [
  '1º Ano',
  '2º Ano',
  '3º Ano'
];

// ==================== SITUAÇÕES ====================
const SITUATIONS = [
  'Aprovado',
  'Reprovado',
  'Transferência',
  'Abandono',
  'Reclassificação'
];

// ==================== CONFIGURAÇÃO ====================
const CONFIG_KEYS = {
  SCHOOL_NAME: 'SCHOOL_NAME',
  SCHOOL_CITY: 'SCHOOL_CITY',
  SCHOOL_STATE: 'SCHOOL_STATE',
  DIRECTOR_NAME: 'DIRECTOR_NAME',
  DIRECTOR_SIGNATURE: 'DIRECTOR_SIGNATURE',
  LAST_STUDENT_ID: 'LAST_STUDENT_ID',
  LAST_HISTORY_ID: 'LAST_HISTORY_ID',
  LAST_CERTIFICATE_ID: 'LAST_CERTIFICATE_ID'
};

// ==================== CORES ====================
const COLORS = {
  PRIMARY: '#007bff',
  SECONDARY: '#6c757d',
  SUCCESS: '#28a745',
  DANGER: '#dc3545',
  WARNING: '#ffc107',
  INFO: '#17a2b8'
};