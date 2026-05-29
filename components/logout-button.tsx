'use client'

import { useRouter } from 'next/navigation'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export function LogoutButton() {
  const router = useRouter()

  const logout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/authentication/sign-in')
  }

  return <button onClick={logout} className="flex items-center gap-3 w-full block text-left text-sm font-medium text-red-600 hover:text-red-700 transition-all duration-200">Keluar</button>
}
