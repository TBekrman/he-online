/**
 * Modelo de Aluno
 */

class Student {
  constructor(data = {}) {
    this.id = data.id || '';
    this.nome = data.nome || '';
    this.naturalidade = data.naturalidade || '';
    this.uf = data.uf || '';
    this.nacionalidade = data.nacionalidade || 'Brasileira';
    this.sexo = data.sexo || '';
    this.dataNascimento = data.dataNascimento || '';
    this.mae = data.mae || '';
    this.pai = data.pai || '';
    this.rg = data.rg || '';
    this.orgaoExpedidor = data.orgaoExpedidor || '';
    this.ufRg = data.ufRg || '';
    this.cpf = data.cpf || '';
    this.endereco = data.endereco || '';
    this.telefone = data.telefone || '';
    this.email = data.email || '';
    this.observacoes = data.observacoes || '';
    this.dataCadastro = data.dataCadastro || new Date();
  }

  /**
   * Valida os dados do aluno
   */
  validate() {
    const errors = [];
    
    if (!this.nome || this.nome.trim() === '') {
      errors.push('Nome é obrigatório');
    }
    
    if (!this.dataNascimento) {
      errors.push('Data de Nascimento é obrigatória');
    }
    
    if (this.cpf && this.cpf.trim() !== '' && !this.isValidCPF(this.cpf)) {
      errors.push('CPF inválido');
    }
    
    if (this.email && this.email.trim() !== '' && !this.isValidEmail(this.email)) {
      errors.push('Email inválido');
    }
    
    return errors;
  }

  /**
   * Valida CPF
   */
  isValidCPF(cpf) {
    cpf = cpf.replace(/[^\d]/g, '');
    
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
      return false;
    }
    
    let sum = 0;
    let remainder;
    
    for (let i = 1; i <= 9; i++) {
      sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    }
    
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.substring(9, 10))) return false;
    
    sum = 0;
    for (let i = 1; i <= 10; i++) {
      sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    }
    
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.substring(10, 11))) return false;
    
    return true;
  }

  /**
   * Valida Email
   */
  isValidEmail(email) {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(email);
  }

  /**
   * Converte para objeto
   */
  toObject() {
    return {
      id: this.id,
      nome: this.nome,
      naturalidade: this.naturalidade,
      uf: this.uf,
      nacionalidade: this.nacionalidade,
      sexo: this.sexo,
      dataNascimento: this.dataNascimento,
      mae: this.mae,
      pai: this.pai,
      rg: this.rg,
      orgaoExpedidor: this.orgaoExpedidor,
      ufRg: this.ufRg,
      cpf: this.cpf,
      endereco: this.endereco,
      telefone: this.telefone,
      email: this.email,
      observacoes: this.observacoes,
      dataCadastro: this.dataCadastro
    };
  }
}