import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-8 w-[250px]" />
      <Skeleton className="h-4 w-[400px]" />
      <div className="space-y-4 mt-6">
        <Skeleton className="h-[60px] w-full" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-[60px] w-full" />
          <Skeleton className="h-[60px] w-full" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-[60px] w-full" />
          <Skeleton className="h-[60px] w-full" />
        </div>
        <Skeleton className="h-[60px] w-full" />
      </div>
    </div>
  )
}
