/**
 * Serviço de Configuração
 */

const ConfigService = {
  
  /**
   * Inicializa valores padrão de configuração
   */
  initializeDefaults() {
    const sheet = DatabaseService.getSheet(SHEETS.CONFIG);
    const data = DatabaseService.getSheetData(SHEETS.CONFIG);
    
    // Verifica se já existem configurações
    if (data.length > 0) return;
    
    // Adiciona configurações padrão
    const defaults = [
      ['SCHOOL_NAME', 'Minha Escola'],
      ['SCHOOL_CITY', 'Minha Cidade'],
      ['SCHOOL_STATE', 'MG'],
      ['DIRECTOR_NAME', 'Diretor da Escola'],
      ['LAST_STUDENT_ID', '0'],
      ['LAST_HISTORY_ID', '0'],
      ['LAST_CERTIFICATE_ID', '0'],
      ['LAST_GRADE_ID', '0']
    ];
    
    defaults.forEach(config => {
      DatabaseService.addRow(SHEETS.CONFIG, config);
    });
  },
  
  /**
   * Obtém um valor de configuração
   */
  getValue(key) {
    const data = DatabaseService.getSheetDataAsObjects(SHEETS.CONFIG);
    const config = data.find(c => c.CHAVE === key);
    return config ? config.VALOR : null;
  },
  
  /**
   * Define um valor de configuração
   */
  setValue(key, value) {
    const data = DatabaseService.getSheetDataAsObjects(SHEETS.CONFIG);
    const index = data.findIndex(c => c.CHAVE === key);
    
    if (index !== -1) {
      // Atualiza existente
      DatabaseService.updateRow(SHEETS.CONFIG, index, [key, value]);
    } else {
      // Cria novo
      DatabaseService.addRow(SHEETS.CONFIG, [key, value]);
    }
  },
  
  /**
   * Gera próximo ID de aluno
   */
  getNextStudentId() {
    const lastId = this.getValue('LAST_STUDENT_ID');
    const nextId = parseInt(lastId || '0') + 1;
    this.setValue('LAST_STUDENT_ID', nextId.toString());
    return 'ALN' + String(nextId).padStart(6, '0');
  },
  
  /**
   * Gera próximo ID de histórico
   */
  getNextHistoryId() {
    const lastId = this.getValue('LAST_HISTORY_ID');
    const nextId = parseInt(lastId || '0') + 1;
    this.setValue('LAST_HISTORY_ID', nextId.toString());
    return 'HST' + String(nextId).padStart(6, '0');
  },
  
  /**
   * Gera próximo ID de certificado
   */
  getNextCertificateId() {
    const lastId = this.getValue('LAST_CERTIFICATE_ID');
    const nextId = parseInt(lastId || '0') + 1;
    this.setValue('LAST_CERTIFICATE_ID', nextId.toString());
    return 'CRT' + String(nextId).padStart(6, '0');
  },
  
  /**
   * Gera próximo ID de nota
   */
  getNextGradeId() {
    const lastId = this.getValue('LAST_GRADE_ID');
    const nextId = parseInt(lastId || '0') + 1;
    this.setValue('LAST_GRADE_ID', nextId.toString());
    return 'GRD' + String(nextId).padStart(6, '0');
  },
  
  /**
   * Obtém todas as configurações
   */
  getAll() {
    return DatabaseService.getSheetDataAsObjects(SHEETS.CONFIG);
  }
};
