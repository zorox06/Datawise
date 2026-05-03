import { BarChart3, Mail, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function SignUpSuccessPage() {
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

        <div className="w-20 h-20 rounded-full bg-[#eca8d6]/10 flex items-center justify-center mx-auto mb-6">
          <Mail className="w-10 h-10 text-[#eca8d6]" />
        </div>

        <h1 className="text-3xl font-display text-white mb-4">
          Check your email
        </h1>
        
        <p className="text-white/60 mb-8 leading-relaxed">
          We&apos;ve sent you a confirmation link. Please check your email and click the link to activate your account.
        </p>

        <div className="p-4 rounded-lg bg-white/5 border border-white/10 mb-8">
          <p className="text-sm text-white/40">
            Didn&apos;t receive the email? Check your spam folder or{' '}
            <Link href="/auth/sign-up" className="text-[#eca8d6] hover:underline">
              try again
            </Link>
          </p>
        </div>

        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>
      </div>
    </div>
  )
}
