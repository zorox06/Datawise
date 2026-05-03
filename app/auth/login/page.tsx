'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft, BarChart3, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      router.push('/dashboard')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-black via-black to-[#1a0a12] p-12 flex-col justify-between relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#eca8d6]/20 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-[#eca8d6]" />
            </div>
            <div>
              <span className="text-2xl font-display text-white">DATAWISE</span>
              <span className="text-xs text-white/40 font-mono ml-2">AI</span>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <h1 className="text-5xl font-display text-white leading-tight mb-6">
            Turn your data into
            <br />
            <span className="text-[#eca8d6]">actionable insights.</span>
          </h1>
          <p className="text-white/60 text-lg max-w-md">
            Upload CSV, JSON, or SQLite files. Get instant statistics, AI-recommended charts, and professional reports.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-8 text-white/40 text-sm font-mono">
          <span>19+ chart types</span>
          <span className="w-1 h-1 rounded-full bg-white/20" />
          <span>AI-powered</span>
          <span className="w-1 h-1 rounded-full bg-white/20" />
          <span>100% browser-based</span>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-lg bg-[#eca8d6]/20 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-[#eca8d6]" />
            </div>
            <div>
              <span className="text-2xl font-display text-white">DATAWISE</span>
              <span className="text-xs text-white/40 font-mono ml-2">AI</span>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-display text-white mb-2">Welcome back</h2>
            <p className="text-white/60">Sign in to continue to your dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/80">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#eca8d6] focus:ring-[#eca8d6]/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/80">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#eca8d6] focus:ring-[#eca8d6]/20"
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full h-12 bg-[#eca8d6] hover:bg-[#eca8d6]/90 text-black font-medium rounded-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-white/60">
            Don&apos;t have an account?{' '}
            <Link href="/auth/sign-up" className="text-[#eca8d6] hover:underline">
              Sign up for free
            </Link>
          </p>

          <div className="lg:hidden mt-8">
            <Link href="/" className="inline-flex items-center gap-2 text-white/40 hover:text-white/60 transition-colors text-sm">
              <ArrowLeft className="w-4 h-4" />
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
