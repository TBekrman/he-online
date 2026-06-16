/**
 * Funções Auxiliares
 */

const Helpers = {
  
  /**
   * Valida email
   */
  validateEmail(email) {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(String(email).toLowerCase());
  },
  
  /**
   * Formata data
   */
  formatDate(date) {
    if (!date) return '';
    try {
      const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
      return new Date(date).toLocaleDateString('pt-BR', options);
    } catch (e) {
      return date.toString();
    }
  },
  
  /**
   * Formata data com hora
   */
  formatDateTime(date) {
    if (!date) return '';
    try {
      const options = { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      };
      return new Date(date).toLocaleDateString('pt-BR', options);
    } catch (e) {
      return date.toString();
    }
  },
  
  /**
   * Gera ID único
   */
  generateUniqueId() {
    return 'id-' + Math.random().toString(36).substr(2, 16);
  },
  
  /**
   * Verifica se valor está vazio
   */
  isEmpty(value) {
    return value === null || value === undefined || value === '' || (typeof value === 'string' && value.trim() === '');
  },
  
  /**
   * Escapa caracteres HTML
   */
  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },
  
  /**
   * Escapa HTML no lado do servidor
   */
  escapeHtmlServer(text) {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },
  
  /**
   * Valida CPF
   */
  validateCPF(cpf) {
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
  },
  
  /**
   * Formata CPF
   */
  formatCPF(cpf) {
    cpf = cpf.replace(/[^\d]/g, '');
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  },
  
  /**
   * Formata telefone
   */
  formatPhone(phone) {
    phone = phone.replace(/[^\d]/g, '');
    if (phone.length === 11) {
      return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    if (phone.length === 10) {
      return phone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return phone;
  },
  
  /**
   * Valida campo obrigatório
   */
  validateRequired(value, fieldName) {
    if (this.isEmpty(value)) {
      throw new Error(`${fieldName} é obrigatório`);
    }
  },
  
  /**
   * Capitaliza primeira letra
   */
  capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  },
  
  /**
   * Converte para maiúsculas
   */
  toUpperCase(str) {
    if (!str) return '';
    return str.toUpperCase();
  },
  
  /**
   * Converte para minúsculas
   */
  toLowerCase(str) {
    if (!str) return '';
    return str.toLowerCase();
  },
  
  /**
   * Calcula idade
   */
  calculateAge(birthDate) {
    if (!birthDate) return 0;
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  },
  
  /**
   * Trunca texto
   */
  truncate(text, length) {
    if (!text) return '';
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
  },
  
  /**
   * Remove acentos
   */
  removeAccents(text) {
    if (!text) return '';
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }
};