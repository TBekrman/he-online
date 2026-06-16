const CertificadoService = (() => {
  function listar() {
    return Database.list(SHEETS.CERTIFICADOS).map(stripMeta);
  }

  function listarComAluno() {
    const alunos = AlunoService.listar().reduce((acc, aluno) => {
      acc[aluno.ID] = aluno.NOME;
      return acc;
    }, {});
    return listar().map((certificado) => Object.assign({}, certificado, { ALUNO_NOME: alunos[certificado.ALUNO_ID] || '' }));
  }

  function listarPorAluno(alunoId) {
    return Database.query(SHEETS.CERTIFICADOS, 'ALUNO_ID', alunoId).map(stripMeta);
  }

  function emitir(payload) {
    requireFields(payload, ['ALUNO_ID', 'DATA_CONCLUSAO', 'ETAPA']);
    if (!AlunoService.obter(payload.ALUNO_ID)) throw new Error('Aluno invalido.');
    const certificado = cleanObject(payload, HEADERS.CERTIFICADOS);
    certificado.ID = certificado.ID || generateId('CER');
    certificado.DATA_EMISSAO = certificado.DATA_EMISSAO || nowIso();
    return stripMeta(Database.append(SHEETS.CERTIFICADOS, certificado));
  }

  function excluir(id) {
    return Database.remove(SHEETS.CERTIFICADOS, id);
  }

  function obter(id) {
    const certificado = Database.findById(SHEETS.CERTIFICADOS, id);
    return certificado ? stripMeta(certificado) : null;
  }

  return { listar, listarComAluno, listarPorAluno, emitir, excluir, obter };
})();
