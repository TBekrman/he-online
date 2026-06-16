/**
 * Serviço de Autenticação
 */

const AuthService = {
  
  /**
   * Obtém o usuário logado
   */
  getCurrentUser() {
    const session = Session.getActiveUser();
    return {
      email: session.getEmail(),
      name: this.getUserDisplayName(session.getEmail())
    };
  },
  
  /**
   * Obtém o nome de exibição do usuário
   */
  getUserDisplayName(email) {
    try {
      const user = AdminDirectory.Users.get(email, {
        projection: 'BASIC'
      });
      return user.name.fullName || email;
    } catch (e) {
      return email;
    }
  },
  
  /**
   * Verifica se o usuário tem acesso
   */
  hasAccess() {
    return true; // Por enquanto, qualquer usuário logado tem acesso
  },
  
  /**
   * Obtém a URL da foto do usuário
   */
  getUserPhoto() {
    try {
      const email = Session.getActiveUser().getEmail();
      const user = AdminDirectory.Users.get(email, {
        projection: 'BASIC'
      });
      return user.thumbnailPhotoUrl || '';
    } catch (e) {
      return '';
    }
  }
};