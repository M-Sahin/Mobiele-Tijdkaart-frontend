import { Metadata } from "next"
import { RegisterContent } from "@/components/RegisterContent"

export const metadata: Metadata = {
  title: "Registreren - Mobiele Tijdkaart",
  description: "Maak een account aan om te starten met tijdregistratie",
}

export default function RegisterPage() {
  return <RegisterContent />
}
