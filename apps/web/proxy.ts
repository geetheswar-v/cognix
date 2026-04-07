import { NextRequest, NextResponse } from "next/server";

const AUTH_ROUTES = ["/sign-in", "/sign-up", "/forget-password"];
const PUBLIC_ROUTES = ["/reset-password"];

const SESSION_COOKIE = "better-auth.session_token";
const SECURE_SESSION_COOKIE = `__Secure-${SESSION_COOKIE}`;


function hasSessionCookie(request: NextRequest): boolean {
    return (
        request.cookies.has(SESSION_COOKIE) ||
        request.cookies.has(SECURE_SESSION_COOKIE)
    );
}

export default async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const isAuthRoute = AUTH_ROUTES.some(
        (route) => pathname === route || pathname.startsWith(`${route}/`)
    );
    const isPublicRoute = PUBLIC_ROUTES.some(
        (route) => pathname === route || pathname.startsWith(`${route}/`)
    );

    if (isPublicRoute) {
        return NextResponse.next();
    }

    const hasCookie = hasSessionCookie(request);

    if (isAuthRoute && hasCookie) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    if (!isAuthRoute && !hasCookie) {
        return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
    ],
};