
import { ServiceCategory, ServicePricing, User } from './types';

export const COMMISSION_RATE = 0.25; // 25%

// Note: MOCK_USER is not used on the server, but we copy it for consistency.
export const MOCK_USER: User = {
  uid: 'user_123',
  firstName: 'Alex',
  lastName: 'Carter',
  email: 'alex.c@example.com',
  photoUrl: 'https://i.pravatar.cc/150?u=alexcarter',
  isPremium: true,
};

export const SERVICES_CATEGORIES: ServiceCategory[] = [
  // Top 4 (Home Display)
  { id: 'cat_apart', name: 'Appartement', description: 'Nettoyage complet', icon: '🏢' },
  { id: 'cat_villa', name: 'Villa', description: 'Nettoyage surface', icon: '🏡' },
  { id: 'cat_bureau', name: 'Bureau', description: 'Entretien pro', icon: '💼' },
  { id: 'cat_gaz', name: 'Gaz', description: 'Recharge express', icon: '🔥' }, // Promoted to top 4 for utility
  
  // Plus de services
  { id: 'cat_cours', name: 'Soutien Scolaire', description: 'Du CP au Lycée', icon: '🎓' },
  { id: 'cat_plomberie', name: 'Plomberie', description: 'Fuites & Install', icon: '🚰' },
  { id: 'cat_elec', name: 'Électricité', description: 'Pannes & Travaux', icon: '⚡' },
  { id: 'cat_jardin', name: 'Jardinage', description: 'Entretien espaces verts', icon: '🌿' },
  { id: 'cat_brico', name: 'Bricolage', description: 'Petites réparations', icon: '🔨' },
  { id: 'cat_peinture', name: 'Peinture', description: 'Murs & Plafonds', icon: '🎨' },
  { id: 'cat_demenagement', name: 'Déménageur', description: 'Transport & Main d\'oeuvre', icon: '📦' },
  { id: 'cat_livraison', name: 'Livraison', description: 'Colis & Courses', icon: '🛵' },
];

export const SERVICES_PRICING_RULES: ServicePricing[] = [
  // --- EXISTING ---
  {
    serviceCategoryId: 'cat_apart',
    rules: {
      type: 'fixed',
      options: [
        { key: 'studio', label: 'Studio', price: 10000 },
        { key: '2p', label: '2 pièces', price: 20000 },
        { key: '3p', label: '3 pièces', price: 30000 },
        { key: '4p', label: '4 pièces', price: 45000 },
      ],
    },
  },
  {
    serviceCategoryId: 'cat_villa',
    rules: {
      type: 'surface',
      unit: 'm²',
      options: [
        { key: 's', label: '< 30 m²', price: 15000, thresholds: [0, 29] },
        { key: 'm', label: '30-60 m²', price: 35000, thresholds: [30, 60] },
        { key: 'l', label: '60-90 m²', price: 50000, thresholds: [61, 90] },
        { key: 'xl', label: '90-120 m²', price: 65000, thresholds: [91, 120] },
        { key: 'xxl', label: '> 120 m²', price: 'quotation', thresholds: [121, Infinity] },
      ],
    },
  },
  {
    serviceCategoryId: 'cat_bureau',
    rules: {
      type: 'recurring',
      unit: 'm²',
      options: [
        { key: 'small_2x', label: '< 50m² - 2x/sem', price: 50000 },
        { key: 'medium_3x', label: '50-100m² - 3x/sem', price: 120000 },
        { key: 'large_5x', label: '> 100m² - 5x/sem', price: 250000 },
      ],
    },
  },
  {
    serviceCategoryId: 'cat_cours',
    rules: {
      type: 'level',
      unit: 'monthly',
      options: [
        { key: 'primaire', label: 'Primaire / h', price: 5000 },
        { key: 'college', label: 'Collège / h', price: 7500 },
        { key: 'lycee', label: 'Lycée / h', price: 10000 },
      ],
    },
  },

  // --- NEW SERVICES ---

  {
    serviceCategoryId: 'cat_gaz',
    rules: {
      type: 'fixed',
      options: [
        { key: 'b6', label: 'Bouteille B6 (6kg)', price: 3000 },
        { key: 'b12', label: 'Bouteille B12 (12kg)', price: 6000 },
        { key: 'b28', label: 'Bouteille B28 (28kg)', price: 14000 },
      ],
    },
  },
  {
    serviceCategoryId: 'cat_plomberie',
    rules: {
      type: 'fixed',
      options: [
        { key: 'diag', label: 'Diagnostic / Devis', price: 5000 },
        { key: 'fuite', label: 'Réparation Fuite Simple', price: 15000 },
        { key: 'debouche', label: 'Débouchage Canalisation', price: 25000 },
        { key: 'robinet', label: 'Changement Robinet', price: 10000 },
      ],
    },
  },
  {
    serviceCategoryId: 'cat_elec',
    rules: {
      type: 'fixed',
      options: [
        { key: 'diag', label: 'Diagnostic / Devis', price: 5000 },
        { key: 'panne', label: 'Recherche Panne', price: 15000 },
        { key: 'prise', label: 'Installation Prise/Interrupteur', price: 7500 },
      ],
    },
  },
  {
    serviceCategoryId: 'cat_jardin',
    rules: {
      type: 'surface',
      unit: 'm²',
      options: [
        { key: 'small', label: 'Petit Jardin (<50m²)', price: 15000 },
        { key: 'medium', label: 'Moyen Jardin (50-150m²)', price: 30000 },
        { key: 'large', label: 'Grand Jardin (>150m²)', price: 50000 },
      ],
    },
  },
  {
    serviceCategoryId: 'cat_brico',
    rules: {
      type: 'fixed',
      options: [
        { key: 'heure', label: '1 Heure de main d\'oeuvre', price: 5000 },
        { key: 'demi', label: 'Demi-journée (4h)', price: 18000 },
        { key: 'jour', label: 'Journée complète (8h)', price: 32000 },
      ],
    },
  },
  {
    serviceCategoryId: 'cat_peinture',
    rules: {
      type: 'surface', 
      unit: 'm²',
      options: [
        { key: 'mur', label: 'Mur Simple (au m²)', price: 2500 },
        { key: 'plafond', label: 'Plafond (au m²)', price: 3500 },
        { key: 'complet', label: 'Pièce complète (au sol)', price: 5000 },
      ],
    },
  },
  {
    serviceCategoryId: 'cat_demenagement',
    rules: {
      type: 'fixed',
      options: [
        { key: 'manutention', label: 'Aide manutention (4h)', price: 20000 },
        { key: 'camion_s', label: 'Camionette + Chauffeur', price: 40000 },
        { key: 'camion_l', label: 'Camion + 2 Déménageurs', price: 80000 },
      ],
    },
  },
  {
    serviceCategoryId: 'cat_livraison',
    rules: {
      type: 'fixed',
      options: [
        { key: 'z1', label: 'Zone 1 (Même commune)', price: 1500 },
        { key: 'z2', label: 'Zone 2 (Abidjan)', price: 3000 },
        { key: 'z3', label: 'Zone 3 (Grand Abidjan)', price: 5000 },
      ],
    },
  },
];
