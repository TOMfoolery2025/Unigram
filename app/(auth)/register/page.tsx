import { RegisterForm } from '@/components/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ImageCarousel } from '../login/ImageCarousel'

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen bg-background">
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <ImageCarousel />
        </div>
        
        <div className="relative z-10 max-w-md space-y-6 animate-fade-in p-12">
          <h1 className="text-5xl font-bold text-foreground leading-tight">
            Join the TUM community
          </h1>
          <p className="text-lg text-muted-foreground">
            Create your account and start connecting with fellow students at TUM Heilbronn Campus.
          </p>
          <div className="flex gap-2">
            <div className="h-1 w-12 bg-primary rounded-full"></div>
            <div className="h-1 w-8 bg-primary/50 rounded-full"></div>
            <div className="h-1 w-8 bg-primary/30 rounded-full"></div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 lg:p-8">
        <Card className="w-full max-w-lg border-border/50 animate-fade-in-up transition-all duration-300 hover:shadow-2xl hover:shadow-primary/20">
          <CardHeader className="space-y-1 text-center pt-8 pb-4">
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
                <span className="text-2xl font-bold text-white">U</span>
              </div>
            </div>
            <CardTitle className="text-3xl font-bold animate-fade-in tracking-widest text-primary">
              Unigram
            </CardTitle>
            <CardDescription className="text-base animate-fade-in animation-delay-100">
              Create your account
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4 px-8 pb-8">
            <div className="flex justify-center items-center animate-fade-in animation-delay-200">
              <RegisterForm />
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
