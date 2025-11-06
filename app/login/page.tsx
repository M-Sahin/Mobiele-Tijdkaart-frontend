import type { Metadata } from "next"
import { LoginContent } from "@/components/LoginContent"

export const metadata: Metadata = {
  title: "Inloggen - Mobiele Tijdkaart",
  description: "Log in om je werktijd bij te houden",
}

export default function LoginPage() {
  return <LoginContent />
}
