const HistoricoService = (() => {
  function listar() {
    return Database.list(SHEETS.HISTORICOS).map(stripMeta);
  }

  function listarComAluno() {
    const alunos = AlunoService.listar().reduce((acc, aluno) => {
      acc[aluno.ID] = aluno.NOME;
      return acc;
    }, {});
    return listar().map((historico) => Object.assign({}, historico, { ALUNO_NOME: alunos[historico.ALUNO_ID] || '' }));
  }

  function listarPorAluno(alunoId) {
    return Database.query(SHEETS.HISTORICOS, 'ALUNO_ID', alunoId).map(stripMeta);
  }

  function obter(id) {
    const historico = Database.findById(SHEETS.HISTORICOS, id);
    if (!historico) throw new Error('Historico nao encontrado.');
    const clean = stripMeta(historico);
    clean.NOTAS = NotaService.listarPorHistorico(id);
    return clean;
  }

  function salvar(payload) {
    requireFields(payload, ['ALUNO_ID', 'TIPO', 'ANO_LETIVO', 'SERIE', 'ESCOLA', 'SITUACAO']);
    if (!AlunoService.obter(payload.ALUNO_ID)) throw new Error('Aluno invalido.');
    const historico = cleanObject(payload, HEADERS.HISTORICOS);
    historico.DIAS_LETIVOS = Number(historico.DIAS_LETIVOS || 0);
    historico.CH_ANUAL = Number(historico.CH_ANUAL || 0);
    historico.FALTAS = Number(historico.FALTAS || 0);
    if (historico.ID) {
      Database.update(SHEETS.HISTORICOS, historico.ID, historico);
    } else {
      historico.ID = generateId('HIS');
      Database.append(SHEETS.HISTORICOS, historico);
    }
    if (Array.isArray(payload.NOTAS)) NotaService.salvarLote(historico.ID, payload.NOTAS);
    return obter(historico.ID);
  }

  function excluir(id) {
    Database.removeWhere(SHEETS.NOTAS, 'HISTORICO_ID', id);
    return Database.remove(SHEETS.HISTORICOS, id);
  }

  return { listar, listarComAluno, listarPorAluno, obter, salvar, excluir };
})();
