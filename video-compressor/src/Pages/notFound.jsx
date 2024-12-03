import { NavLink } from "react-router";

export default function NotFound() {
  return (
    <>
      <main className="bg-zinc-900 min-h-screen relative grid place-items-center">
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl font-semibold text-zinc-200 mb-6">Page not found</h1>
          <NavLink to="/" className="items-center py-2.5 px-3.5 bg-green-500 rounded-md text-zinc-900 text-sm font-medium hover:bg-green-600">Go Back</NavLink>
        </div>
      </main >
    </>
  );
}