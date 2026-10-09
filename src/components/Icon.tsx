import {
  Backpack, Bath, Bed, BookOpen, Brush, Cake, Car, Dumbbell, Droplets, Footprints, Heart, House, Music, Palette,
  Puzzle, Shirt, Soup, Sparkles, Sprout, Star, Sun, Sunrise, ToyBrick, Trees, Utensils, Wind, Moon, Volleyball,
  Shield, Tv, Users, Flower2, Bike, Gamepad2, Dices, Apple, type LucideIcon,
} from 'lucide-react';

/** Austauschbare Symbole für Aufgaben, Routinen und Timer. Schlüssel werden in der Datenbank gespeichert. */
export const ICONS: Record<string, { icon: LucideIcon; label: string }> = {
  sunrise: { icon: Sunrise, label: 'Aufstehen' },
  sun: { icon: Sun, label: 'Sonne' },
  utensils: { icon: Utensils, label: 'Essen' },
  soup: { icon: Soup, label: 'Mittagessen' },
  apple: { icon: Apple, label: 'Obst' },
  shirt: { icon: Shirt, label: 'Anziehen' },
  brush: { icon: Brush, label: 'Putzen / Kehren' },
  droplets: { icon: Droplets, label: 'Waschen' },
  bath: { icon: Bath, label: 'Baden' },
  backpack: { icon: Backpack, label: 'Rucksack' },
  footprints: { icon: Footprints, label: 'Schuhe' },
  trees: { icon: Trees, label: 'Draußen' },
  sprout: { icon: Sprout, label: 'Garten' },
  flower: { icon: Flower2, label: 'Blume' },
  'toy-brick': { icon: ToyBrick, label: 'Spielen' },
  puzzle: { icon: Puzzle, label: 'Aufräumen / Puzzle' },
  wind: { icon: Wind, label: 'Saugen' },
  sparkles: { icon: Sparkles, label: 'Ordnung' },
  bed: { icon: Bed, label: 'Schlafen' },
  moon: { icon: Moon, label: 'Abend' },
  book: { icon: BookOpen, label: 'Buch' },
  palette: { icon: Palette, label: 'Malen' },
  music: { icon: Music, label: 'Musik' },
  heart: { icon: Heart, label: 'Herz' },
  house: { icon: House, label: 'Zuhause' },
  car: { icon: Car, label: 'Fahrt' },
  bike: { icon: Bike, label: 'Fahrrad' },
  dumbbell: { icon: Dumbbell, label: 'Sport' },
  ball: { icon: Volleyball, label: 'Ball' },
  shield: { icon: Shield, label: 'Kampfsport' },
  tv: { icon: Tv, label: 'Fernsehen' },
  users: { icon: Users, label: 'Familie' },
  game: { icon: Gamepad2, label: 'Spiel' },
  dice: { icon: Dices, label: 'Würfelspiel' },
  cake: { icon: Cake, label: 'Geburtstag' },
  star: { icon: Star, label: 'Stern' },
};

export function Icon({ name, size = 28, strokeWidth = 2, className }: {
  name: string; size?: number; strokeWidth?: number; className?: string;
}) {
  const Cmp = ICONS[name]?.icon ?? Sparkles;
  return <Cmp size={size} strokeWidth={strokeWidth} className={className} aria-hidden="true" />;
}
