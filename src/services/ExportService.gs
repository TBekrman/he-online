/**
 * Serviço de Exportação
 */

const ExportService = {
  
  /**
   * Exporta para CSV
   */
  exportToCSV(data, filename) {
    const csv = this.convertToCSV(data);
    const blob = Utilities.newBlob(csv, 'text/csv', filename + '.csv');
    return blob;
  },
  
  /**
   * Converte dados para CSV
   */
  convertToCSV(data) {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvHeaders = headers.map(h => `"${h}"`).join(',');
    
    const rows = data.map(row => {
      return headers.map(header => {
        const value = row[header];
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return `"${value}"`;
      }).join(',');
    });
    
    return [csvHeaders, ...rows].join('\n');
  },
  
  /**
   * Gera PDF de histórico escolar
   */
  generateHistoryPDF(studentData, historyData, gradesData) {
    const html = this.buildHistoryHTML(studentData, historyData, gradesData);
    const blob = Utilities.newBlob(html, 'text/html', 'historico.html');
    return blob;
  },
  
  /**
   * Constrói HTML do histórico
   */
  buildHistoryHTML(student, history, grades) {
    const school = ConfigService.getValue('SCHOOL_NAME') || 'Escola';
    const city = ConfigService.getValue('SCHOOL_CITY') || '';
    const state = ConfigService.getValue('SCHOOL_STATE') || '';
    const director = ConfigService.getValue('DIRECTOR_NAME') || '';
    
    let gradesHTML = '';
    if (grades && grades.length > 0) {
      gradesHTML = '<table style="width:100%; border-collapse: collapse; margin-top: 20px;"><tr style="background-color: #f0f0f0;"><th style="border: 1px solid #ddd; padding: 8px;">Disciplina</th><th style="border: 1px solid #ddd; padding: 8px;">Nota</th><th style="border: 1px solid #ddd; padding: 8px;">Carga Horária</th><th style="border: 1px solid #ddd; padding: 8px;">Faltas</th></tr>';
      
      grades.forEach(grade => {
        gradesHTML += `<tr>
          <td style="border: 1px solid #ddd; padding: 8px;">${Helpers.escapeHtml(grade.DISCIPLINA)}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${grade.NOTA}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${grade.CARGA_HORARIA}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${grade.FALTAS}</td>
        </tr>`;
      });
      
      gradesHTML += '</table>';
    }
    
    const html = `<!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Histórico Escolar</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { margin: 0; font-size: 18px; }
        .header p { margin: 5px 0; font-size: 12px; }
        .title { text-align: center; font-size: 16px; font-weight: bold; margin: 30px 0; }
        .section { margin-bottom: 20px; }
        .section-title { font-weight: bold; margin-bottom: 10px; border-bottom: 1px solid #000; }
        .row { display: flex; justify-content: space-between; margin: 5px 0; }
        .footer { margin-top: 50px; text-align: center; font-size: 12px; }
        .signature { display: flex; justify-content: space-around; margin-top: 50px; text-align: center; }
        .signature-line { width: 200px; padding-top: 40px; border-top: 1px solid #000; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${Helpers.escapeHtml(school)}</h1>
        <p>${Helpers.escapeHtml(city)}, ${Helpers.escapeHtml(state)}</p>
        <p>CNPJ: ________________</p>
      </div>
      
      <div class="title">HISTÓRICO ESCOLAR</div>
      
      <div class="section">
        <div class="section-title">Dados Pessoais</div>
        <div class="row">
          <span><strong>Nome:</strong> ${Helpers.escapeHtml(student.NOME)}</span>
        </div>
        <div class="row">
          <span><strong>Data de Nascimento:</strong> ${student.DATA_NASCIMENTO}</span>
          <span><strong>CPF:</strong> ${student.CPF}</span>
        </div>
        <div class="row">
          <span><strong>Naturalidade:</strong> ${Helpers.escapeHtml(student.NATURALIDADE)}</span>
          <span><strong>UF:</strong> ${student.UF}</span>
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">Dados do Histórico</div>
        <div class="row">
          <span><strong>Ano Letivo:</strong> ${history.ANO_LETIVO}</span>
          <span><strong>Série:</strong> ${history.SERIE}</span>
        </div>
        <div class="row">
          <span><strong>Tipo:</strong> ${history.TIPO}</span>
          <span><strong>Situação:</strong> ${history.SITUACAO}</span>
        </div>
        <div class="row">
          <span><strong>Escola:</strong> ${Helpers.escapeHtml(history.ESCOLA)}</span>
        </div>
        <div class="row">
          <span><strong>Dias Letivos:</strong> ${history.DIAS_LETIVOS}</span>
          <span><strong>Carga Horária Anual:</strong> ${history.CH_ANUAL}</span>
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">Disciplinas e Notas</div>
        ${gradesHTML}
      </div>
      
      <div class="footer">
        <p>Documento gerado em ${Helpers.formatDate(new Date())}</p>
      </div>
      
      <div class="signature">
        <div class="signature-line">
          <p>${Helpers.escapeHtml(director)}</p>
          <p>Diretor</p>
        </div>
      </div>
    </body>
    </html>`;
    
    return html;
  },
  
  /**
   * Gera PDF de certificado
   */
  generateCertificatePDF(studentData, certificateData) {
    const school = ConfigService.getValue('SCHOOL_NAME') || 'Escola';
    const director = ConfigService.getValue('DIRECTOR_NAME') || '';
    
    const html = `<!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Certificado</title>
      <style>
        body { font-family: Georgia, serif; text-align: center; padding: 40px; background: #f5f5f5; }
        .certificate { background: white; padding: 60px; max-width: 800px; margin: 0 auto; border: 3px solid #d4af37; }
        .header { font-size: 24px; font-weight: bold; margin-bottom: 40px; }
        .content { font-size: 16px; line-height: 1.8; margin: 40px 0; }
        .name { font-size: 20px; font-weight: bold; color: #d4af37; }
        .footer { margin-top: 60px; font-size: 12px; }
        .signature { margin-top: 40px; }
        .line { width: 300px; height: 1px; background: #000; margin: 20px auto; }
      </style>
    </head>
    <body>
      <div class="certificate">
        <div class="header">CERTIFICADO</div>
        
        <div class="content">
          <p>Certificamos que</p>
          <p class="name">${Helpers.escapeHtml(studentData.NOME)}</p>
          <p>completou com êxito a etapa de <strong>${Helpers.escapeHtml(certificateData.ETAPA)}</strong></p>
          <p>em <strong>${certificateData.DATA_CONCLUSAO}</strong></p>
          <p>na instituição</p>
          <p><strong>${Helpers.escapeHtml(school)}</strong></p>
        </div>
        
        <div class="signature">
          <p>Emitido em ${certificateData.DATA_EMISSAO}</p>
          <div class="line"></div>
          <p>${Helpers.escapeHtml(director)}</p>
          <p>Diretor</p>
        </div>
        
        <div class="footer">
          <p>Este certificado é válido apenas como comprovante de frequência e desempenho escolar.</p>
        </div>
      </div>
    </body>
    </html>`;
    
    const blob = Utilities.newBlob(html, 'text/html', 'certificado.html');
    return blob;
  }
};