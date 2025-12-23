// Skeleton components for native-like loading states

export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden flex">
      <div className="w-24 h-24 skeleton" />
      <div className="flex-1 p-3 flex flex-col justify-between">
        <div>
          <div className="h-4 w-3/4 skeleton mb-2" />
          <div className="h-3 w-full skeleton mb-1" />
          <div className="h-3 w-2/3 skeleton" />
        </div>
        <div className="flex justify-between items-center mt-2">
          <div className="h-5 w-16 skeleton" />
          <div className="h-8 w-20 skeleton rounded-full" />
        </div>
      </div>
    </div>
  )
}

export function CategorySkeleton() {
  return (
    <div className="mb-8">
      <div className="h-6 w-32 skeleton mb-4" />
      <div className="space-y-4">
        <ProductCardSkeleton />
        <ProductCardSkeleton />
        <ProductCardSkeleton />
      </div>
    </div>
  )
}

export function MenuSkeleton() {
  return (
    <div className="p-4">
      <CategorySkeleton />
      <CategorySkeleton />
    </div>
  )
}

export function OrderCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="h-4 w-24 skeleton mb-2" />
          <div className="h-3 w-32 skeleton" />
        </div>
        <div className="h-6 w-20 skeleton rounded-full" />
      </div>
      <div className="flex justify-between items-center pt-3 border-t">
        <div className="h-4 w-16 skeleton" />
        <div className="h-5 w-14 skeleton" />
      </div>
    </div>
  )
}

export function OrdersSkeleton() {
  return (
    <div className="p-4 space-y-4">
      <OrderCardSkeleton />
      <OrderCardSkeleton />
      <OrderCardSkeleton />
    </div>
  )
}

export function CartItemSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 flex gap-4">
        <div className="w-20 h-20 skeleton rounded-lg flex-shrink-0" />
        <div className="flex-1">
          <div className="h-4 w-3/4 skeleton mb-2" />
          <div className="h-3 w-1/2 skeleton mb-2" />
          <div className="h-5 w-20 skeleton" />
        </div>
      </div>
      <div className="px-4 pb-4 flex items-center justify-between border-t pt-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 skeleton rounded-full" />
          <div className="w-6 h-4 skeleton" />
          <div className="w-8 h-8 skeleton rounded-full" />
        </div>
        <div className="h-5 w-16 skeleton" />
      </div>
    </div>
  )
}
