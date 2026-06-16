function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('HE - Online')
    .addItem('Abrir sistema', 'abrirSistema')
    .addItem('Inicializar banco', 'instalarSistema')
    .addSeparator()
    .addItem('Sobre', 'mostrarSobre')
    .addToUi();
}

function abrirSistema() {
  const html = HtmlService.createTemplateFromFile('frontend/index').evaluate().setTitle(APP.NAME).setWidth(1280).setHeight(820);
  SpreadsheetApp.getUi().showModelessDialog(html, APP.NAME);
}

function mostrarSobre() {
  SpreadsheetApp.getUi().alert(`${APP.NAME}\nVersao ${APP.VERSION}\nSistema de gerenciamento de historicos escolares.`);
}
