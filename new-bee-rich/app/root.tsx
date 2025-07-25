import {
    isRouteErrorResponse,
    Links,
    Meta,
    Outlet,
    Scripts,
    ScrollRestoration,
    useRouteError,
    useRouteLoaderData,
} from "react-router";
import { LinksFunction, LoaderFunctionArgs, MetaFunction } from "react-router";

import {PageTransitionProgressBar} from "~/components/progress";
import {H1} from "~/components/headings";
import {ButtonLink} from "~/components/links";
import {getUser} from "~/modules/session/session.server";
import './styles/tailwind.css';

export async function loader({ request }: LoaderFunctionArgs) {
    const user = await getUser(request);
    return { user };
}

export function useRootLoaderData() {
    return useRouteLoaderData<typeof loader>("root")
}

export const meta: MetaFunction = () => {
  return [
      { title: 'BeeRich' },
      {
          name: 'description',
          content: `Bee in control of your finances with BeeRich 
          - the buzzworthy expense and income tracker with a modern interface.
          Keep your finances organized and make honey with your money!`
      },
  ];
}

export const links: LinksFunction = () => [    
    { rel: "preconnect", href: "https://fonts.googleapis.com" },
    {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
    },
    {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Ubuntu:ital,wght@0,300;0,400;0,500;0,700;1,300;1,400;1,500;1,700&display=swap",
    },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="bg-background dark:bg-darkBackground text-lg text-text dark:text-darkText">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
      <>
        <PageTransitionProgressBar />
        <Outlet />
      </>
  );
}



export function ErrorBoundary() {
    const error = useRouteError();

    let heading = 'Unexpected Error';
    let message = `We are sorry. An unexpected error occurred.
                        Please try again or contact us if the problem persists.`;
    let stack: string | undefined;
    
    if (isRouteErrorResponse(error)) {
        switch (error.status) {
            case 401:
                heading = '401 Unauthorized';
                message = 'Oops! Looks like you tried to visit a page that you do not have access to.';
                break;
            case 404:
                heading = '404 Not Found';
                message = 'Oops! Looks like you tried to visit a page that does not exists.';
                break;
        }
    } else if (import.meta.env.DEV && error && error instanceof Error) {
        message = error.message;
        stack = error.stack;
    }
    const errorMessage = error instanceof Error ? error.message : null;
    return (
        <main className="m-5 lg:m-20 flex flex-col gap-5">
            <H1>{heading}</H1>
            <p>{message}</p>
            {errorMessage && (
                <div className="border-4 border-red-500 p-10">
                    <p>Error message: {errorMessage}</p>
                    {stack && (
                        <pre className="w-full p-4 overflow-x-auto">
                            <code>{stack}</code>
                        </pre>
                    )}
                </div>
            )}
            <ButtonLink to="/" isPrimary>Back to home</ButtonLink>
        </main>
    )
}