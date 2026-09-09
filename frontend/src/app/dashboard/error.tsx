"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main className="min-h-screen grid place-content-center gap-4 p-8"><h1 className="text-2xl font-semibold">The dashboard could not load.</h1><p>Your saved records remain in the database.</p><button className="button primary" onClick={reset}>Try again</button></main>;
}
