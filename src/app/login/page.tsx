import LoginForm from "./LoginForm";
import { LogoMark } from "@/components/icons";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card w-full max-w-sm p-8 shadow-sm">
        <div className="text-center mb-8">
          <LogoMark className="w-9 h-9 mx-auto mb-3" />
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">
            Bud — Personal Budget
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Sign in with your email, no password needed.
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
