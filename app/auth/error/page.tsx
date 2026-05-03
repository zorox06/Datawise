import { BarChart3, AlertTriangle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-lg bg-[#eca8d6]/20 flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-[#eca8d6]" />
          </div>
          <div>
            <span className="text-2xl font-display text-white">DATAWISE</span>
            <span className="text-xs text-white/40 font-mono ml-2">AI</span>
          </div>
        </div>

        <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-10 h-10 text-red-400" />
        </div>

        <h1 className="text-3xl font-display text-white mb-4">
          Something went wrong
        </h1>
        
        <p className="text-white/60 mb-6">
          {params?.error 
            ? `Error: ${params.error}`
            : 'An error occurred during authentication. Please try again.'
          }
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild className="bg-[#eca8d6] hover:bg-[#eca8d6]/90 text-black rounded-full">
            <Link href="/auth/login">
              Try again
            </Link>
          </Button>
          <Button asChild variant="outline" className="border-white/20 text-white hover:bg-white/5 rounded-full">
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
