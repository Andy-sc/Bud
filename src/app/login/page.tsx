import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card w-full max-w-sm p-8 shadow-sm">
        <div className="text-center mb-8">
          <div className="text-3xl mb-2">💰</div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">
            Bud — Presupuesto personal
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Entra con tu correo, sin contraseña.
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
