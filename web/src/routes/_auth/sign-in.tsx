import { createFileRoute } from '@tanstack/react-router'
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
import { Button } from "@/components/ui/button"
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
    formState: { errors },
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

  return <form onSubmit={handleSubmit(onSubmit)}>
    <FieldSet>
      <FieldTitle className="text-2xl">Welcome Back, Student 👋</FieldTitle>
      <FieldDescription>
        Enter your email and password to sign in to your Cognix account.
      </FieldDescription>
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
              <FieldLabel>Password</FieldLabel>
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
                  <InputGroupButton onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <IconEyeOff /> : <IconEye />}
                  </InputGroupButton>
                </InputGroup>
                <FieldError>{errors.password?.message}</FieldError>
              </FieldContent>
            </Field>
          )}
        />
      </FieldGroup>
      <Button type="submit">Sign In</Button>
    </FieldSet>
  </form>
}
