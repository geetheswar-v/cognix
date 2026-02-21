import { createFileRoute, Link } from '@tanstack/react-router'
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { signinSchema, type SigninValues } from "@/lib/validation"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput
} from "@/components/ui/input-group"
import { Button, buttonVariants } from "@/components/ui/button"
import { IconEye, IconEyeOff, IconLock, IconMail } from "@tabler/icons-react"
import { useState } from 'react'

export const Route = createFileRoute('/_auth/sign-in')({
  component: SignInPage,
})

function SignInPage() {
  const [showPassword, setShowPassword] = useState(false);
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
  });

  function onSubmit(data: SigninValues) {
    console.log(data);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-1">
        <FieldTitle className="text-2xl">Sign In to Cognix</FieldTitle>
        <FieldDescription>
          Enter your email and password to access your account.
        </FieldDescription>
      </div>

      <FieldSet>
        <FieldGroup>
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <Field>
                <FieldLabel>Email</FieldLabel>
                <FieldContent>
                  <InputGroup>
                    <InputGroupAddon>
                      <IconMail />
                    </InputGroupAddon>
                    <InputGroupInput
                      id={field.name}
                      type="email"
                      placeholder="Enter your email"
                      {...field} />
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
                <div className="flex items-center justify-between">
                  <FieldLabel>Password</FieldLabel>
                  <Link
                    to="/forget-password"
                    className={buttonVariants({ variant: "link", className: "h-auto px-0 text-sm font-medium" })}
                  >
                    Forgot Password?
                  </Link>
                </div>
                <FieldContent>
                  <InputGroup>
                    <InputGroupAddon>
                      <IconLock />
                    </InputGroupAddon>
                    <InputGroupInput
                      id={field.name}
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      {...field} />
                    <InputGroupButton onClick={() => setShowPassword(!showPassword)} type="button">
                      {showPassword ? <IconEyeOff /> : <IconEye />}
                    </InputGroupButton>
                  </InputGroup>
                  <FieldError>{errors.password?.message}</FieldError>
                </FieldContent>
              </Field>
            )}
          />
        </FieldGroup>
        <Button type="submit" className="w-full" disabled={isSubmitting}>Sign In</Button>
      </FieldSet>

      <div className="text-center text-sm text-zinc-500">
        Don't have an account?{" "}
        <Link
          to="/sign-up"
          className={buttonVariants({ variant: "link", className: "h-auto p-0 font-medium" })}
        >
          Sign Up
        </Link>
      </div>
    </form>
  )
}
