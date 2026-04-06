"use client"

import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  IconEye,
  IconEyeOff,
  IconLock,
  IconMail,
  IconUser,
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
  FieldTitle,
  FieldSeparator,
} from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { signIn } from "@/lib/auth-client"
import { signupSchema, type SignupValues } from "@/lib/validation"

export default function SignUpPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const callbackURL =
    typeof window !== "undefined" ? `${window.location.origin}/` : "/"

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  function onSubmit(data: SignupValues) {
    console.log("Sign up payload", data)
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
                Start your NEET journey
              </FieldTitle>
              <FieldDescription>
                Create your Cognix account to access daily tests, AI paper
                generation, and performance review tools.
              </FieldDescription>
            </div>

            <FieldGroup className="gap-5">
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Full name</FieldLabel>
                    <FieldContent>
                      <InputGroup>
                        <InputGroupAddon>
                          <IconUser />
                        </InputGroupAddon>
                        <InputGroupInput
                          id={field.name}
                          type="text"
                          autoComplete="name"
                          placeholder="Your full name"
                          aria-invalid={!!errors.name}
                          {...field}
                        />
                      </InputGroup>
                      <FieldError>{errors.name?.message}</FieldError>
                    </FieldContent>
                  </Field>
                )}
              />

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
                    <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                    <FieldContent>
                      <InputGroup>
                        <InputGroupAddon>
                          <IconLock />
                        </InputGroupAddon>
                        <InputGroupInput
                          id={field.name}
                          type={showPassword ? "text" : "password"}
                          autoComplete="new-password"
                          placeholder="Create a strong password"
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

              <Controller
                name="confirmPassword"
                control={control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Confirm password</FieldLabel>
                    <FieldContent>
                      <InputGroup>
                        <InputGroupAddon>
                          <IconLock />
                        </InputGroupAddon>
                        <InputGroupInput
                          id={field.name}
                          type={showConfirmPassword ? "text" : "password"}
                          autoComplete="new-password"
                          placeholder="Re-enter password"
                          aria-invalid={!!errors.confirmPassword}
                          {...field}
                        />
                        <InputGroupButton
                          onClick={() =>
                            setShowConfirmPassword((value) => !value)
                          }
                          aria-label={
                            showConfirmPassword
                              ? "Hide confirm password"
                              : "Show confirm password"
                          }
                        >
                          {showConfirmPassword ? <IconEyeOff /> : <IconEye />}
                        </InputGroupButton>
                      </InputGroup>
                      <FieldError>{errors.confirmPassword?.message}</FieldError>
                    </FieldContent>
                  </Field>
                )}
              />
            </FieldGroup>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              Sign up
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
              Already have an account?{" "}
              <Link href="/sign-in" className="font-medium text-foreground hover:underline">
                Sign in
              </Link>
            </p>
          </FieldSet>
        </form>
      </CardContent>
    </Card>
  )
}
