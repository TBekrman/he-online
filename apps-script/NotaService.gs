const NotaService = (() => {
  function listarPorHistorico(historicoId) {
    return Database.query(SHEETS.NOTAS, 'HISTORICO_ID', historicoId).map(stripMeta);
  }

  function salvarLote(historicoId, notas) {
    if (!historicoId) throw new Error('Historico obrigatorio para salvar notas.');
    Database.removeWhere(SHEETS.NOTAS, 'HISTORICO_ID', historicoId);
    return (notas || [])
      .filter((nota) => normalizeText(nota.DISCIPLINA))
      .map((nota) => {
        const row = cleanObject(nota, HEADERS.NOTAS);
        row.ID = generateId('NOT');
        row.HISTORICO_ID = historicoId;
        row.NOTA = normalizeText(row.NOTA);
        row.CARGA_HORARIA = Number(row.CARGA_HORARIA || 0);
        return stripMeta(Database.append(SHEETS.NOTAS, row));
      });
  }

  return { listarPorHistorico, salvarLote };
})();
