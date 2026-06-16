/**
 * Serviço de Manipulação de Planilhas
 */

const DatabaseService = {
  
  /**
   * Inicializa o banco de dados criando as abas necessárias
   */
  initializeDatabase() {
    const ss = SPREADSHEET;
    
    // Cria abas se não existirem
    const requiredSheets = [
      SHEETS.ALUNOS,
      SHEETS.HISTORICOS,
      SHEETS.NOTAS,
      SHEETS.CERTIFICADOS,
      SHEETS.CONFIG
    ];
    
    requiredSheets.forEach(sheetName => {
      if (!ss.getSheetByName(sheetName)) {
        const newSheet = ss.insertSheet(sheetName);
        
        // Adiciona headers
        if (sheetName === SHEETS.ALUNOS) {
          this.createStudentsSheet(newSheet);
        } else if (sheetName === SHEETS.HISTORICOS) {
          this.createHistoriesSheet(newSheet);
        } else if (sheetName === SHEETS.NOTAS) {
          this.createGradesSheet(newSheet);
        } else if (sheetName === SHEETS.CERTIFICADOS) {
          this.createCertificatesSheet(newSheet);
        } else if (sheetName === SHEETS.CONFIG) {
          this.createConfigSheet(newSheet);
        }
      }
    });
  },
  
  /**
   * Cria a aba de alunos com headers
   */
  createStudentsSheet(sheet) {
    const headers = ['ID', 'NOME', 'NATURALIDADE', 'UF', 'NACIONALIDADE', 'SEXO', 
                     'DATA_NASCIMENTO', 'MAE', 'PAI', 'RG', 'ORGAO_EXPEDIDOR', 'UF_RG', 
                     'CPF', 'ENDERECO', 'TELEFONE', 'EMAIL', 'OBSERVACOES', 'DATA_CADASTRO'];
    sheet.appendRow(headers);
    
    // Formata header
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#007bff').setFontColor('white').setFontWeight('bold');
    
    // Auto-resize
    sheet.autoResizeColumns(1, headers.length);
  },
  
  /**
   * Cria a aba de históricos
   */
  createHistoriesSheet(sheet) {
    const headers = ['ID', 'ALUNO_ID', 'ANO_LETIVO', 'TIPO', 'SERIE', 'ESCOLA', 
                     'MUNICIPIO', 'UF', 'DIAS_LETIVOS', 'CH_ANUAL', 'SITUACAO', 
                     'FALTAS', 'OBSERVACOES'];
    sheet.appendRow(headers);
    
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#28a745').setFontColor('white').setFontWeight('bold');
    
    sheet.autoResizeColumns(1, headers.length);
  },
  
  /**
   * Cria a aba de notas
   */
  createGradesSheet(sheet) {
    const headers = ['ID', 'HISTORICO_ID', 'DISCIPLINA', 'NOTA', 'CARGA_HORARIA', 'FALTAS'];
    sheet.appendRow(headers);
    
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#ffc107').setFontColor('white').setFontWeight('bold');
    
    sheet.autoResizeColumns(1, headers.length);
  },
  
  /**
   * Cria a aba de certificados
   */
  createCertificatesSheet(sheet) {
    const headers = ['ID', 'ALUNO_ID', 'DATA_CONCLUSAO', 'ETAPA', 'DATA_EMISSAO'];
    sheet.appendRow(headers);
    
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#dc3545').setFontColor('white').setFontWeight('bold');
    
    sheet.autoResizeColumns(1, headers.length);
  },
  
  /**
   * Cria a aba de configurações
   */
  createConfigSheet(sheet) {
    const headers = ['CHAVE', 'VALOR'];
    sheet.appendRow(headers);
    
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#6c757d').setFontColor('white').setFontWeight('bold');
  },
  
  /**
   * Obtém uma aba pelo nome
   */
  getSheet(sheetName) {
    const sheet = SPREADSHEET.getSheetByName(sheetName);
    if (!sheet) {
      throw new Error(`Aba ${sheetName} não encontrada`);
    }
    return sheet;
  },
  
  /**
   * Lê todos os dados da aba
   */
  getSheetData(sheetName) {
    const sheet = this.getSheet(sheetName);
    const lastRow = sheet.getLastRow();
    
    if (lastRow <= 1) return [];
    
    return sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
  },
  
  /**
   * Lê dados com headers como objeto
   */
  getSheetDataAsObjects(sheetName) {
    const sheet = this.getSheet(sheetName);
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    
    if (lastRow <= 1) return [];
    
    const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    const values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
    
    return values.map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index];
      });
      return obj;
    });
  },
  
  /**
   * Adiciona uma linha
   */
  addRow(sheetName, rowData) {
    const sheet = this.getSheet(sheetName);
    sheet.appendRow(rowData);
  },
  
  /**
   * Atualiza uma linha
   */
  updateRow(sheetName, rowIndex, rowData) {
    const sheet = this.getSheet(sheetName);
    const range = sheet.getRange(rowIndex + 1, 1, 1, rowData.length);
    range.setValues([rowData]);
  },
  
  /**
   * Deleta uma linha
   */
  deleteRow(sheetName, rowIndex) {
    const sheet = this.getSheet(sheetName);
    sheet.deleteRow(rowIndex + 1);
  },
  
  /**
   * Busca uma linha por coluna
   */
  findRow(sheetName, columnIndex, value) {
    const data = this.getSheetData(sheetName);
    const headerRow = this.getSheet(sheetName).getRange(1, 1, 1, this.getSheet(sheetName).getLastColumn()).getValues()[0];
    
    for (let i = 0; i < data.length; i++) {
      if (data[i][columnIndex - 1] === value) {
        return { index: i, data: data[i] };
      }
    }
    
    return null;
  }
};