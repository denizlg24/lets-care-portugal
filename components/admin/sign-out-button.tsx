"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";
import { cn } from "@/lib/utils";

interface SignOutButtonProps {
  showLabel?: boolean;
  className?: string;
}

export function SignOutButton({ showLabel = false, className }: SignOutButtonProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleSignOut() {
    setPending(true);
    try {
      await authClient.signOut();
    } finally {
      router.replace("/admin/login");
      router.refresh();
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size={showLabel ? "sm" : "icon"}
      aria-label={showLabel ? undefined : "Terminar sessão"}
      onClick={handleSignOut}
      disabled={pending}
      className={cn(showLabel && "w-full justify-start gap-2", className)}
    >
      <LogOut />
      {showLabel ? "Terminar sessão" : null}
    </Button>
  );
}
