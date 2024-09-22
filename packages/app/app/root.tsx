import "@fontsource/inter/100.css";
import "@fontsource/inter/200.css";
import "@fontsource/inter/300.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/inter/800.css";
import "@fontsource/inter/900.css";
import "./tailwind.css";

import { ClerkApp } from "@clerk/remix";
import { rootAuthLoader } from "@clerk/remix/ssr.server";
import { NextUIProvider } from "@nextui-org/react";
import {
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  redirectDocument,
  useNavigate,
  useRouteError,
} from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/server-runtime";
import { ArrowRightIcon } from "lucide-react";
import type { FC, PropsWithChildren } from "react";
import { Toaster } from "sonner";
import { env } from "~/utils/env.server";
import { TrpcProvider } from "./components/TrpcProvider";
import { FLY_DEPLOY_URL } from "./utils/createMetadata";

export const loader = (args: LoaderFunctionArgs) => {
  const url = new URL(args.request.url);

  if (url.host.includes(FLY_DEPLOY_URL)) {
    throw redirectDocument(env.server.PUBLIC_WEBSITE_URL, { status: 301 });
  }

  return rootAuthLoader(
    args,
    () => {
      return { env: env.client };
    },
    {
      secretKey: env.server.CLERK_SECRET_KEY,
      publishableKey: env.server.CLERK_PUBLISHABLE_KEY,
    },
  );
};

export type RootLoader = typeof loader;

export const Layout: FC<PropsWithChildren> = ({ children }) => {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicons/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicons/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="96x96" href="/favicons/favicon-96x96.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/favicons/favicon-192x192.png" />
        <link rel="shortcut icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <meta name="theme-color" content="#001404" />
        <Meta />
        <Links />
      </head>
      <body className="bg-gray-50">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
};

const App = () => {
  const navigate = useNavigate();

  return (
    <NextUIProvider navigate={navigate}>
      <TrpcProvider>
        <div>
          <div>
            <Outlet />
          </div>
          <Toaster />
        </div>
      </TrpcProvider>
    </NextUIProvider>
  );
};

export const ErrorBoundary = () => {
  const error = useRouteError();

  return (
    <div className="flex flex-col min-h-screen justify-center items-center gap-4">
      <h1 className="font-bold text-center text-4xl">
        {isRouteErrorResponse(error)
          ? `${error.status} ${error.statusText}`
          : error instanceof Error
            ? error.message
            : "Unknown Error"}
      </h1>
      <Link to="/" className="flex items-center gap-2 hover:text-gray-200 transition cursor-pointer px-4 py-1">
        <p>Go Home</p>
        <ArrowRightIcon className="w-4 h-4" />
      </Link>
    </div>
  );
};

export default ClerkApp(App, { afterSignOutUrl: "/login" });
