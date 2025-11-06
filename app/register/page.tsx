"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/src/context/AuthContext"
import { register as apiRegister } from "@/src/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Clock } from "lucide-react"
import Link from "next/link"

export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const auth = useAuth()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Redirect als al ingelogd
  useEffect(() => {
    if (auth.isLoggedIn) {
      const redirect = searchParams.get('redirect') || '/'
      router.push(redirect)
    }
  }, [auth.isLoggedIn, router, searchParams])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validatie
    if (password !== confirmPassword) {
      setError("Wachtwoorden komen niet overeen")
      return
    }

    if (password.length < 6) {
      setError("Wachtwoord moet minimaal 6 tekens bevatten")
      return
    }

    setIsLoading(true)

    try {
      // Roep de register API aan
      const response = await apiRegister(email, password, name)
      
      // Bij succes, sla token op via AuthContext (als backend een token teruggeeft)
      if (response.token) {
        auth.login(response.token)
        
        // Navigeer naar de redirect URL of home pagina
        const redirect = searchParams.get('redirect') || '/'
        router.push(redirect)
      } else {
        // Als geen token wordt teruggegeven, redirect naar login
        router.push('/login?message=Registration successful. Please login.')
      }
    } catch (err) {
      // Toon error message
      setError(err instanceof Error ? err.message : "Registratie mislukt. Probeer het opnieuw.")
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
          <h1 className="text-3xl font-bold text-foreground">Maak een account</h1>
          <p className="text-muted-foreground mt-2 text-center">
            Begin met tijdregistratie voor je projecten
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Naam (optioneel)</Label>
            <Input
              id="name"
              type="text"
              placeholder="Je volledige naam"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
            />
          </div>

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
              placeholder="Minimaal 6 tekens"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              minLength={6}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Bevestig wachtwoord</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Herhaal je wachtwoord"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isLoading}
              minLength={6}
            />
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
            {isLoading ? "Account aanmaken..." : "Account aanmaken"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Heb je al een account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Log hier in
          </Link>
        </p>
      </Card>
    </div>
  )
}
