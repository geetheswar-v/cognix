"use client"

import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  IconEye,
  IconEyeOff,
  IconLock,
  IconMail,
} from "@tabler/icons-react"
import { Controller, useForm } from "react-hook-form"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { GoogleLogo } from "@/components/google-logo"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldSeparator,
  FieldTitle,
} from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { signIn } from "@/lib/auth-client"
import { signinSchema, type SigninValues } from "@/lib/validation"

export default function SignInPage() {
  const [showPassword, setShowPassword] = useState(false)

  const callbackURL =
    typeof window !== "undefined" ? `${window.location.origin}/` : "/"

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SigninValues>({
    resolver: zodResolver(signinSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  function onSubmit(data: SigninValues) {
    console.log("Sign in payload", data)
  }

  async function onGoogleSignIn() {
    const { error } = await signIn.social({
      provider: "google",
      callbackURL,
    })

    if (error) {
      console.error("Google sign-in failed", error)
    }
  }

  return (
    <Card className="border border-border/70 bg-card/90 py-5 shadow-sm backdrop-blur-sm lg:border-0 lg:bg-transparent lg:py-0 lg:shadow-none lg:ring-0">
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldSet>
            <div className="space-y-2">
              <FieldTitle className="text-3xl leading-tight font-semibold text-foreground">
                Welcome back
              </FieldTitle>
              <FieldDescription>
                Sign in to continue your NEET prep with daily tests and AI-based
                revision plans.
              </FieldDescription>
            </div>

            <FieldGroup className="gap-5">
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Email address</FieldLabel>
                    <FieldContent>
                      <InputGroup>
                        <InputGroupAddon>
                          <IconMail />
                        </InputGroupAddon>
                        <InputGroupInput
                          id={field.name}
                          type="email"
                          autoComplete="email"
                          placeholder="you@example.com"
                          aria-invalid={!!errors.email}
                          {...field}
                        />
                      </InputGroup>
                      <FieldError>{errors.email?.message}</FieldError>
                    </FieldContent>
                  </Field>
                )}
              />

              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <Field>
                    <div className="flex items-center justify-between gap-2">
                      <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                      <button
                        type="button"
                        className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                        onClick={() => {
                          // TODO: navigate once forgot-password page is implemented.
                        }}
                      >
                        Forgot password?
                      </button>
                    </div>
                    <FieldContent>
                      <InputGroup>
                        <InputGroupAddon>
                          <IconLock />
                        </InputGroupAddon>
                        <InputGroupInput
                          id={field.name}
                          type={showPassword ? "text" : "password"}
                          autoComplete="current-password"
                          placeholder="Enter your password"
                          aria-invalid={!!errors.password}
                          {...field}
                        />
                        <InputGroupButton
                          onClick={() => setShowPassword((value) => !value)}
                          aria-label={
                            showPassword ? "Hide password" : "Show password"
                          }
                        >
                          {showPassword ? <IconEyeOff /> : <IconEye />}
                        </InputGroupButton>
                      </InputGroup>
                      <FieldError>{errors.password?.message}</FieldError>
                    </FieldContent>
                  </Field>
                )}
              />
            </FieldGroup>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              Sign in
            </Button>

            <FieldSeparator>or</FieldSeparator>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={onGoogleSignIn}
            >
              <GoogleLogo className="size-5" /> Continue with Google
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              New to Cognix?{" "}
              <Link
                href="/sign-up"
                className="font-medium text-foreground hover:underline"
              >
                Create an account
              </Link>
            </p>
          </FieldSet>
        </form>
      </CardContent>
    </Card>
  )
}
