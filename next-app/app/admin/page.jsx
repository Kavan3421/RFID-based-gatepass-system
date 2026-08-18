"use client";

import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AdminRootRedirect() {
  const router = useRouter();
  const { currentAdmin } = useSelector((state) => state.admin);

  useEffect(() => {
    if (currentAdmin) {
      router.replace("/admin/dashboard");
    } else {
      router.replace("/admin/auth");
    }
  }, [currentAdmin, router]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex items-center gap-2 text-slate-500 text-xs">
        <Loader2 className="w-4 h-4 animate-spin text-cyan-600 dark:text-cyan-400" />
        Redirecting to Admin Console...
      </div>
    </div>
  );
}
