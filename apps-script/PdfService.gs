const PdfService = (() => {
  function gerarHtmlHistorico(alunoId) {
    const ficha = AlunoService.obterFicha(alunoId);
    const config = ConfigService.getAll();
    const historicos = ficha.historicos.map((historico) => HistoricoService.obter(historico.ID));
    return renderHistorico(ficha.aluno, historicos, config);
  }

  function gerarHtmlCertificado(certificadoId) {
    const certificado = CertificadoService.obter(certificadoId);
    if (!certificado) throw new Error('Certificado nao encontrado.');
    const aluno = AlunoService.obter(certificado.ALUNO_ID);
    return renderCertificado(aluno, certificado, ConfigService.getAll());
  }

  function gerarPdfHistorico(alunoId) {
    return htmlToPdfFile(gerarHtmlHistorico(alunoId), `Historico-${alunoId}.pdf`);
  }

  function gerarPdfCertificado(certificadoId) {
    return htmlToPdfFile(gerarHtmlCertificado(certificadoId), `Certificado-${certificadoId}.pdf`);
  }

  function htmlToPdfFile(html, fileName) {
    const blob = Utilities.newBlob(html, 'text/html', fileName.replace('.pdf', '.html')).getAs('application/pdf');
    blob.setName(fileName);
    const file = DriveApp.createFile(blob);
    return { id: file.getId(), url: file.getUrl(), name: file.getName() };
  }

  function renderHistorico(aluno, historicos, config) {
    const rows = historicos.map((h) => {
      const notas = (h.NOTAS || []).map((n) => `<tr><td>${esc(n.DISCIPLINA)}</td><td>${esc(n.NOTA)}</td><td>${esc(n.CARGA_HORARIA)}</td></tr>`).join('');
      return `<section class="block"><h3>${esc(h.TIPO)} - ${esc(h.SERIE)} - ${esc(h.ANO_LETIVO)}</h3><p><strong>Escola:</strong> ${esc(h.ESCOLA)} - ${esc(h.MUNICIPIO)}/${esc(h.UF)}</p><p><strong>Dias letivos:</strong> ${esc(h.DIAS_LETIVOS)} | <strong>CH anual:</strong> ${esc(h.CH_ANUAL)} | <strong>Faltas:</strong> ${esc(h.FALTAS)} | <strong>Situacao:</strong> ${esc(h.SITUACAO)}</p><table><thead><tr><th>Disciplina</th><th>Nota</th><th>Carga horaria</th></tr></thead><tbody>${notas}</tbody></table><p>${esc(h.OBSERVACOES)}</p></section>`;
    }).join('');
    return printShell('Historico Escolar', `<h1>${esc(config.NOME_ESCOLA || APP.NAME)}</h1><h2>Historico Escolar</h2><div class="block"><p><strong>Aluno:</strong> ${esc(aluno.NOME)}</p><p><strong>Nascimento:</strong> ${esc(aluno.DATA_NASCIMENTO)} | <strong>Naturalidade:</strong> ${esc(aluno.NATURALIDADE)}/${esc(aluno.UF)}</p><p><strong>Mae:</strong> ${esc(aluno.MAE)} | <strong>Pai:</strong> ${esc(aluno.PAI)}</p></div>${rows}<div class="signatures"><span>Diretor(a)</span><span>Secretario(a)</span></div>`);
  }

  function renderCertificado(aluno, certificado, config) {
    return printShell('Certificado', `<h1>${esc(config.NOME_ESCOLA || APP.NAME)}</h1><div class="certificate"><h2>Certificado de Conclusao</h2><p>Certificamos que <strong>${esc(aluno.NOME)}</strong>, filho(a) de ${esc(aluno.MAE)}, concluiu a etapa <strong>${esc(certificado.ETAPA)}</strong> em ${esc(certificado.DATA_CONCLUSAO)}.</p><p>Emitido em ${esc(certificado.DATA_EMISSAO)}.</p></div><div class="signatures"><span>Diretor(a)</span><span>Secretario(a)</span></div>`);
  }

  function printShell(title, body) {
    return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title><style>body{font-family:Arial,sans-serif;color:#111;margin:32px}.block{border:1px solid #bbb;padding:14px;margin:14px 0}h1,h2{text-align:center}table{width:100%;border-collapse:collapse;margin-top:10px}th,td{border:1px solid #999;padding:7px;text-align:left}.certificate{font-size:20px;line-height:1.8;text-align:center;margin:80px 30px}.signatures{display:flex;justify-content:space-around;margin-top:80px}.signatures span{border-top:1px solid #111;width:220px;text-align:center;padding-top:8px}@media print{button{display:none}}</style></head><body><button onclick="window.print()">Imprimir</button>${body}</body></html>`;
  }

  function esc(value) {
    return String(value === undefined || value === null ? '' : value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  }

  return { gerarHtmlHistorico, gerarHtmlCertificado, gerarPdfHistorico, gerarPdfCertificado };
})();
