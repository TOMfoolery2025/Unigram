import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function WikiPage() {
  return (
    <main className="min-h-screen p-8 bg-background">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">
            TUM Community Wiki
          </h1>
          <p className="text-muted-foreground">
            Information for prospective and incoming TUM students
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome to TUM Heilbronn Campus</CardTitle>
            <CardDescription>
              Essential information for new students
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              This wiki provides helpful information about the TUM application
              process and guides for new students arriving in Germany.
            </p>
            <p className="text-sm text-muted-foreground">
              Note: This is a guest-accessible area. To access forums, channels,
              and events, please register with a TUM email address.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Application Process</CardTitle>
            <CardDescription>
              How to apply to TUM Heilbronn Campus
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              Information about the TUM application process will be available here.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Arriving in Germany</CardTitle>
            <CardDescription>
              Essential guides for international students
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              Guides for new students arriving in Germany will be available here.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
