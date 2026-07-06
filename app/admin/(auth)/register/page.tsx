import Link from "next/link";
import { RegisterForm } from "@/components/admin/register-form";

export default function AdminRegisterPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Administração
        </p>
        <h1 className="text-xl font-semibold text-foreground">Pedir acesso</h1>
        <p className="text-sm text-muted-foreground">
          As novas contas ficam pendentes até serem aprovadas por um administrador principal.
        </p>
      </div>
      <RegisterForm />
      <p className="text-sm text-muted-foreground">
        Já foi aprovado?{" "}
        <Link
          className="font-medium text-foreground underline-offset-4 hover:underline"
          href="/admin/login"
        >
          Iniciar sessão
        </Link>
      </p>
    </div>
  );
}
