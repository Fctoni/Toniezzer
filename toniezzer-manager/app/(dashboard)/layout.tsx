import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar - desktop only */}
      <Sidebar />
      
      {/* Main content area */}
      <div className="lg:pl-64">
        <Header />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}

