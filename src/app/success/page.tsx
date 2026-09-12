import { Suspense } from "react";
import { SuccessContent } from "./SuccessContent";
import { ConfettiSound } from "@/components/effects/ConfettiSound";

// Les métadonnées de cette page sont définies dans ./layout.tsx
export default function SuccessPage() {
  return (
    <>
      <ConfettiSound />
      <Suspense fallback={
        <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-[#1a0a0a] via-[#120d0d] to-[#0d0808] p-4">
          <div className="text-center text-white/50 text-sm">Chargement...</div>
        </div>
      }>
        <SuccessContent />
      </Suspense>
    </>
  );
}
