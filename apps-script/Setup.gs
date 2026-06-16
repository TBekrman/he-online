function setup() {
  return Database.setup();
}

function instalarSistema() {
  const result = Database.setup();
  SpreadsheetApp.getUi().alert(`${APP.NAME} configurado com sucesso.\n\nPlanilha: ${result.url}`);
}

function resetarBancoVazio() {
  const ss = getSpreadsheet();
  Object.keys(SHEETS).forEach((key) => {
    const target = ss.getSheetByName(SHEETS[key]);
    if (target && target.getLastRow() > 1) {
      target.getRange(2, 1, target.getLastRow() - 1, target.getLastColumn()).clearContent();
    }
  });
  Database.setup();
  SpreadsheetApp.getUi().alert('Dados removidos e estrutura recriada.');
}
