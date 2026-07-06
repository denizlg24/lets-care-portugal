import Link from "next/link";
import { LoginForm } from "@/components/admin/login-form";

export default function AdminLoginPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Administração
        </p>
        <h1 className="text-xl font-semibold text-foreground">Iniciar sessão</h1>
        <p className="text-sm text-muted-foreground">
          Os administradores aprovados podem entrar no painel.
        </p>
      </div>
      <LoginForm />
      <p className="text-sm text-muted-foreground">
        Precisa de acesso?{" "}
        <Link
          className="font-medium text-foreground underline-offset-4 hover:underline"
          href="/admin/register"
        >
          Pedir acesso de administração
        </Link>
      </p>
    </div>
  );
}
