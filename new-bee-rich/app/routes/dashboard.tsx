﻿import {Container} from "~/components/containers";
import { Link as RemixLink, Outlet, useLoaderData, useLocation, useRouteError } from "react-router";
import {NavLink} from "~/components/links";
import {db} from "~/modules/db.server";
import {Expense, Invoice} from "@prisma/client";
import {H1} from "~/components/headings";
import {Form} from "~/components/forms";
import {requireUserId} from "~/modules/session/session.server";
import { HeadersFunction, LoaderFunctionArgs, MetaFunction } from "react-router";
import {PublicUser} from "~/modules/session/session";
import type { loader as rootLoader } from "~/root";
import {useEventSource} from "~/modules/server-sent-events/event-source";

export const headers: HeadersFunction = () => {
    return {
        'Cache-Control': 'no-cache, private',
    }
}

export const meta: MetaFunction<typeof loader, {root: typeof rootLoader}> = ({ matches }) => {
    const root = matches.find(
        (match) => match.id === 'root'
    );
    const user = root?.data?.user as PublicUser | null
    const userName = user?.name || null;
    const title = userName ? `${userName}'s Dashboard | BeeRich` : 'Dashboard | BeeRich';
    return [{ title }, { name: 'robots', content: 'noindex' }];
}

export async function loader({ request }: LoaderFunctionArgs){
    const userId = await requireUserId(request);
    
    const expenseQuery = db.expense
        .findFirst({
            where: { userId },
            orderBy: {createdAt: 'desc'}
        });
    const invoiceQuery = db.invoice
        .findFirst({
            where: { userId },
            orderBy: {createdAt: 'desc'}
        });
    
    const [firstExpense, firstInvoice] = await Promise.all([expenseQuery, invoiceQuery]);
    
    return {
        firstExpense,
        firstInvoice,
    };
}

export function ErrorBoundary(){
    const error = useRouteError();
    const errorMessage = error instanceof Error && error.message;
    return (
        <Layout firstExpense={null} firstInvoice={null}>
            <Container className="p-5 lg:p-20 flex flex-col gap-5">
                <H1>Unexpected error</H1>
                <p>
                    We are sorry. An unexpected error occurred.
                    Please try again or contact us if the problem persists.
                </p>
                {errorMessage && (
                    <div className="border-4 border-red-500 p-10">
                        <p>Error message: {errorMessage}</p>
                    </div>
                )}
            </Container>
        </Layout>
    )
}

type LayoutProps = {
    children: React.ReactNode;
    firstExpense: Expense | null;
    firstInvoice: Invoice | null;
}
function Layout({firstExpense, firstInvoice, children}: LayoutProps) {
    
    const location = useLocation();
    
    const expensesUrl = '/dashboard/expenses';
    const expensesActive = location.pathname.startsWith(expensesUrl);
        
    const incomeUrl = '/dashboard/income';
    const incomeActive = location.pathname.startsWith(incomeUrl);
    
    const getExpensesLinkTo = () => {
        if (firstExpense !== null && typeof firstExpense !== 'undefined') {
            return `${expensesUrl}/${firstExpense.id}`;
        } else {
            return expensesUrl;
        }
    }
    
    const getIncomeLinkTo = () => {
        if(firstInvoice !== null && typeof firstInvoice !== 'undefined') {
            return `${incomeUrl}/${firstInvoice.id}`;
        } else {
            return incomeUrl;
        }
    }

    return (
        <>
            <header className="mb-4 lg:mb-10 bg-white dark:bg-black shadow">
                <Container className="p-4 mb-10">
                    <nav>
                        <ul className="w-full flex flex-row gap-5 font-bold text-lg lg:text-2xl">
                            <li>
                                <RemixLink to="/">BeeRich (upgrading to React Router 7)</RemixLink>
                            </li>
                            <li className="ml-auto">
                                <Form method="POST" action="/logout">
                                    <button type="submit">Log out</button>
                                </Form>
                            </li>
                        </ul>
                        <ul className="w-full flex flex-row gap-5 mt-10 clear-both">
                            <li className="ml-auto">
                                <NavLink to={getIncomeLinkTo()} styleAsActive={incomeActive} prefetch="intent">Income</NavLink>
                            </li>
                            <li className="mr-auto">
                                <NavLink to={getExpensesLinkTo()} styleAsActive={expensesActive} prefetch="intent">Expenses</NavLink>
                            </li>
                        </ul>
                    </nav>
                </Container>
            </header>
            <main className="p-4 w-full flex justify-center items-center">
                {children}
            </main>
        </>
    );
}

export default function Component() {
    const { firstExpense, firstInvoice } = useLoaderData<typeof loader>();
    useEventSource();
    return (
        <Layout firstExpense={firstExpense} firstInvoice={firstInvoice}>
            <Outlet />
        </Layout>
    );
}