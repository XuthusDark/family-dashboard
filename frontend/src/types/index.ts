export type TileType = 'clock' | 'weather' | 'news' | 'countdown' | 'calendar';

export interface TileSchedule {
  always: boolean;
  days?: ('Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun')[];
  timeStart?: string; // "HH:MM"
  timeEnd?: string;   // "HH:MM"
}

export interface TileLayout {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Tile {
  id: string;
  type: TileType;
  title: string;
  config: Record<string, unknown>;
  schedule: TileSchedule;
  layout: TileLayout;
  enabled: boolean;
}

export interface ThemeColors {
  bg: string;
  surface: string;
  accent: string;
  text: string;
  subtext: string;
}

export interface Theme {
  mode: 'dark' | 'light';
  dark: ThemeColors;
  light: ThemeColors;
}

export interface NightMode {
  enabled: boolean;
  start: string;
  end: string;
  dimLevel: number;
}

// Weather types
export interface WeatherCurrent {
  temp: number;
  feelsLike: number;
  humidity: number;
  wind: number;
  windDir: number;
  weatherCode: number;
  label: string;
  icon: string;
  isDay: boolean;
  precip: number;
}

export interface WeatherHour {
  time: string;
  temp: number;
  weatherCode: number;
  label: string;
  icon: string;
  precipProb: number;
  precip: number;
  wind: number;
}

export interface WeatherDay {
  date: string;
  weatherCode: number;
  label: string;
  icon: string;
  high: number;
  low: number;
  precipProb: number;
  precip: number;
}

export interface WeatherData {
  location: string;
  current: WeatherCurrent;
  hourly: WeatherHour[];
  daily: WeatherDay[];
  precipComing: boolean;
  updatedAt: string;
}

export interface NewsItem {
  title: string;
  summary: string;
  link: string;
  pubDate: string;
}

export interface NewsData {
  title: string;
  items: NewsItem[];
  updatedAt: string;
}
