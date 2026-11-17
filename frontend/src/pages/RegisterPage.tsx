
import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import { useAuth } from "../hooks/useAuth";

export default function RegisterPage() {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/products" replace />;
  }

  function update(field: keyof typeof form, value: string) {
    setForm((previous) => ({ ...previous, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await register({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim() || undefined,
      });

      navigate("/account", { replace: true });
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Registration failed",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-md py-16">
      <h1 className="text-3xl font-bold">Create an account</h1>
      <p className="mt-2 text-gray-500">
        Join Bloommerce to start shopping.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        {error && (
          <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">
            {error}
          </p>
        )}

        {(
          [
            ["firstName", "First name"],
            ["lastName", "Last name"],
            ["email", "Email"],
            ["phone", "Phone (optional)"],
            ["password", "Password"],
          ] as const
        ).map(([field, label]) => (
          <label key={field} className="block">
            <span className="font-medium">{label}</span>
            <input
              type={
                field === "email"
                  ? "email"
                  : field === "password"
                    ? "password"
                    : field === "phone"
                      ? "tel"
                      : "text"
              }
              required={field !== "phone"}
              minLength={field === "password" ? 8 : undefined}
              autoComplete={
                field === "password" ? "new-password" : undefined
              }
              value={form[field]}
              onChange={(e) => update(field, e.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-300 p-3"
            />
          </label>
        ))}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-violet-700 p-3 font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Register"}
        </button>
      </form>

      <p className="mt-6 text-center">
        Already registered?{" "}
        <Link to="/login" className="text-violet-700 underline">
          Sign in
        </Link>
      </p>
    </main>
  );
}
