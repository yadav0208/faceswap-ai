import type { ImageSourcePropType } from 'react-native';

export interface Studio {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  category: string;
  isPremium?: boolean;
  badge?: string;
}

// Only tools exposed by the current Studio and Explore experiences live here.
// All artwork is bundled locally so the app has no Unsplash runtime dependency.
export const STUDIOS: Studio[] = [
  {
    id: 'ai_portrait',
    title: 'AI Studio Portrait',
    subtitle: 'Professional studio-quality headshots',
    icon: 'person-circle-outline',
    category: 'photo',
  },
  {
    id: 'birthday',
    title: 'Birthday Photoshoots',
    subtitle: 'AI birthday portraits & celebration cards',
    icon: 'gift-outline',
    category: 'occasion',
    badge: 'NEW',
  },
  {
    id: 'futuristic_2026',
    title: 'Neon Future',
    subtitle: 'Violet cyber fashion with cinematic blue rim light',
    icon: 'color-wand-outline',
    category: 'photo',
  },
  {
    id: 'fantasy_armor',
    title: 'Golden Warrior',
    subtitle: 'Cinematic armor with a royal castle atmosphere',
    icon: 'shield-outline',
    category: 'photo',
  },
  {
    id: 'wedding_look',
    title: 'Ivory Royal',
    subtitle: 'Luxury wedding portrait with warm floral bokeh',
    icon: 'heart-outline',
    category: 'occasion',
  },
  {
    id: 'talking_photo',
    title: 'Talking Photo',
    subtitle: 'Animate your photo to speak & lip-sync',
    icon: 'mic-outline',
    category: 'video',
    isPremium: true,
  },
];

const PREMIUM_COVERS: Record<string, ImageSourcePropType> = {
  ai_portrait: require('../assets/templates/anva-formal-v2.png'),
  birthday: require('../assets/templates/anva-birthday-v2.png'),
  futuristic_2026: require('../assets/templates/anva-cyber-v2.png'),
  fantasy_armor: require('../assets/templates/anva-fantasy-v2.png'),
  wedding_look: require('../assets/templates/anva-wedding-v2.png'),
  talking_photo: require('../assets/templates/talking/news-presenter.png'),
};

const DEFAULT_PREMIUM_COVER = require('../assets/templates/anva-formal-v2.png');

export function getStudioImageSource(studioId: string): ImageSourcePropType {
  return getStudioFallbackSource(studioId);
}

export function getStudioFallbackSource(studioId: string): ImageSourcePropType {
  return PREMIUM_COVERS[studioId] ?? DEFAULT_PREMIUM_COVER;
}
