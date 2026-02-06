// Einfacher Skeleton Loader während die App lädt.
export const Skeleton = () => {
  return (
    <div className="min-h-screen bg-base text-text px-6 py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="h-12 w-64 animate-pulse rounded-full bg-surface-2" />
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-xl bg-surface" />
          ))}
        </div>
        <div className="h-80 animate-pulse rounded-xl bg-surface" />
      </div>
    </div>
  );
};
