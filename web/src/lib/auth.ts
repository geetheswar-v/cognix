import { redirect } from '@tanstack/react-router'
import {
    getSessionAuthSessionGet,
    signInAuthSignInPost,
    signUpAuthSignUpPost,
    forgetPasswordAuthForgetPasswordPost,
} from '@/client/sdk.gen'
import type { SignInRequest, SignUpRequest, ForgetPasswordRequest } from '@/client/types.gen'

export const signIn = async (data: SignInRequest) => {
    return await signInAuthSignInPost({ body: data, throwOnError: false })
}

export const signUp = async (data: SignUpRequest) => {
    return await signUpAuthSignUpPost({ body: data, throwOnError: false })
}

export const forgetPassword = async (data: ForgetPasswordRequest) => {
    return await forgetPasswordAuthForgetPasswordPost({ body: data, throwOnError: false })
}

export const getSession = async (): Promise<boolean> => {
    try {
        const { data, error } = await getSessionAuthSessionGet({ throwOnError: false })
        if (error || !data) {
            return false
        }
        return true
    } catch (e) {
        return false
    }
}


export const requireAuth = async () => {
    const isAuth = await getSession()
    if (!isAuth) {
        throw redirect({
            to: '/sign-in',
        })
    }
}

export const requireNotAuth = async () => {
    const isAuth = await getSession()
    if (isAuth) {
        throw redirect({
            to: '/',
        })
    }
}
