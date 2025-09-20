import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function AuthCodeError() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-white">
            Authentication Error
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            There was an error processing your authentication. This could be due to:
          </p>
          <ul className="mt-4 text-sm text-slate-400 text-left space-y-2">
            <li>• The authentication code has expired</li>
            <li>• The code has already been used</li>
            <li>• There was a network error</li>
          </ul>
        </div>
        <div className="mt-8 space-y-4">
          <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-700">
            <Link href="/">
              Try Again
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full border-slate-600 text-slate-300 hover:bg-slate-700">
            <Link href="/">
              Return Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
