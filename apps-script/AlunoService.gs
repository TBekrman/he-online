const AlunoService = (() => {
  function listar() {
    return Database.list(SHEETS.ALUNOS).map(stripMeta);
  }

  function salvar(payload) {
    requireFields(payload, ['NOME', 'DATA_NASCIMENTO', 'MAE']);
    const aluno = cleanObject(payload, HEADERS.ALUNOS);
    aluno.NOME = normalizeText(aluno.NOME).toUpperCase();
    aluno.DATA_CADASTRO = aluno.DATA_CADASTRO || nowIso();
    if (aluno.ID) return stripMeta(Database.update(SHEETS.ALUNOS, aluno.ID, aluno));
    aluno.ID = generateId('ALU');
    return stripMeta(Database.append(SHEETS.ALUNOS, aluno));
  }

  function excluir(id) {
    HistoricoService.listarPorAluno(id).forEach((historico) => HistoricoService.excluir(historico.ID));
    Database.removeWhere(SHEETS.CERTIFICADOS, 'ALUNO_ID', id);
    return Database.remove(SHEETS.ALUNOS, id);
  }

  function obter(id) {
    const aluno = Database.findById(SHEETS.ALUNOS, id);
    return aluno ? stripMeta(aluno) : null;
  }

  function obterFicha(id) {
    const aluno = obter(id);
    if (!aluno) throw new Error('Aluno nao encontrado.');
    return {
      aluno,
      historicos: HistoricoService.listarPorAluno(id),
      certificados: CertificadoService.listarPorAluno(id)
    };
  }

  function pesquisar(term) {
    const needle = normalizeText(term).toLowerCase();
    if (!needle) return listar();
    return listar().filter((aluno) => [aluno.NOME, aluno.CPF, aluno.RG, aluno.MAE].join(' ').toLowerCase().indexOf(needle) >= 0);
  }

  return { listar, salvar, excluir, obter, obterFicha, pesquisar };
})();
