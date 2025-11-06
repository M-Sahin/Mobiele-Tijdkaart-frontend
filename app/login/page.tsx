"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/src/context/AuthContext"
import { login as apiLogin } from "@/src/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Clock } from "lucide-react"
import Link from "next/link"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const auth = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Redirect als al ingelogd
  useEffect(() => {
    if (auth.isLoggedIn) {
      const redirect = searchParams.get('redirect') || '/'
      router.push(redirect)
    }
  }, [auth.isLoggedIn, router, searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      // Roep de login API aan
      const response = await apiLogin(email, password)
      
      // Bij succes, sla token op via AuthContext
      auth.login(response.token)
      
      // Navigeer naar de redirect URL of home pagina
      const redirect = searchParams.get('redirect') || '/'
      router.push(redirect)
    } catch (err) {
      // Toon error message
      setError(err instanceof Error ? err.message : "Inloggen mislukt. Controleer je gegevens.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center mb-4">
            <Clock className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Welkom</h1>
          <p className="text-muted-foreground mt-2 text-center">Log in om je werktijd bij te houden</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">E-mailadres</Label>
            <Input
              id="email"
              type="email"
              placeholder="naam@voorbeeld.nl"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Wachtwoord</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
            {isLoading ? "Inloggen..." : "Inloggen"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Nog geen account?{" "}
          <Link href="/register" className="text-primary hover:underline">
            Registreer hier
          </Link>
        </p>
      </Card>
    </div>
  )
}
