import {H1, H2} from "~/components/headings";
import {Outlet, useLoaderData, useNavigation, useParams} from "@remix-run/react";
import {ListLinkItem} from "~/components/links";
import clsx from "clsx";
import {db} from "~/modules/db.server";
import {formatCurrency, formatDate} from "~/locale/format";

export async function loader() {
    return db.invoice.findMany({
        orderBy: {createdAt: 'desc'}
    });
}

export default function Component() {
    const { id } = useParams();
    const navigation = useNavigation();
    const invoices = useLoaderData<typeof loader>();
    
    return (
        <div className="w-full">
            <H1>Your income</H1>
            <div className="mt-10 w-full flex flex-col-reverse lg:flex-row">
                <section className="lg:p-8 w-full lg:max-w-2xl">
                    <H2 className="sr-only">All incomes</H2>
                    <ul className="flex flex-col">
                        {
                            invoices.map((invoice) => (
                                <ListLinkItem
                                    key={invoice.id}
                                    to={`/dashboard/income/${invoice.id}`}
                                    isActive={invoice.id === id}
                                    deleteProps={{
                                        ariaLabel: `Delete invoice ${invoice.title}`,
                                        action: `/dashboard/income/${invoice.id}`,
                                    }}>
                                    <p><i>{formatDate(invoice.createdAt)}</i></p>
                                    <p className="text-xl font-semibold">{invoice.title}</p>
                                    <p><b>{formatCurrency(invoice.currencyCode, invoice.amount)}</b></p>
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
);
}