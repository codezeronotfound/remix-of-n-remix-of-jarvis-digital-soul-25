import {
  LayoutDashboard, TrendingUp, Newspaper, Search, Briefcase, Link2, Atom,
  ShoppingBag, HeartPulse, Users, BrainCircuit, FlaskConical, ShieldAlert,
  Presentation, Cpu, Settings2, Smartphone, Mic, Trophy, CloudSun, Navigation, Banknote, Globe2, Wrench, Bot, Map, LucideIcon,
} from "lucide-react";

export type FeatureKey =
  | "command-center" | "jarvis-avatar" | "satellite-map" | "stocks" | "money" | "news" | "sports" | "weather" | "transport" | "earth" | "utilities" | "search" | "business" | "links"
  | "atomic" | "trade" | "health" | "users" | "memory" | "lab" | "security"
  | "ppt" | "logic" | "admin" | "phone" | "voice";

export interface Feature {
  key: FeatureKey;
  label: string;
  short: string;
  icon: LucideIcon;
  accent: "blue" | "red";
  description: string;
}

export const FEATURES: Feature[] = [
  { key: "command-center", label: "Command Center", short: "Home", icon: LayoutDashboard, accent: "blue", description: "Your mission control hub." },
  { key: "jarvis-avatar", label: "AI Avatar Jarvis", short: "Jarvis", icon: Bot, accent: "red", description: "Talking 3D avatar + voice command center." },
  { key: "stocks", label: "Live Markets", short: "Markets", icon: TrendingUp, accent: "blue", description: "Stocks, crypto & trending tickers." },
  { key: "money", label: "Money & Metals", short: "Money", icon: Banknote, accent: "blue", description: "Forex (INR), gold & silver live." },
  { key: "transport", label: "Transport Live", short: "Transport", icon: Navigation, accent: "blue", description: "Flights, trains, traffic — real time." },
  { key: "news", label: "Live News", short: "News", icon: Newspaper, accent: "blue", description: "Global, tech, business & AI feeds." },
  { key: "sports", label: "Live Scores", short: "Sports", icon: Trophy, accent: "blue", description: "Cricket, football & more — real-time." },
  { key: "weather", label: "Weather + AQI", short: "Weather", icon: CloudSun, accent: "blue", description: "Live weather, air quality & forecast." },
  { key: "earth", label: "Earth Pulse", short: "Earth", icon: Globe2, accent: "red", description: "Quakes, ISS tracker & launches." },
  { key: "utilities", label: "Utilities Hub", short: "Tools", icon: Wrench, accent: "blue", description: "Daily tools, AI utilities, device & security." },
  { key: "search", label: "Smart Search", short: "Search", icon: Search, accent: "blue", description: "Google-linked intelligent search." },
  { key: "business", label: "Business Suite", short: "CRM", icon: Briefcase, accent: "blue", description: "Leads, clients, invoices, analytics." },
  { key: "links", label: "Link Auto-Driver", short: "Links", icon: Link2, accent: "blue", description: "Detect & classify URLs safely." },
  { key: "atomic", label: "ATOMIC AI", short: "ATOMIC", icon: Atom, accent: "red", description: "Multi-task assistant module." },
  { key: "trade", label: "Buy / Sell AI", short: "Trade AI", icon: ShoppingBag, accent: "blue", description: "Recommend, compare, predict prices." },
  { key: "health", label: "Health Tracker", short: "Health", icon: HeartPulse, accent: "red", description: "Water, steps, BMI, sleep." },
  { key: "users", label: "User Analytics", short: "Users", icon: Users, accent: "blue", description: "Track every visitor." },
  { key: "memory", label: "Memory Core", short: "Memory", icon: BrainCircuit, accent: "blue", description: "Self-learning preferences engine." },
  { key: "lab", label: "Innovation Lab", short: "Lab", icon: FlaskConical, accent: "blue", description: "Experiments & beta features." },
  { key: "security", label: "Cyber Shield", short: "Security", icon: ShieldAlert, accent: "red", description: "Virus AI & threat detection." },
  { key: "ppt", label: "PPT Generator", short: "PPT", icon: Presentation, accent: "blue", description: "Auto-generate presentations." },
  { key: "logic", label: "Logic Board", short: "Board", icon: Cpu, accent: "blue", description: "Smart widget control panel." },
  { key: "admin", label: "System Control", short: "Admin", icon: Settings2, accent: "red", description: "Roles, toggles, logs." },
  { key: "phone", label: "Phone Control", short: "Phone", icon: Smartphone, accent: "blue", description: "Mobile remote & QR connect." },
  { key: "voice", label: "Voice Reply", short: "Voice", icon: Mic, accent: "blue", description: "Wake-word voice assistant." },
];
