import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { requireNotAuth, signUp } from '@/lib/auth'
import { toast } from 'sonner'
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { signupSchema, type SignupValues } from "@/lib/validation"
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
import { IconEye, IconEyeOff, IconLock, IconMail, IconUser } from "@tabler/icons-react"
import { useState } from 'react'

export const Route = createFileRoute('/_auth/sign-up')({
  beforeLoad: async () => {
    await requireNotAuth()
  },
  component: SignUpPage,
})

function SignUpPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
  });

  async function onSubmit(data: SignupValues) {
    const { error } = await signUp({
      name: data.name,
      email: data.email,
      password: data.password,
    })

    if (error) {
      const detail = (error as any)?.detail
      toast.error(typeof detail === 'string' ? detail : "Failed to create account.")
      return
    }

    toast.success("Account created! Please check your email to verify.")
    navigate({ to: "/sign-in" })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-1">
        <FieldTitle className="text-2xl">Create an Account</FieldTitle>
        <FieldDescription>
          Enter your details below to create your Cognix account.
        </FieldDescription>
      </div>

      <FieldSet>
        <FieldGroup>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <Field>
                <FieldLabel>Name</FieldLabel>
                <FieldContent>
                  <InputGroup>
                    <InputGroupAddon>
                      <IconUser />
                    </InputGroupAddon>
                    <InputGroupInput
                      id={field.name}
                      type="text"
                      placeholder="Enter your name"
                      {...field} />
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
                <FieldLabel>Password</FieldLabel>
                <FieldContent>
                  <InputGroup>
                    <InputGroupAddon>
                      <IconLock />
                    </InputGroupAddon>
                    <InputGroupInput
                      id={field.name}
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password"
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
          <Controller
            name="confirmPassword"
            control={control}
            render={({ field }) => (
              <Field>
                <FieldLabel>Confirm Password</FieldLabel>
                <FieldContent>
                  <InputGroup>
                    <InputGroupAddon>
                      <IconLock />
                    </InputGroupAddon>
                    <InputGroupInput
                      id={field.name}
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      {...field} />
                    <InputGroupButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} type="button">
                      {showConfirmPassword ? <IconEyeOff /> : <IconEye />}
                    </InputGroupButton>
                  </InputGroup>
                  <FieldError>{errors.confirmPassword?.message}</FieldError>
                </FieldContent>
              </Field>
            )}
          />
        </FieldGroup>
        <Button type="submit" className="w-full" disabled={isSubmitting}>Sign Up</Button>
      </FieldSet>

      <div className="text-center text-sm text-zinc-500">
        Already have an account?{" "}
        <Link
          to="/sign-in"
          className={buttonVariants({ variant: "link", className: "h-auto p-0 font-medium" })}
        >
          Sign In
        </Link>
      </div>
    </form>
  )
}
