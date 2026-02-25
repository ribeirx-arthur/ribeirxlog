import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
    "/",
    "/api/webhooks(.*)",
    "/driver(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
    const authData = await auth();
    
    // Se não estiver logado e a rota não for pública, manda para o Login
    if (!authData.userId && !isPublicRoute(req)) {
        return authData.redirectToSignIn();
    }
});

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};
