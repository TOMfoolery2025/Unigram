import { LoginForm } from '@/components/auth'
import { GuestAccessButton } from '@/components/auth'

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">
            TUM Community Platform
          </h1>
          <p className="text-muted-foreground">
            Connect with TUM Heilbronn Campus students
          </p>
        </div>
        
        <LoginForm />
        
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or
            </span>
          </div>
        </div>
        
        <GuestAccessButton />
        
        <p className="text-xs text-center text-muted-foreground">
          Guest access is limited to the Wiki section only
        </p>
      </div>
    </main>
  )
}
