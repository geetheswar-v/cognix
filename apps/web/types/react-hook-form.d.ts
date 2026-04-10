/**
 * Type shim for react-hook-form.
 *
 * The published package's dist/index.d.ts re-exports from a non-existent
 * ../src/ directory, breaking TypeScript resolution under moduleResolution "bundler".
 * This shim provides minimal but accurate type declarations for the APIs used in this project.
 */
declare module "react-hook-form" {
  import type { ReactElement, RefCallback } from "react"

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type FieldValues = Record<string, any>

  type FieldPath<TFieldValues extends FieldValues> = string &
    keyof TFieldValues extends never
    ? string
    : string & keyof TFieldValues

  interface FieldError {
    type?: string
    message?: string
  }

  type FieldErrors<TFieldValues extends FieldValues = FieldValues> = {
    [K in keyof TFieldValues]?: FieldError
  }

  interface FormState<TFieldValues extends FieldValues> {
    errors: FieldErrors<TFieldValues>
    isSubmitting: boolean
    isDirty: boolean
    isValid: boolean
    isSubmitted: boolean
    isSubmitSuccessful: boolean
    submitCount: number
    touchedFields: Partial<Record<keyof TFieldValues, boolean>>
    dirtyFields: Partial<Record<keyof TFieldValues, boolean>>
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type Resolver<TFieldValues extends FieldValues = FieldValues> = (
    values: TFieldValues,
    context: any,
    options: any
  ) => any

  interface UseFormProps<TFieldValues extends FieldValues = FieldValues> {
    resolver?: Resolver<TFieldValues>
    defaultValues?: Partial<TFieldValues>
    mode?: "onChange" | "onBlur" | "onSubmit" | "onTouched" | "all"
    reValidateMode?: "onChange" | "onBlur" | "onSubmit"
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type RegisterOptions = Record<string, any>

  interface UseFormRegisterReturn<
    TFieldElement extends HTMLElement = HTMLElement,
  > {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onChange: (event: any) => void
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onBlur: (event: any) => void
    ref: React.RefCallback<TFieldElement>
    name: string
  }

  type UseFormRegister<TFieldValues extends FieldValues> = <
    TFieldElement extends HTMLElement = HTMLElement,
  >(
    name: keyof TFieldValues & string,
    options?: RegisterOptions
  ) => UseFormRegisterReturn<TFieldElement>

  type SubmitHandler<TFieldValues extends FieldValues> = (
    data: TFieldValues,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    event?: React.BaseSyntheticEvent<any, any, any>
  ) => void | Promise<void>

  type SubmitErrorHandler<TFieldValues extends FieldValues> = (
    errors: FieldErrors<TFieldValues>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    event?: React.BaseSyntheticEvent<any, any, any>
  ) => void | Promise<void>

  type HandleSubmit<TFieldValues extends FieldValues> = (
    onValid: SubmitHandler<TFieldValues>,
    onInvalid?: SubmitErrorHandler<TFieldValues>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) => (e?: React.BaseSyntheticEvent<any, any, any>) => Promise<void>

  interface Control<TFieldValues extends FieldValues = FieldValues> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _options?: any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any
  }

  interface UseFormReturn<TFieldValues extends FieldValues = FieldValues> {
    register: UseFormRegister<TFieldValues>
    handleSubmit: HandleSubmit<TFieldValues>
    formState: FormState<TFieldValues>
    control: Control<TFieldValues>
    reset: (values?: Partial<TFieldValues>) => void
    setValue: (
      name: keyof TFieldValues & string,
      value: TFieldValues[keyof TFieldValues]
    ) => void
    getValues: (
      name?: keyof TFieldValues & string
    ) => TFieldValues | TFieldValues[keyof TFieldValues]
    watch: (
      name?: keyof TFieldValues & string
    ) => TFieldValues | TFieldValues[keyof TFieldValues]
    setError: (name: keyof TFieldValues & string, error: FieldError) => void
    clearErrors: (
      name?: (keyof TFieldValues & string) | (keyof TFieldValues & string)[]
    ) => void
    trigger: (
      name?: (keyof TFieldValues & string) | (keyof TFieldValues & string)[]
    ) => Promise<boolean>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any
  }

  function useForm<TFieldValues extends FieldValues = FieldValues>(
    props?: UseFormProps<TFieldValues>
  ): UseFormReturn<TFieldValues>

  interface ControllerRenderProps<
    TFieldValues extends FieldValues = FieldValues,
    TName extends keyof TFieldValues & string = keyof TFieldValues & string,
  > {
    name: TName
    value: TFieldValues[TName]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onChange: (event: any) => void
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onBlur: (event: any) => void
    ref: RefCallback<HTMLElement>
  }

  interface ControllerFieldState {
    invalid: boolean
    isTouched: boolean
    isDirty: boolean
    error?: FieldError
  }

  interface ControllerProps<
    TFieldValues extends FieldValues = FieldValues,
    TName extends keyof TFieldValues & string = keyof TFieldValues & string,
  > {
    name: TName
    control: Control<TFieldValues>
    defaultValue?: TFieldValues[TName]
    render: (props: {
      field: ControllerRenderProps<TFieldValues, TName>
      fieldState: ControllerFieldState
      formState: FormState<TFieldValues>
    }) => ReactElement
  }

  function Controller<
    TFieldValues extends FieldValues = FieldValues,
    TName extends keyof TFieldValues & string = keyof TFieldValues & string,
  >(props: ControllerProps<TFieldValues, TName>): ReactElement

  export {
    useForm,
    UseFormReturn,
    UseFormProps,
    UseFormRegister,
    UseFormRegisterReturn,
    HandleSubmit,
    SubmitHandler,
    SubmitErrorHandler,
    FieldValues,
    FieldErrors,
    FieldError,
    FormState,
    Resolver,
    RegisterOptions,
    Control,
    Controller,
    ControllerProps,
    ControllerRenderProps,
    ControllerFieldState,
  }
}
