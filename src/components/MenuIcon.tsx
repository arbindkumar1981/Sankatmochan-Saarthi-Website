import { BookOpen, Youtube, BellRing, Award, Info, PhoneCall, ShieldCheck, LayoutDashboard, FileText, BookmarkCheck, Binary, GitBranch, Layers, History, Target, FileSpreadsheet, CheckSquare, Home, Users, Settings } from 'lucide-react';
import { DEFAULT_ICONS, type NavigationIcon } from '../services/navigationAppearance';
const icons = { book: BookOpen, video: Youtube, bell: BellRing, award: Award, info: Info, phone: PhoneCall, shield: ShieldCheck, dashboard: LayoutDashboard, file: FileText, bookmark: BookmarkCheck, formula: Binary, mindmap: GitBranch, layers: Layers, history: History, target: Target, table: FileSpreadsheet, test: CheckSquare, home: Home, users: Users, settings: Settings };
export function MenuIcon({ icon, itemId, className, fallback = 'info' }: { icon?: NavigationIcon; itemId?: string; className?: string; fallback?: NavigationIcon }) {
  const Icon = icons[icon || DEFAULT_ICONS[itemId || ''] || fallback];
  return <Icon className={className} aria-hidden="true" />;
}
