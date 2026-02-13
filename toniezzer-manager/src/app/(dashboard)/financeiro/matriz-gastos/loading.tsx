import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-8 w-[250px]" />
      <Skeleton className="h-4 w-[400px]" />
      <div className="mt-6">
        <Skeleton className="h-[40px] w-full mb-2" />
        <Skeleton className="h-[40px] w-full mb-2" />
        <Skeleton className="h-[40px] w-full mb-2" />
        <Skeleton className="h-[40px] w-full mb-2" />
        <Skeleton className="h-[40px] w-full" />
      </div>
    </div>
  )
}
