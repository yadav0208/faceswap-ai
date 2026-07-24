export interface Studio {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  imageUrl: string;
  category: string;
  isPremium?: boolean;
  badge?: string;
}

export const STUDIOS: Studio[] = [
  // ── Trending ──────────────────────────────────────────────────────────────
  {
    id: 'ai_videos',
    title: 'Create Fun AI Videos',
    subtitle: 'Turn your photo into viral video clips',
    icon: 'film-outline',
    imageUrl: 'https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=600&h=800&fit=crop&q=85',
    category: 'trending',
    badge: 'HOT',
  },
  {
    id: 'photo_styles',
    title: 'Trending AI Photo Styles',
    subtitle: '1996, 2026 & viral retro aesthetics',
    icon: 'sparkles-outline',
    imageUrl: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&h=800&fit=crop&q=85',
    category: 'trending',
    badge: 'TRENDING',
  },
  {
    id: 'birthday',
    title: 'Birthday Photoshoots',
    subtitle: 'AI birthday portraits & celebration cards',
    icon: 'gift-outline',
    imageUrl: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=600&h=800&fit=crop&q=85',
    category: 'trending',
    badge: 'NEW',
  },
  {
    id: 'stadium_cam',
    title: 'AI Stadium Cam Trend',
    subtitle: 'Put yourself in a live stadium crowd',
    icon: 'people-outline',
    imageUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&h=800&fit=crop&q=85',
    category: 'trending',
    badge: 'TRENDING',
  },
  // ── AI Videos ────────────────────────────────────────────────────────────
  {
    id: 'horse_riding',
    title: 'Horse Riding Video',
    subtitle: 'Cinematic clip riding through a scene',
    icon: 'play-circle-outline',
    imageUrl: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=600&h=800&fit=crop&q=85',
    category: 'video',
    badge: 'HOT',
  },
  {
    id: 'fantasy_armor',
    title: 'Fantasy Armor',
    subtitle: 'Transform into a fantasy warrior',
    icon: 'shield-outline',
    imageUrl: 'https://images.unsplash.com/photo-1535666669445-e8c15cd2e7d9?w=600&h=800&fit=crop&q=85',
    category: 'video',
  },
  {
    id: 'dance_video',
    title: 'Viral Dance Video',
    subtitle: 'Make your photo bust a move',
    icon: 'musical-notes-outline',
    imageUrl: 'https://images.unsplash.com/photo-1547153760-18fc86324498?w=600&h=800&fit=crop&q=85',
    category: 'video',
    badge: 'HOT',
  },
  {
    id: 'talking_photo',
    title: 'Talking Photo',
    subtitle: 'Animate your photo to speak & lip-sync',
    icon: 'mic-outline',
    imageUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&h=800&fit=crop&q=85',
    category: 'video',
    isPremium: true,
  },
  // ── AI Photo Styles ───────────────────────────────────────────────────────
  {
    id: 'retro_1996',
    title: '1996 Retro Style',
    subtitle: 'Classic 90s film photo aesthetic',
    icon: 'camera-outline',
    imageUrl: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&h=800&fit=crop&q=85',
    category: 'photo',
    badge: 'TRENDING',
  },
  {
    id: 'futuristic_2026',
    title: '2026 Futuristic',
    subtitle: 'Sleek modern AI-enhanced portraits',
    icon: 'color-wand-outline',
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=800&fit=crop&q=85',
    category: 'photo',
    badge: 'NEW',
  },
  {
    id: 'anime_style',
    title: 'Anime / Manga Style',
    subtitle: 'Turn yourself into anime art',
    icon: 'easel-outline',
    imageUrl: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=600&h=800&fit=crop&q=85',
    category: 'photo',
    badge: 'HOT',
  },
  {
    id: 'ai_portrait',
    title: 'AI Studio Portrait',
    subtitle: 'Professional studio-quality headshots',
    icon: 'person-circle-outline',
    imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&h=800&fit=crop&q=85',
    category: 'photo',
  },
  // ── Special Occasions ─────────────────────────────────────────────────────
  {
    id: 'birthday_queen',
    title: 'Birthday Queen / King',
    subtitle: 'Crown yourself for your special day',
    icon: 'rose-outline',
    imageUrl: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=600&h=800&fit=crop&q=85',
    category: 'occasion',
    badge: 'NEW',
  },
  {
    id: 'wedding_look',
    title: 'Wedding Look',
    subtitle: 'Bridal & groom AI photoshoot',
    icon: 'heart-outline',
    imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&h=800&fit=crop&q=85',
    category: 'occasion',
  },
  {
    id: 'graduation',
    title: 'Graduation Photo',
    subtitle: 'Celebrate your achievement in style',
    icon: 'school-outline',
    imageUrl: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=600&h=800&fit=crop&q=85',
    category: 'occasion',
  },
  // ── Kids Fun ──────────────────────────────────────────────────────────────
  {
    id: 'kids_cartoon',
    title: 'Kids Cartoon Hero',
    subtitle: 'Become your favourite cartoon character',
    icon: 'happy-outline',
    imageUrl: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=600&h=800&fit=crop&q=85',
    category: 'kids',
    badge: 'NEW',
  },
  {
    id: 'kids_superhero',
    title: 'Kids Superhero',
    subtitle: 'Fly high as a superhero',
    icon: 'flash-outline',
    imageUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&h=800&fit=crop&q=85',
    category: 'kids',
    badge: 'HOT',
  },
  {
    id: 'kids_fairy_tale',
    title: 'Fairy Tale Story',
    subtitle: 'Step into a magical fairy-tale world',
    icon: 'star-outline',
    imageUrl: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=600&h=800&fit=crop&q=85',
    category: 'kids',
    badge: 'TRENDING',
  },
  {
    id: 'kids_space',
    title: 'Space Adventure',
    subtitle: 'Become an astronaut exploring space',
    icon: 'planet-outline',
    imageUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=600&h=800&fit=crop&q=85',
    category: 'kids',
  },
  // ── Face Swap & Edit ──────────────────────────────────────────────────────
  {
    id: 'face_swap',
    title: 'Face Swap',
    subtitle: 'Swap faces with anyone in any photo',
    icon: 'swap-horizontal-outline',
    imageUrl: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&h=800&fit=crop&q=85',
    category: 'swap',
    badge: 'HOT',
  },
  {
    id: 'outfit_tryon',
    title: 'Outfit Try-On',
    subtitle: 'Virtually try on any outfit or style',
    icon: 'shirt-outline',
    imageUrl: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600&h=800&fit=crop&q=85',
    category: 'swap',
    badge: 'NEW',
    isPremium: true,
  },
  {
    id: 'age_filter',
    title: 'Age Filter',
    subtitle: 'See yourself younger or older',
    icon: 'hourglass-outline',
    imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&h=800&fit=crop&q=85',
    category: 'swap',
  },
];

const PREMIUM_COVERS: Record<string, ImageSourcePropType> = {
  ai_videos: require('../assets/templates/anva-street-v2.png'),
  photo_styles: require('../assets/templates/anva-formal-v2.png'),
  birthday: require('../assets/templates/anva-birthday-v2.png'),
  stadium_cam: require('../assets/templates/anva-street-v2.png'),
  horse_riding: require('../assets/templates/anva-street-v2.png'),
  dance_video: require('../assets/templates/anva-birthday-v2.png'),
  talking_photo: require('../assets/templates/anva-formal-v2.png'),
  retro_1996: require('../assets/templates/anva-formal-v2.png'),
  birthday_queen: require('../assets/templates/anva-birthday-v2.png'),
  futuristic_2026: require('../assets/templates/anva-cyber-v2.png'),
  anime_style: require('../assets/templates/anva-cyber-v2.png'),
  kids_cartoon: require('../assets/templates/anva-birthday-v2.png'),
  kids_fairy_tale: require('../assets/templates/anva-wedding-v2.png'),
  kids_space: require('../assets/templates/anva-cyber-v2.png'),
  fantasy_armor: require('../assets/templates/anva-fantasy-v2.png'),
  kids_superhero: require('../assets/templates/anva-fantasy-v2.png'),
  wedding_look: require('../assets/templates/anva-wedding-v2.png'),
  ai_portrait: require('../assets/templates/anva-formal-v2.png'),
  graduation: require('../assets/templates/anva-formal-v2.png'),
  face_swap: require('../assets/templates/anva-formal-v2.png'),
  outfit_tryon: require('../assets/templates/anva-street-v2.png'),
  age_filter: require('../assets/templates/anva-formal-v2.png'),
};

const DEFAULT_PREMIUM_COVER = require('../assets/templates/anva-street-v2.png');

export function getStudioImageSource(studioId: string): ImageSourcePropType {
  const studio = STUDIOS.find((item) => item.id === studioId);
  return studio?.imageUrl ? { uri: studio.imageUrl } : getStudioFallbackSource(studioId);
}

export function getStudioFallbackSource(studioId: string): ImageSourcePropType {
  return PREMIUM_COVERS[studioId] ?? DEFAULT_PREMIUM_COVER;
}
import type { ImageSourcePropType } from 'react-native';
