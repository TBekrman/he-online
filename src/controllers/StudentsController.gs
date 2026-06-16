/**
 * Controlador de Alunos
 */

const StudentsController = {
  
  /**
   * Adiciona um novo aluno
   */
  addStudent(studentData) {
    const student = new Student(studentData);
    
    // Valida os dados
    const errors = student.validate();
    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }
    
    // Gera ID
    student.id = ConfigService.getNextStudentId();
    
    // Prepara os dados para inserção
    const rowData = [
      student.id,
      student.nome,
      student.naturalidade,
      student.uf,
      student.nacionalidade,
      student.sexo,
      student.dataNascimento,
      student.mae,
      student.pai,
      student.rg,
      student.orgaoExpedidor,
      student.ufRg,
      student.cpf,
      student.endereco,
      student.telefone,
      student.email,
      student.observacoes,
      new Date()
    ];
    
    // Insere na planilha
    DatabaseService.addRow(SHEETS.ALUNOS, rowData);
    
    return student.id;
  },
  
  /**
   * Atualiza um aluno existente
   */
  editStudent(studentId, studentData) {
    const student = new Student(studentData);
    student.id = studentId;
    
    // Valida os dados
    const errors = student.validate();
    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }
    
    // Encontra o aluno
    const data = DatabaseService.getSheetDataAsObjects(SHEETS.ALUNOS);
    const index = data.findIndex(s => s.ID === studentId);
    
    if (index === -1) {
      throw new Error('Aluno não encontrado');
    }
    
    // Prepara os dados para atualização
    const rowData = [
      student.id,
      student.nome,
      student.naturalidade,
      student.uf,
      student.nacionalidade,
      student.sexo,
      student.dataNascimento,
      student.mae,
      student.pai,
      student.rg,
      student.orgaoExpedidor,
      student.ufRg,
      student.cpf,
      student.endereco,
      student.telefone,
      student.email,
      student.observacoes,
      new Date()
    ];
    
    // Atualiza na planilha
    DatabaseService.updateRow(SHEETS.ALUNOS, index, rowData);
    
    return true;
  },
  
  /**
   * Obtém um aluno pelo ID
   */
  getStudent(studentId) {
    const data = DatabaseService.getSheetDataAsObjects(SHEETS.ALUNOS);
    const student = data.find(s => s.ID === studentId);
    
    if (!student) {
      throw new Error('Aluno não encontrado');
    }
    
    return student;
  },
  
  /**
   * Lista todos os alunos
   */
  listStudents() {
    return DatabaseService.getSheetDataAsObjects(SHEETS.ALUNOS);
  },
  
  /**
   * Pesquisa alunos
   */
  searchStudents(query) {
    const data = DatabaseService.getSheetDataAsObjects(SHEETS.ALUNOS);
    const lowerQuery = query.toLowerCase();
    
    return data.filter(student => {
      return student.NOME.toLowerCase().includes(lowerQuery) ||
             student.CPF.toLowerCase().includes(lowerQuery) ||
             student.EMAIL.toLowerCase().includes(lowerQuery);
    });
  },
  
  /**
   * Deleta um aluno
   */
  deleteStudent(studentId) {
    const data = DatabaseService.getSheetDataAsObjects(SHEETS.ALUNOS);
    const index = data.findIndex(s => s.ID === studentId);
    
    if (index === -1) {
      throw new Error('Aluno não encontrado');
    }
    
    // Também deleta históricos e certificados associados
    const histories = DatabaseService.getSheetDataAsObjects(SHEETS.HISTORICOS);
    const studentHistories = histories.filter(h => h.ALUNO_ID === studentId);
    
    studentHistories.forEach(history => {
      HistoryController.deleteHistory(history.ID);
    });
    
    // Deleta certificados
    const certificates = DatabaseService.getSheetDataAsObjects(SHEETS.CERTIFICADOS);
    const studentCerts = certificates.filter(c => c.ALUNO_ID === studentId);
    
    studentCerts.forEach(cert => {
      const certIndex = certificates.indexOf(cert);
      DatabaseService.deleteRow(SHEETS.CERTIFICADOS, certIndex);
    });
    
    // Deleta aluno
    DatabaseService.deleteRow(SHEETS.ALUNOS, index);
    
    return true;
  },
  
  /**
   * Obtém estatísticas
   */
  getStats() {
    const students = this.listStudents();
    const histories = DatabaseService.getSheetDataAsObjects(SHEETS.HISTORICOS);
    const certificates = DatabaseService.getSheetDataAsObjects(SHEETS.CERTIFICADOS);
    
    return {
      totalStudents: students.length,
      totalHistories: histories.length,
      totalCertificates: certificates.length,
      recentStudents: students.slice(-5).reverse(),
      recentHistories: histories.slice(-5).reverse()
    };
  }
};

// Compatibilidade com versões antigas
function getStudentsController() {
  return StudentsController;
}
