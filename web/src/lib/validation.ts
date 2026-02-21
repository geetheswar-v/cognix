import { z } from "zod";

export const signinSchema = z.object({
    email: z.string().email("Please enter a valid email address."),
    password: z.string().min(8, "Password must be at least 8 characters."),
})

export type SigninValues = z.infer<typeof signinSchema>

export const signupSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters."),
    email: z.string().email("Please enter a valid email address."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

export type SignupValues = z.infer<typeof signupSchema>

export const forgetPasswordSchema = z.object({
    email: z.string().email("Please enter a valid email address."),
});

export type ForgetPasswordValues = z.infer<typeof forgetPasswordSchema>