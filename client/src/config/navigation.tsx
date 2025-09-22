import {
  LayoutDashboard,
  Wrench,
  ClipboardCheck,
  Building2,
  Calendar,
  MessageSquare,
  Hammer,
  Cog,
  Clipboard,
  Trophy,
  Users,
  Receipt,
  Store,
  PiggyBank,
  Users2,
  Clock,
  UsersRound,
  MessageCircle,
  User,
  Home
} from "lucide-react"

interface NavItem {
  title: string
  href: string
  icon: typeof LayoutDashboard
  items?: NavItem[]
}

export const navigationItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard
  },
  {
    title: "Home Management",
    href: "/home",
    icon: Home,
    items: [
      {
        title: "Home Details",
        href: "/profile/home-details",
        icon: Building2
      },
      {
        title: "Service Requests",
        href: "/service-requests",
        icon: ClipboardCheck
      }
    ]
  },
  {
    title: "Services",
    href: "/services",
    icon: Wrench,
    items: [
      {
        title: "FixiT",
        href: "/fixit",
        icon: Cog
      },
      {
        title: "Repairs",
        href: "/repairs",
        icon: Hammer
      },
      {
        title: "Maintenance",
        href: "/maintenance",
        icon: Cog
      },
      {
        title: "Inspections",
        href: "/inspections",
        icon: Clipboard
      }
    ]
  },
  {
    title: "Schedule",
    href: "/calendar",
    icon: Calendar
  },
  {
    title: "Messages",
    href: "/messages",
    icon: MessageSquare
  },
  {
    title: "Providers",
    href: "/providers",
    icon: Users,
    items: [
      {
        title: "Contractors",
        href: "/contractors",
        icon: Users2
      },
      {
        title: "Estimates",
        href: "/estimates",
        icon: Receipt
      },
      {
        title: "Merchants",
        href: "/merchants",
        icon: Store
      }
    ]
  },
  {
    title: "Community",
    href: "/community",
    icon: Users2,
    items: [
      {
        title: "Timeline",
        href: "/timeline",
        icon: Clock
      },
      {
        title: "Groups",
        href: "/groups",
        icon: UsersRound
      },
      {
        title: "Forums",
        href: "/forums",
        icon: MessageCircle
      }
    ]
  },
  {
    title: "Rewards",
    href: "/rewards",
    icon: Trophy,
    items: [
      {
        title: "Badges",
        href: "/badges",
        icon: Trophy
      },
      {
        title: "Ranks",
        href: "/ranks",
        icon: Trophy
      },
      {
        title: "Achievements",
        href: "/achievements",
        icon: Trophy
      },
      {
        title: "SavvySaver",
        href: "/savvy-saver",
        icon: PiggyBank
      }
    ]
  },
  {
    title: "Profile",
    href: "/profile",
    icon: User
  }
]