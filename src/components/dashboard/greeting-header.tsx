"use client";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function GreetingHeader({ name }: { name: string }) {
  return (
    <div className="mb-6 space-y-1 sm:mb-8">
      <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
        {getGreeting()}, {name}
      </h1>
      <p className="text-sm text-muted-foreground">Here&apos;s how your money is looking this month.</p>
    </div>
  );
}
