import { Skeleton } from "./skeleton"
import { Card, CardContent, CardHeader } from "./card"

export function DashboardSkeleton() {
  return (
    <div className='max-w-6xl mx-auto space-y-8 pb-20'>
      {/* Hero Card Skeleton */}
      <Card className='border-border/60'>
        <CardHeader className='pb-4'>
          <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
            <div className='space-y-2 flex-1'>
              <Skeleton className='h-4 w-32' />
              <Skeleton className='h-10 w-64' />
              <Skeleton className='h-4 w-full max-w-xl' />
            </div>
            <Skeleton className='h-20 w-48 rounded-2xl' />
          </div>
        </CardHeader>
        <CardContent className='flex flex-col gap-4 md:flex-row md:items-end md:justify-between'>
          <div className='grid grid-cols-3 gap-4 w-full md:w-auto'>
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <Skeleton className='h-3 w-16 mb-2' />
                <Skeleton className='h-6 w-12 mb-1' />
                <Skeleton className='h-3 w-20' />
              </div>
            ))}
          </div>
          <div className='flex flex-wrap gap-2'>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className='h-10 w-32' />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats Row Skeleton */}
      <section className='grid grid-cols-1 gap-4 md:grid-cols-3'>
        {[1, 2, 3].map((i) => (
          <Card key={i} className='border-border/60'>
            <CardHeader className='pb-2'>
              <Skeleton className='h-4 w-32' />
              <Skeleton className='h-3 w-48' />
            </CardHeader>
            <CardContent>
              <Skeleton className='h-8 w-16 mb-2' />
              <Skeleton className='h-3 w-24' />
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Main Grid Skeleton */}
      <section className='grid gap-6 lg:grid-cols-3'>
        <Card className='border-border/60 lg:col-span-2'>
          <CardHeader>
            <Skeleton className='h-6 w-48' />
            <Skeleton className='h-4 w-64' />
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className='h-20 w-full' />
              ))}
            </div>
          </CardContent>
        </Card>

        <div className='space-y-6'>
          {[1, 2, 3].map((i) => (
            <Card key={i} className='border-border/60'>
              <CardHeader>
                <Skeleton className='h-5 w-32' />
                <Skeleton className='h-3 w-48' />
              </CardHeader>
              <CardContent>
                <Skeleton className='h-24 w-full' />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}

export function EventListSkeleton() {
  return (
    <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i} className='border-border/60'>
          <CardHeader>
            <Skeleton className='h-6 w-3/4' />
            <Skeleton className='h-4 w-1/2' />
          </CardHeader>
          <CardContent className='space-y-3'>
            <Skeleton className='h-4 w-full' />
            <Skeleton className='h-4 w-full' />
            <Skeleton className='h-10 w-full' />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function ChannelListSkeleton() {
  return (
    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i} className='border-border/60'>
          <CardHeader>
            <div className='flex items-center gap-3'>
              <Skeleton className='h-12 w-12 rounded-full' />
              <div className='flex-1'>
                <Skeleton className='h-5 w-32 mb-2' />
                <Skeleton className='h-3 w-48' />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className='h-10 w-full' />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function ForumListSkeleton() {
  return (
    <div className='space-y-4'>
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className='border-border/60'>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <div className='flex-1'>
                <Skeleton className='h-6 w-48 mb-2' />
                <Skeleton className='h-4 w-full max-w-md' />
              </div>
              <Skeleton className='h-10 w-24' />
            </div>
          </CardHeader>
          <CardContent>
            <div className='flex gap-4 text-sm'>
              <Skeleton className='h-4 w-20' />
              <Skeleton className='h-4 w-20' />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function WikiArticleSkeleton() {
  return (
    <div className='space-y-6'>
      <Skeleton className='h-12 w-3/4' />
      <Skeleton className='h-4 w-1/2' />
      <div className='space-y-4'>
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className='h-4 w-full' />
        ))}
      </div>
      <Skeleton className='h-64 w-full' />
      <div className='space-y-4'>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className='h-4 w-full' />
        ))}
      </div>
    </div>
  )
}
