// Einfacher Skeleton Loader während die App lädt.
export const Skeleton = () => {
  return (
    <div className="min-h-screen bg-base px-6 py-10 text-text">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="h-10 w-72 animate-pulse rounded-xl bg-surface-2" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-2xl bg-surface" />
          ))}
        </div>
        <div className="h-72 animate-pulse rounded-3xl bg-surface" />
        <div className="h-56 animate-pulse rounded-3xl bg-surface" />
      </div>
    </div>
  );
};
