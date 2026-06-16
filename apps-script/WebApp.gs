function doGet() {
  Database.setup();
  return HtmlService.createTemplateFromFile('frontend/index')
    .evaluate()
    .setTitle(APP.NAME)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(fileName) {
  return HtmlService.createHtmlOutputFromFile(fileName).getContent();
}

function apiBootstrap() {
  Database.setup();
  return {
    app: APP,
    options: {
      fundamentalSeries: ENSINO_FUNDAMENTAL_SERIES,
      medioSeries: ENSINO_MEDIO_SERIES,
      disciplinasFundamental: DISCIPLINAS_FUNDAMENTAL,
      disciplinasMedio: DISCIPLINAS_MEDIO,
      situacoes: SITUACOES
    },
    config: ConfigService.getAll(),
    user: Session.getActiveUser().getEmail() || 'Usuario'
  };
}

function apiDashboard() {
  return {
    totalAlunos: AlunoService.listar().length,
    totalHistoricos: HistoricoService.listar().length,
    totalCertificados: CertificadoService.listar().length,
    ultimosAlunos: AlunoService.listar().slice(-5).reverse(),
    ultimosHistoricos: HistoricoService.listarComAluno().slice(-5).reverse()
  };
}

function apiListarAlunos() { return AlunoService.listar(); }
function apiSalvarAluno(payload) { return AlunoService.salvar(payload); }
function apiExcluirAluno(id) { return AlunoService.excluir(id); }
function apiObterAluno(id) { return AlunoService.obterFicha(id); }
function apiListarHistoricos(alunoId) { return alunoId ? HistoricoService.listarPorAluno(alunoId) : HistoricoService.listarComAluno(); }
function apiSalvarHistorico(payload) { return HistoricoService.salvar(payload); }
function apiExcluirHistorico(id) { return HistoricoService.excluir(id); }
function apiObterHistorico(id) { return HistoricoService.obter(id); }
function apiSalvarNotas(historicoId, notas) { return NotaService.salvarLote(historicoId, notas); }
function apiListarNotas(historicoId) { return NotaService.listarPorHistorico(historicoId); }
function apiListarCertificados(alunoId) { return alunoId ? CertificadoService.listarPorAluno(alunoId) : CertificadoService.listarComAluno(); }
function apiEmitirCertificado(payload) { return CertificadoService.emitir(payload); }
function apiExcluirCertificado(id) { return CertificadoService.excluir(id); }
function apiSalvarConfig(payload) { return ConfigService.saveAll(payload); }
function apiImpressaoHistorico(alunoId) { return PdfService.gerarHtmlHistorico(alunoId); }
function apiImpressaoCertificado(certificadoId) { return PdfService.gerarHtmlCertificado(certificadoId); }
function apiPdfHistorico(alunoId) { return PdfService.gerarPdfHistorico(alunoId); }
function apiPdfCertificado(certificadoId) { return PdfService.gerarPdfCertificado(certificadoId); }
