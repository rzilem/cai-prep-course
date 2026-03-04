'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import {
  BookOpen,
  GraduationCap,
  LayoutDashboard,
  Layers,
  Trophy,
  BarChart3,
  MessageSquare,
  Settings,
  LogOut,
} from 'lucide-react'
import { GameHeader } from '@/components/gamification/game-header'
import { createClient as createBrowserClient } from '@/lib/supabase/client'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

function getSupabase() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

const navItems = [
  { title: 'Dashboard', href: '/', icon: LayoutDashboard },
  { title: 'Courses', href: '/courses', icon: BookOpen },
  { title: 'Flashcards', href: '/flashcards', icon: Layers },
  { title: 'Achievements', href: '/achievements', icon: Trophy },
  { title: 'Leaderboard', href: '/leaderboard', icon: BarChart3 },
  { title: 'Study Assistant', href: '/assistant', icon: MessageSquare },
]

function AppSidebar({ userEmail }: { userEmail?: string }) {
  const pathname = usePathname()

  async function handleSignOut() {
    const supabase = getSupabase()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const initials = userEmail
    ? userEmail.split('@')[0].slice(0, 2).toUpperCase()
    : 'PS'

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip="CAI Prep">
              <Link href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-cai-blue text-white">
                  <GraduationCap className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">CAI Prep</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Certification Training
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <Separator className="mx-2 w-auto" />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive =
                  item.href === '/'
                    ? pathname === '/'
                    : pathname.startsWith(item.href)

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                    >
                      <Link href={item.href}>
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Settings">
              <Link href="/settings">
                <Settings className="size-4" />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Sign Out" onClick={handleSignOut}>
              <LogOut className="size-4" />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip="Profile">
              <Avatar className="size-8">
                <AvatarFallback className="bg-cai-teal text-white text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {userEmail ? userEmail.split('@')[0] : 'Staff Member'}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  PSPM Team
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}

interface GameState {
  hearts: number
  coins: number
  daily_goal_progress: number
  daily_goal_target: number
  last_heart_regen: string | null
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [userEmail, setUserEmail] = useState<string | undefined>()
  const [checking, setChecking] = useState(true)
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [totalXp, setTotalXp] = useState(0)
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    const supabase = getSupabase()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace('/login')
        return
      }
      if (user.email && !user.email.endsWith('@psprop.net')) {
        supabase.auth.signOut().then(() => router.replace('/login'))
        return
      }
      setUserEmail(user.email ?? undefined)
      setChecking(false)

      // Fetch gamification state + stats in parallel
      const email = user.email ?? ''
      Promise.all([
        fetch(`/api/gamification?user_email=${encodeURIComponent(email)}`).then(
          (r) => (r.ok ? r.json() : null)
        ),
        fetch(`/api/progress?user_email=${encodeURIComponent(email)}`).then(
          (r) => (r.ok ? r.json() : null)
        ),
      ]).then(([game, progress]) => {
        if (game) setGameState(game)
        if (progress?.stats) {
          setTotalXp(progress.stats.total_xp ?? 0)
          setStreak(progress.stats.current_streak ?? 0)
        }
      })
    })
  }, [router])

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="inline-block w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar userEmail={userEmail} />
      <main className="flex flex-1 flex-col">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <span className="text-sm text-muted-foreground">
            PSPM CAI Prep Course
          </span>
          <div className="ml-auto">
            <GameHeader
              hearts={gameState?.hearts ?? 5}
              coins={gameState?.coins ?? 0}
              streak={streak}
              dailyGoalProgress={gameState?.daily_goal_progress ?? 0}
              dailyGoalTarget={gameState?.daily_goal_target ?? 5}
              totalXp={totalXp}
              lastHeartRegen={gameState?.last_heart_regen ?? null}
            />
          </div>
        </header>
        <div className="flex-1 overflow-auto p-6">{children}</div>
      </main>
    </SidebarProvider>
  )
}
