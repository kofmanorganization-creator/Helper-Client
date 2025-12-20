
import { ServiceCategory, ServicePricing, User, HelperProWorker } from './types';

export const COMMISSION_RATE = 0.25;

export const MOCK_USER: User = {
  uid: 'user_123',
  firstName: 'Alex',
  lastName: 'Carter',
  email: 'alex.c@example.com',
  photoUrl: 'https://i.pravatar.cc/150?u=alexcarter',
  isPremium: true,
};

export interface FeaturedWorker extends Partial<HelperProWorker> {
    rating: number;
    experience: string;
    specialty: string;
}

export const TOP_RATED_MAIDS: FeaturedWorker[] = [
    {
        id: 'maid_1',
        firstName: 'Mariam',
        lastName: 'K.',
        photoUrl: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=400&auto=format&fit=crop',
        commune: 'Cocody',
        rating: 4.9,
        experience: '5 ans',
        specialty: 'Cuisine & Ménage'
    },
    {
        id: 'maid_2',
        firstName: 'Awa',
        lastName: 'D.',
        photoUrl: 'https://images.unsplash.com/photo-1589156229687-496a31ad1d1f?q=80&w=400&auto=format&fit=crop',
        commune: 'Marcory',
        rating: 4.8,
        experience: '3 ans',
        specialty: 'Garde d\'enfants'
    },
    {
        id: 'maid_3',
        firstName: 'Sali',
        lastName: 'T.',
        photoUrl: 'https://images.unsplash.com/photo-1548142813-c348350df52b?q=80&w=400&auto=format&fit=crop',
        commune: 'Riviera',
        rating: 5.0,
        experience: '7 ans',
        specialty: 'Repassage Expert'
    },
    {
        id: 'maid_4',
        firstName: 'Binta',
        lastName: 'S.',
        photoUrl: 'https://images.unsplash.com/photo-1523824921871-d6f1a15151f1?q=80&w=400&auto=format&fit=crop',
        commune: 'Plateau',
        rating: 4.9,
        experience: '4 ans',
        specialty: 'Grand Nettoyage'
    }
];

export const SERVICES_CATEGORIES: ServiceCategory[] = [
  { id: 'cat_helper_pro', name: 'Helper Pro', description: 'Maids certifiées & garanties', icon: '⭐', isPremium: true },
  { id: 'cat_apart', name: 'Appartement', description: 'Nettoyage complet', icon: '🏢' },
  { id: 'cat_villa', name: 'Villa', description: 'Nettoyage surface', icon: '🏡' },
  { id: 'cat_bureau', name: 'Bureau', description: 'Entretien pro', icon: '💼' },
  { id: 'cat_gaz', name: 'Gaz', description: 'Recharge express', icon: '🔥' },
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
  {
    serviceCategoryId: 'cat_helper_pro',
    rules: {
      type: 'helper_pro',
      unit: 'monthly',
      options: [
        { 
          key: 'house_maintenance', 
          label: 'Entretien maison', 
          price: 45000,
          extras: [
            { key: 'child_care', label: 'Garde enfant', price: 10000 },
            { key: 'cooking', label: 'Cuisine quotidienne', price: 15000 }
          ]
        },
        { 
          key: 'nanny_pro', 
          label: 'Garde enfant', 
          price: 40000,
          extras: [
            { key: 'cleaning_light', label: 'Ménage léger', price: 10000 },
            { key: 'cooking_light', label: 'Cuisine simple', price: 15000 }
          ]
        },
        { 
          key: 'cook_pro', 
          label: 'Cuisinier pro', 
          price: 200000,
          extras: [
            { key: 'waiter', label: 'Service à table', price: 30000 }
          ]
        },
      ],
    },
  },
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
];
