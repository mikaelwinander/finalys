// /frontend/src/components/common/Icon.tsx
import type { FC, SVGProps } from 'react';
import { 
  // Navigation & Core SaaS
  LayoutDashboard, 
  Database, 
  Layers, 
  Settings, 
  Home,
  User,
  LogOut,
  Bell,
  Search,

  // Data & Analytics
  Table,
  BarChart3,
  LineChart,
  PieChart,
  TrendingUp,
  TrendingDown,
  Calculator,
  DollarSign,
  Activity,
  Zap, // For simulations/AI

  // Actions & Operations
  Plus,
  Edit2,
  Trash2,
  Save,
  Download,
  Upload,
  RefreshCw,
  Filter,
  MoreVertical,
  MoreHorizontal,

  // UI Controls & Feedback
  ChevronRight, 
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  X,
  Check,
  AlertTriangle,
  Info,
  HelpCircle,
  GripVertical
} from 'lucide-react';

// 1. The Registry: Map semantic names to actual icon implementations
const ICON_MAP = {
  // Navigation
  dashboard: LayoutDashboard,
  dataset: Database,
  dimensions: Layers,
  settings: Settings,
  home: Home,
  profile: User,
  user: User, // Added mapping for the Header.tsx component
  logout: LogOut,
  notifications: Bell,
  search: Search,

  // Data & Analytics
  table: Table,
  barChart: BarChart3,
  lineChart: LineChart,
  pieChart: PieChart,
  trendingUp: TrendingUp,
  trendingDown: TrendingDown,
  calculator: Calculator,
  currency: DollarSign,
  activity: Activity,
  simulation: Zap,

  // Actions
  add: Plus,
  edit: Edit2,
  trash: Trash2,
  save: Save,
  download: Download,
  upload: Upload,
  refresh: RefreshCw,
  filter: Filter,
  moreVert: MoreVertical,
  moreHoriz: MoreHorizontal,

  // UI & Status
  chevronRight: ChevronRight,
  chevronLeft: ChevronLeft,
  chevronDown: ChevronDown,
  chevronUp: ChevronUp,
  close: X,
  check: Check,
  warning: AlertTriangle,
  info: Info,
  help: HelpCircle,
  grip: GripVertical, // <-- ADD THIS
} as const;

// 2. Strict Typing: Autocomplete will only allow valid icon names
export type IconName = keyof typeof ICON_MAP;

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName;
  size?: number | string;
  className?: string;
}

export const Icon: FC<IconProps> = ({ 
  name, 
  size = 24, 
  className = '', 
  ...props 
}) => {
  const SelectedIcon = ICON_MAP[name];

  if (!SelectedIcon) {
    console.warn(`[Icon System] Icon "${name}" not found in registry.`);
    return null;
  }

  // Render the resolved icon, passing down sizing and Tailwind classes
  return (
    <SelectedIcon 
      width={size} 
      height={size} 
      className={`shrink-0 ${className}`} 
      {...props} 
    />
  );
};