"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { UnauthorizedView } from "../../components/auth/UnauthorizedView";

function UnauthorizedPageContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");
  const path = searchParams.get("path") || undefined;

  let title = "403 — Access Restricted";
  let explanation = "You do not possess the required operational domain authority or service permissions to access this console.";

  if (reason === "suspended") {
    title = "Account Suspended / Deactivated";
    explanation = "Your official account has been suspended or deactivated by the platform administrator. Access to operational systems is revoked.";
  }

  return (
    <UnauthorizedView
      title={title}
      reason={explanation}
      attemptedPath={path}
    />
  );
}

export default function UnauthorizedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center font-mono text-xs text-gray-500">
          Verifying security privileges...
        </div>
      }
    >
      <UnauthorizedPageContent />
    </Suspense>
  );
}
