import { RegisterForm } from '@/components/auth'

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">
            Join TUM Community
          </h1>
          <p className="text-muted-foreground">
            Create your account to get started
          </p>
        </div>
        
        <RegisterForm />
      </div>
    </main>
  )
}
