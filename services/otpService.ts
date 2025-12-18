
export class OtpService {
  /**
   * Vérifie si le numéro est au format ivoirien (10 chiffres).
   */
  isValidPhone(phone: string): boolean {
    return /^\d{10}$/.test(phone);
  }

  /**
   * Vérifie si le mot de passe est un code à 6 chiffres.
   */
  isValidPassword(password: string): boolean {
    return /^\d{6}$/.test(password);
  }

  cleanup(): void {
    // Plus de nettoyage nécessaire (reCAPTCHA supprimé)
  }
}

export const otpService = new OtpService();
