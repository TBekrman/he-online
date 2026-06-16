const Database = (() => {
  function setup() {
    const ss = getSpreadsheet();
    Object.keys(SHEETS).forEach((key) => ensureSheet(ss, SHEETS[key], HEADERS[key]));
    seedConfig();
    return { ok: true, spreadsheetId: ss.getId(), url: ss.getUrl() };
  }

  function ensureSheet(ss, name, headers) {
    let target = ss.getSheetByName(name);
    if (!target) target = ss.insertSheet(name);
    const existing = target.getLastRow() ? target.getRange(1, 1, 1, Math.max(target.getLastColumn(), headers.length)).getValues()[0] : [];
    const mustWrite = headers.some((header, index) => existing[index] !== header);
    if (mustWrite) target.getRange(1, 1, 1, headers.length).setValues([headers]);
    target.setFrozenRows(1);
    target.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#0f766e').setFontColor('#ffffff');
    target.autoResizeColumns(1, headers.length);
  }

  function seedConfig() {
    const defaults = { NOME_ESCOLA: 'Escola', MUNICIPIO: '', UF: 'MG', DIRETOR: '', SECRETARIO: '' };
    const current = list(SHEETS.CONFIG).reduce((acc, row) => {
      acc[row.CHAVE] = row.VALOR;
      return acc;
    }, {});
    Object.keys(defaults).forEach((key) => {
      if (current[key] === undefined) append(SHEETS.CONFIG, { CHAVE: key, VALOR: defaults[key] });
    });
  }

  function getHeaders(name) {
    const key = Object.keys(SHEETS).find((sheetKey) => SHEETS[sheetKey] === name);
    return HEADERS[key];
  }

  function sheet(name) {
    const found = getSpreadsheet().getSheetByName(name);
    if (!found) {
      setup();
      return getSpreadsheet().getSheetByName(name);
    }
    return found;
  }

  function list(name) {
    const target = sheet(name);
    const header = getHeaders(name);
    const lastRow = target.getLastRow();
    if (lastRow < 2) return [];
    return target.getRange(2, 1, lastRow - 1, header.length).getValues()
      .filter((row) => row.some((cell) => cell !== ''))
      .map((row, index) => rowToObject(header, row, index + 2));
  }

  function rowToObject(header, row, rowNumber) {
    return header.reduce((obj, key, index) => {
      obj[key] = row[index] instanceof Date ? formatDateBr(row[index]) : row[index];
      obj._rowNumber = rowNumber;
      return obj;
    }, {});
  }

  function append(name, payload) {
    const target = sheet(name);
    const header = getHeaders(name);
    target.appendRow(header.map((key) => payload[key] !== undefined ? payload[key] : ''));
    return findById(name, payload.ID || payload.CHAVE);
  }

  function update(name, id, payload) {
    const target = sheet(name);
    const header = getHeaders(name);
    const idField = name === SHEETS.CONFIG ? 'CHAVE' : 'ID';
    const rowNumber = findRowNumber(name, idField, id);
    if (!rowNumber) throw new Error('Registro nao encontrado: ' + id);
    const merged = Object.assign({}, findById(name, id), payload);
    target.getRange(rowNumber, 1, 1, header.length).setValues([header.map((key) => merged[key] !== undefined ? merged[key] : '')]);
    return findById(name, id);
  }

  function remove(name, id) {
    const idField = name === SHEETS.CONFIG ? 'CHAVE' : 'ID';
    const rowNumber = findRowNumber(name, idField, id);
    if (!rowNumber) throw new Error('Registro nao encontrado: ' + id);
    sheet(name).deleteRow(rowNumber);
    return { ok: true, id };
  }

  function findById(name, id) {
    const idField = name === SHEETS.CONFIG ? 'CHAVE' : 'ID';
    return list(name).find((item) => String(item[idField]) === String(id)) || null;
  }

  function findRowNumber(name, field, value) {
    const found = list(name).find((row) => String(row[field]) === String(value));
    return found ? found._rowNumber : null;
  }

  function query(name, field, value) {
    return list(name).filter((item) => String(item[field]) === String(value));
  }

  function removeWhere(name, field, value) {
    const rows = query(name, field, value).sort((a, b) => b._rowNumber - a._rowNumber);
    const target = sheet(name);
    rows.forEach((row) => target.deleteRow(row._rowNumber));
    return rows.length;
  }

  return { setup, list, append, update, remove, findById, query, removeWhere };
})();
