/**
 * Modelo de Nota
 */

class GradeRecord {
  constructor(data = {}) {
    this.id = data.id || '';
    this.historicoId = data.historicoId || '';
    this.disciplina = data.disciplina || '';
    this.nota = data.nota || '';
    this.cargaHoraria = data.cargaHoraria || '';
    this.faltas = data.faltas || '0';
  }

  /**
   * Valida os dados da nota
   */
  validate() {
    const errors = [];
    
    if (!this.disciplina || this.disciplina.trim() === '') {
      errors.push('Disciplina é obrigatória');
    }
    
    if (!this.historicoId || this.historicoId.trim() === '') {
      errors.push('Histórico é obrigatório');
    }
    
    if (this.nota !== '' && isNaN(this.nota)) {
      errors.push('Nota deve ser um número');
    }
    
    if (this.nota !== '' && (this.nota < 0 || this.nota > 10)) {
      errors.push('Nota deve estar entre 0 e 10');
    }
    
    if (this.cargaHoraria !== '' && isNaN(this.cargaHoraria)) {
      errors.push('Carga Horária deve ser um número');
    }
    
    if (this.faltas !== '' && isNaN(this.faltas)) {
      errors.push('Faltas deve ser um número');
    }
    
    return errors;
  }

  /**
   * Converte para objeto
   */
  toObject() {
    return {
      id: this.id,
      historicoId: this.historicoId,
      disciplina: this.disciplina,
      nota: this.nota,
      cargaHoraria: this.cargaHoraria,
      faltas: this.faltas
    };
  }
}