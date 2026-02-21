import { createFileRoute, Link } from '@tanstack/react-router'
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { forgetPasswordSchema, type ForgetPasswordValues } from "@/lib/validation"
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
  InputGroupInput
} from "@/components/ui/input-group"
import { Button, buttonVariants } from "@/components/ui/button"
import { IconMail, IconArrowLeft } from "@tabler/icons-react"

export const Route = createFileRoute('/_auth/forget-password')({
  component: PasswordResetPage,
})

function PasswordResetPage() {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgetPasswordValues>({
    resolver: zodResolver(forgetPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  function onSubmit(data: ForgetPasswordValues) {
    console.log(data);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex flex-col items-start space-y-4">
        <Link
          to="/sign-in"
          className={buttonVariants({ variant: "link", className: "h-auto p-0 font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-2" })}
        >
          <IconArrowLeft className="h-4 w-4" />
          Back to Sign In
        </Link>
        <div className="space-y-1">
          <FieldTitle className="text-2xl">Reset Password</FieldTitle>
          <FieldDescription>
            Enter your email address and we'll send you a link to reset your password.
          </FieldDescription>
        </div>
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
        </FieldGroup>
        <Button type="submit" className="w-full" disabled={isSubmitting}>Send Reset Link</Button>
      </FieldSet>
    </form>
  )
}
