"use client"

import { Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm, type SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useAuth } from "@/src/context/AuthContext"
import { register as apiRegister } from "@/src/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Clock } from "lucide-react"
import Link from "next/link"

// Zod validatieschema
const registerSchema = z.object({
  email: z
    .string()
    .min(1, "E-mailadres is verplicht")
    .email("Voer een geldig e-mailadres in"),
  password: z
    .string()
    .min(6, "Wachtwoord moet minimaal 6 tekens bevatten"),
  confirmPassword: z
    .string()
    .min(6, "Bevestig je wachtwoord")
}).refine((data) => data.password === data.confirmPassword, {
  message: "Wachtwoorden komen niet overeen",
  path: ["confirmPassword"],
})

type RegisterFormData = z.infer<typeof registerSchema>

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const auth = useAuth()

  // react-hook-form initialisatie
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError: setFormError,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  // Redirect als al ingelogd
  useEffect(() => {
    if (auth.isLoggedIn) {
      const redirect = searchParams.get('redirect') || '/'
      router.push(redirect)
    }
  }, [auth.isLoggedIn, router, searchParams])

  // Submit handler
  const onSubmit: SubmitHandler<RegisterFormData> = async (data) => {
    try {
      // Roep de register API aan met de juiste veldnamen
      const response = await apiRegister(data.email, data.password, data.confirmPassword)
      
      // Bij succes, redirect naar login (API returnt geen token bij registratie)
      router.push('/login?message=Registratie succesvol! Je kunt nu inloggen.')
    } catch (err) {
      // Toon error message
      const errorMessage = err instanceof Error ? err.message : "Registratie mislukt. Probeer het opnieuw."
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
          <h1 className="text-3xl font-bold text-foreground">Maak een account</h1>
          <p className="text-muted-foreground mt-2 text-center">
            Begin met tijdregistratie voor je projecten
          </p>
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
              placeholder="Minimaal 6 tekens"
              {...register("password")}
              disabled={isSubmitting}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Bevestig wachtwoord</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Herhaal je wachtwoord"
              {...register("confirmPassword")}
              disabled={isSubmitting}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
            {isSubmitting ? "Account aanmaken..." : "Account aanmaken"}
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

export function RegisterContent() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background flex items-center justify-center">
        <div className="text-muted-foreground">Laden...</div>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  )
}
