import {Outlet, useLoaderData, useNavigation} from "@remix-run/react";
import clsx from "clsx";
import {H1, H2} from "~/components/headings";
import {ListLinkItem} from "~/components/links";
import {db} from "~/modules/db.server";
import {Expense} from "@prisma/client";
import {formatCurrency, formatDate} from "~/locale/format";

export async function loader() {
    return db.expense.findMany({
        orderBy: {createdAt: 'desc'},
    });
}

export default function Component() {
    const navigation = useNavigation();
    const expenses = useLoaderData<typeof loader>();
    
    return (
        <div className="w-full">
            <H1>Your expenses</H1>
            <div className="mt-10 w-full flex flex-col-reverse lg:flex-row">
                <section className="lg:p-8 w-full lg:max-w-2xl">
                    <H2 className="sr-only">All expenses</H2>
                    <ul className="flex flex-col">
                        {
                            expenses.map(expense => (
                                <ListLinkItem key={expense.id} to={`/dashboard/expenses/${expense.id}`}>
                                    <p><i>{formatDate(expense.createdAt)}</i></p>
                                    <p className="text-xl font-semibold">{expense.title}</p>
                                    <p><b>{formatCurrency(expense.currencyCode, expense.amount)}</b></p>
                                </ListLinkItem>
                            ))
                        }
                    </ul>
                </section>
                <section
                    className={clsx('lg:p-8 w-full', navigation.state === 'loading' && 'motion-safe:animate-pulse')}>
                    <div className="w-full h-full p-8">
                        <Outlet/>
                    </div>
                </section>
            </div>
        </div>
)
}