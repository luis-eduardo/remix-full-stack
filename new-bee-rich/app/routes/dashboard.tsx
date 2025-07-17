import {Container} from "~/components/containers";
import {Link as RemixLink, Outlet, useLoaderData, useLocation} from "@remix-run/react";
import {NavLink} from "~/components/links";
import {db} from "~/modules/db.server";

export async function loader(){
    const expenseQuery = db.expense.findFirst({orderBy: {createdAt: 'desc'}});
    const invoiceQuery = db.invoice.findFirst({orderBy: {createdAt: 'desc'}});
    
    const [firstExpense, firstInvoice] = await Promise.all([expenseQuery, invoiceQuery]);
    
    return {
        firstExpense,
        firstInvoice,
    };
}

export default function Component() {
    const location = useLocation();
    const loaderData = useLoaderData<typeof loader>();
    
    const expensesUrl = '/dashboard/expenses';
    const expensesActive = location.pathname.startsWith(expensesUrl);
        
    const incomeUrl = '/dashboard/income';
    const incomeActive = location.pathname.startsWith(incomeUrl);
    
    const getExpensesLinkTo = () => {
        if (loaderData.firstExpense !== null) {
            return `${expensesUrl}/${loaderData.firstExpense.id}`;
        } else {
            return expensesUrl;
        }
    }
    
    const getIncomeLinkTo = () => {
        if(loaderData.firstInvoice !== null) {
            return `${incomeUrl}/${loaderData.firstInvoice.id}`;
        } else {
            return incomeUrl;
        }
    }

    return (
        <>
            <header className="mb-4 lg:mb-10 bg-white shadow">
                <Container className="p-4 mb-10">
                    <nav>
                        <ul className="w-full flex flex-row gap-5 font-bold text-lg lg:text-2xl">
                            <li>
                                <RemixLink to="/">BeeRich</RemixLink>
                            </li>
                            <li className="ml-auto">
                                <RemixLink to="/404">Log out</RemixLink>
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
                <Outlet />
            </main>
        </>
    );
}