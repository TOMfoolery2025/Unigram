import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-4 text-primary">
          TUM Community Platform
        </h1>
        <p className="text-center text-muted-foreground mb-8">
          Welcome to the TUM Heilbronn Campus Community Platform
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/login">
            <Button>Sign In</Button>
          </Link>
          <Link href="/register">
            <Button variant="outline">Register</Button>
          </Link>
          <Link href="/wiki">
            <Button variant="secondary">Browse Wiki</Button>
          </Link>
        </div>
      </div>
    </main>
  )
}
