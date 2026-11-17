
import { useAuth } from "../hooks/useAuth";

export default function AccountPage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <main className="mx-auto max-w-2xl py-16">
      <h1 className="text-3xl font-bold">My account</h1>

      <section className="mt-8 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-xl font-semibold">
          {user.firstName} {user.lastName}
        </h2>

        <p className="mt-2 text-gray-600">{user.email}</p>
        <p className="mt-2 text-sm text-violet-700">
          Role: {user.role}
        </p>
      </section>
    </main>
  );
}
