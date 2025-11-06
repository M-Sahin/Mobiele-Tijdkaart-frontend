"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm, type SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useAuth } from "@/src/context/AuthContext"
import { login as apiLogin } from "@/src/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Clock } from "lucide-react"
import Link from "next/link"

// Zod validatieschema
const loginSchema = z.object({
  email: z
    .string()
    .min(1, "E-mailadres is verplicht")
    .email("Voer een geldig e-mailadres in"),
  password: z
    .string()
    .min(6, "Wachtwoord moet minimaal 6 tekens bevatten")
})

type LoginFormData = z.infer<typeof loginSchema>

export function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const auth = useAuth()

  // react-hook-form initialisatie
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError: setFormError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  // Redirect als al ingelogd
  useEffect(() => {
    if (auth.isLoggedIn) {
      const redirect = searchParams.get('redirect') || '/'
      router.push(redirect)
    }
  }, [auth.isLoggedIn, router, searchParams])

  // Submit handler
  const onSubmit: SubmitHandler<LoginFormData> = async (data) => {
    try {
      // Roep de login API aan
      const response = await apiLogin(data.email, data.password)
      
      // Bij succes, sla token op via AuthContext
      auth.login(response.token)
      
      // Navigeer naar de redirect URL of home pagina
      const redirect = searchParams.get('redirect') || '/'
      router.push(redirect)
    } catch (err) {
      // Toon error message
      const errorMessage = err instanceof Error ? err.message : "Inloggen mislukt. Controleer je gegevens."
      setFormError("root", {
        type: "manual",
        message: errorMessage,
      })
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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {errors.root && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
              {errors.root.message}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">E-mailadres</Label>
            <Input
              id="email"
              type="email"
              placeholder="naam@voorbeeld.nl"
              {...register("email")}
              disabled={isSubmitting}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Wachtwoord</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register("password")}
              disabled={isSubmitting}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
            {isSubmitting ? "Inloggen..." : "Inloggen"}
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
