// Each studio card definition — matches the screenshot exactly
export interface Studio {
  id: string;
  title: string;
  subtitle: string;
  icon: string;          // Ionicons name
  // Unsplash image URLs (free, no auth needed)
  imageUrl: string;
  category: string;
  isPremium?: boolean;
}

export const STUDIOS: Studio[] = [
  {
    id: 'fitness',
    title: 'Fitness',
    subtitle: 'Sculpted physique',
    icon: 'barbell-outline',
    imageUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&q=80',
    category: 'body',
  },
  {
    id: 'outfit',
    title: 'Outfit Studio',
    subtitle: 'Style your fit',
    icon: 'shirt-outline',
    imageUrl: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&q=80',
    category: 'fashion',
  },
  {
    id: 'hairstyle',
    title: 'Hairstyle',
    subtitle: 'New look, new you',
    icon: 'cut-outline',
    imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=80',
    category: 'beauty',
  },
  {
    id: 'makeup',
    title: 'Makeup',
    subtitle: 'Glow up artistry',
    icon: 'color-palette-outline',
    imageUrl: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600&q=80',
    category: 'beauty',
  },
  {
    id: 'professional',
    title: 'Professional',
    subtitle: 'LinkedIn ready',
    icon: 'briefcase-outline',
    imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&q=80',
    category: 'work',
  },
  {
    id: 'travel',
    title: 'Travel',
    subtitle: 'Visit anywhere',
    icon: 'airplane-outline',
    imageUrl: 'https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=600&q=80',
    category: 'lifestyle',
  },
  {
    id: 'wedding',
    title: 'Wedding',
    subtitle: 'Dream day looks',
    icon: 'rose-outline',
    imageUrl: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=600&q=80',
    category: 'special',
  },
  {
    id: 'avatar',
    title: 'Avatar',
    subtitle: 'Stylized portraits',
    icon: 'person-outline',
    imageUrl: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=600&q=80',
    category: 'digital',
    isPremium: true,
  },
];
