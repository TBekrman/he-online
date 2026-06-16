/**
 * Controlador de Notas/Históricos
 */

const HistoryController = {
  
  /**
   * Cria um novo histórico
   */
  addHistory(historyData) {
    // Valida dados básicos
    if (!historyData.alunoId) throw new Error('Aluno é obrigatório');
    if (!historyData.anoLetivo) throw new Error('Ano Letivo é obrigatório');
    if (!historyData.serie) throw new Error('Série é obrigatória');
    
    // Gera ID
    const id = ConfigService.getNextHistoryId();
    
    // Prepara dados
    const rowData = [
      id,
      historyData.alunoId,
      historyData.anoLetivo,
      historyData.tipo || '',
      historyData.serie,
      historyData.escola || '',
      historyData.municipio || '',
      historyData.uf || '',
      historyData.diasLetivos || '200',
      historyData.chAnual || '800',
      historyData.situacao || 'Aprovado',
      historyData.faltas || '0',
      historyData.observacoes || ''
    ];
    
    // Insere
    DatabaseService.addRow(SHEETS.HISTORICOS, rowData);
    
    return id;
  },
  
  /**
   * Atualiza um histórico
   */
  editHistory(historyId, historyData) {
    const data = DatabaseService.getSheetDataAsObjects(SHEETS.HISTORICOS);
    const index = data.findIndex(h => h.ID === historyId);
    
    if (index === -1) throw new Error('Histórico não encontrado');
    
    const rowData = [
      historyId,
      historyData.alunoId,
      historyData.anoLetivo,
      historyData.tipo || '',
      historyData.serie,
      historyData.escola || '',
      historyData.municipio || '',
      historyData.uf || '',
      historyData.diasLetivos || '200',
      historyData.chAnual || '800',
      historyData.situacao || 'Aprovado',
      historyData.faltas || '0',
      historyData.observacoes || ''
    ];
    
    DatabaseService.updateRow(SHEETS.HISTORICOS, index, rowData);
    return true;
  },
  
  /**
   * Obtém um histórico
   */
  getHistory(historyId) {
    const data = DatabaseService.getSheetDataAsObjects(SHEETS.HISTORICOS);
    const history = data.find(h => h.ID === historyId);
    
    if (!history) throw new Error('Histórico não encontrado');
    return history;
  },
  
  /**
   * Lista históricos de um aluno
   */
  getStudentHistories(studentId) {
    const data = DatabaseService.getSheetDataAsObjects(SHEETS.HISTORICOS);
    return data.filter(h => h.ALUNO_ID === studentId);
  },
  
  /**
   * Deleta um histórico
   */
  deleteHistory(historyId) {
    const data = DatabaseService.getSheetDataAsObjects(SHEETS.HISTORICOS);
    const index = data.findIndex(h => h.ID === historyId);
    
    if (index === -1) throw new Error('Histórico não encontrado');
    
    // Deleta notas associadas
    const grades = DatabaseService.getSheetDataAsObjects(SHEETS.NOTAS);
    const historyGrades = grades.filter(g => g.HISTORICO_ID === historyId);
    
    historyGrades.forEach(grade => {
      const gradeIndex = grades.indexOf(grade);
      DatabaseService.deleteRow(SHEETS.NOTAS, gradeIndex);
    });
    
    // Deleta histórico
    DatabaseService.deleteRow(SHEETS.HISTORICOS, index);
    return true;
  },
  
  /**
   * Lista todos os históricos
   */
  listHistories() {
    return DatabaseService.getSheetDataAsObjects(SHEETS.HISTORICOS);
  }
};

/**
 * Controlador de Notas
 */

const GradesController = {
  
  /**
   * Adiciona uma nota
   */
  addGrade(gradeData) {
    const grade = new GradeRecord(gradeData);
    
    // Valida
    const errors = grade.validate();
    if (errors.length > 0) throw new Error(errors.join(', '));
    
    // Gera ID
    grade.id = ConfigService.getNextGradeId();
    
    // Prepara dados
    const rowData = [
      grade.id,
      grade.historicoId,
      grade.disciplina,
      grade.nota,
      grade.cargaHoraria,
      grade.faltas
    ];
    
    // Insere
    DatabaseService.addRow(SHEETS.NOTAS, rowData);
    return grade.id;
  },
  
  /**
   * Atualiza uma nota
   */
  editGrade(gradeId, gradeData) {
    const grade = new GradeRecord(gradeData);
    grade.id = gradeId;
    
    // Valida
    const errors = grade.validate();
    if (errors.length > 0) throw new Error(errors.join(', '));
    
    // Encontra
    const data = DatabaseService.getSheetDataAsObjects(SHEETS.NOTAS);
    const index = data.findIndex(g => g.ID === gradeId);
    
    if (index === -1) throw new Error('Nota não encontrada');
    
    // Prepara dados
    const rowData = [
      grade.id,
      grade.historicoId,
      grade.disciplina,
      grade.nota,
      grade.cargaHoraria,
      grade.faltas
    ];
    
    // Atualiza
    DatabaseService.updateRow(SHEETS.NOTAS, index, rowData);
    return true;
  },
  
  /**
   * Obtém uma nota
   */
  getGrade(gradeId) {
    const data = DatabaseService.getSheetDataAsObjects(SHEETS.NOTAS);
    const grade = data.find(g => g.ID === gradeId);
    
    if (!grade) throw new Error('Nota não encontrada');
    return grade;
  },
  
  /**
   * Lista notas de um histórico
   */
  getHistoryGrades(historyId) {
    const data = DatabaseService.getSheetDataAsObjects(SHEETS.NOTAS);
    return data.filter(g => g.HISTORICO_ID === historyId);
  },
  
  /**
   * Deleta uma nota
   */
  deleteGrade(gradeId) {
    const data = DatabaseService.getSheetDataAsObjects(SHEETS.NOTAS);
    const index = data.findIndex(g => g.ID === gradeId);
    
    if (index === -1) throw new Error('Nota não encontrada');
    
    DatabaseService.deleteRow(SHEETS.NOTAS, index);
    return true;
  },
  
  /**
   * Lista todas as notas
   */
  listGrades() {
    return DatabaseService.getSheetDataAsObjects(SHEETS.NOTAS);
  }
};

/**
 * Controlador de Certificados
 */

const CertificateController = {
  
  /**
   * Emite um certificado
   */
  issueCertificate(certificateData) {
    if (!certificateData.alunoId) throw new Error('Aluno é obrigatório');
    if (!certificateData.etapa) throw new Error('Etapa é obrigatória');
    if (!certificateData.dataConclusao) throw new Error('Data de Conclusão é obrigatória');
    
    // Gera ID
    const id = ConfigService.getNextCertificateId();
    
    // Prepara dados
    const rowData = [
      id,
      certificateData.alunoId,
      certificateData.dataConclusao,
      certificateData.etapa,
      new Date()
    ];
    
    // Insere
    DatabaseService.addRow(SHEETS.CERTIFICADOS, rowData);
    return id;
  },
  
  /**
   * Obtém um certificado
   */
  getCertificate(certificateId) {
    const data = DatabaseService.getSheetDataAsObjects(SHEETS.CERTIFICADOS);
    const cert = data.find(c => c.ID === certificateId);
    
    if (!cert) throw new Error('Certificado não encontrado');
    return cert;
  },
  
  /**
   * Lista certificados de um aluno
   */
  getStudentCertificates(studentId) {
    const data = DatabaseService.getSheetDataAsObjects(SHEETS.CERTIFICADOS);
    return data.filter(c => c.ALUNO_ID === studentId);
  },
  
  /**
   * Deleta um certificado
   */
  deleteCertificate(certificateId) {
    const data = DatabaseService.getSheetDataAsObjects(SHEETS.CERTIFICADOS);
    const index = data.findIndex(c => c.ID === certificateId);
    
    if (index === -1) throw new Error('Certificado não encontrado');
    
    DatabaseService.deleteRow(SHEETS.CERTIFICADOS, index);
    return true;
  },
  
  /**
   * Lista todos os certificados
   */
  listCertificates() {
    return DatabaseService.getSheetDataAsObjects(SHEETS.CERTIFICADOS);
  }
};

// Compatibilidade
function getGradesController() {
  return GradesController;
}
