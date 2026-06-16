/**
 * HE - Online (Histórico Escolar Online)
 * Entry point do aplicativo
 */

const PROJECT_NAME = 'HE - Online';
const PROJECT_VERSION = '1.0.0';

/**
 * Função de inicialização - cria menus e configurações
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  
  ui.createMenu('📚 HE - Online')
    .addItem('📊 Dashboard', 'openDashboard')
    .addItem('👥 Alunos', 'openStudents')
    .addItem('📋 Históricos', 'openHistories')
    .addItem('📜 Certificados', 'openCertificates')
    .addSeparator()
    .addItem('⚙️ Configurações', 'openSettings')
    .addItem('🔧 Inicializar BD', 'initializeDatabase')
    .addItem('ℹ️ Sobre', 'showAbout')
    .addToUi();
}

/**
 * Abre o dashboard
 */
function openDashboard() {
  const html = HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setWidth(1200)
    .setHeight(800);
  
  SpreadsheetApp.getUi().showModelessDialog(html, '📊 Dashboard - HE Online');
}

/**
 * Abre a tela de gerenciamento de alunos
 */
function openStudents() {
  const html = HtmlService.createTemplateFromFile('StudentForm')
    .evaluate()
    .setWidth(1200)
    .setHeight(800);
  
  SpreadsheetApp.getUi().showModelessDialog(html, '👥 Gerenciar Alunos');
}

/**
 * Abre a tela de históricos
 */
function openHistories() {
  const html = HtmlService.createTemplateFromFile('HistoryForm')
    .evaluate()
    .setWidth(1200)
    .setHeight(800);
  
  SpreadsheetApp.getUi().showModelessDialog(html, '📋 Históricos Escolares');
}

/**
 * Abre a tela de certificados
 */
function openCertificates() {
  const html = HtmlService.createTemplateFromFile('CertificateForm')
    .evaluate()
    .setWidth(1000)
    .setHeight(800);
  
  SpreadsheetApp.getUi().showModelessDialog(html, '📜 Certificados');
}

/**
 * Abre configurações
 */
function openSettings() {
  const html = HtmlService.createTemplateFromFile('Settings')
    .evaluate()
    .setWidth(800)
    .setHeight(600);
  
  SpreadsheetApp.getUi().showModelessDialog(html, '⚙️ Configurações');
}

/**
 * Mostra informações sobre o projeto
 */
function showAbout() {
  const ui = SpreadsheetApp.getUi();
  const message = `${PROJECT_NAME}\n\nVersão: ${PROJECT_VERSION}\n\nSistema de Gerenciamento de Históricos Escolares\n\nDesenvolvido com Google Apps Script`;
  ui.alert(message);
}

/**
 * Inicializa o banco de dados
 */
function initializeDatabase() {
  try {
    DatabaseService.initializeDatabase();
    ConfigService.initializeDefaults();
    SpreadsheetApp.getUi().alert('✅ Banco de dados inicializado com sucesso!');
  } catch (error) {
    SpreadsheetApp.getUi().alert('❌ Erro ao inicializar: ' + error.toString());
  }
}

/**
 * Função que serve a página web
 */
function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * Inclui HTML em templates
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}