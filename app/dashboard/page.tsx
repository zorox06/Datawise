import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DataAnalystDashboard } from '@/components/dashboard/data-analyst-dashboard'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  return <DataAnalystDashboard user={user} />
}
