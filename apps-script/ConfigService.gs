const ConfigService = (() => {
  function getAll() {
    return Database.list(SHEETS.CONFIG).reduce((acc, row) => {
      acc[row.CHAVE] = row.VALOR;
      return acc;
    }, {});
  }

  function saveAll(payload) {
    Object.keys(payload || {}).forEach((key) => {
      const value = payload[key];
      if (Database.findById(SHEETS.CONFIG, key)) {
        Database.update(SHEETS.CONFIG, key, { CHAVE: key, VALOR: value });
      } else {
        Database.append(SHEETS.CONFIG, { CHAVE: key, VALOR: value });
      }
    });
    return getAll();
  }

  return { getAll, saveAll };
})();
