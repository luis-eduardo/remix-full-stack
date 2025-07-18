import {H1, H2} from "~/components/headings";
import {
    Form,
    Outlet,
    useLoaderData,
    useLocation,
    useNavigation,
    useParams,
    useSearchParams,
    useSubmit
} from "@remix-run/react";
import {ListLinkItem} from "~/components/links";
import clsx from "clsx";
import {db} from "~/modules/db.server";
import {formatCurrency, formatDate} from "~/locale/format";
import {LoaderFunctionArgs} from "@remix-run/node";
import {SearchInput} from "~/components/forms";
import {requireUserId} from "~/modules/session/session.server";

export async function loader({ request }: LoaderFunctionArgs) {
    const userId = await requireUserId(request);
    
    const url = new URL(request.url);
    const searchString = url.searchParams.get('q');
    
    return db.invoice.findMany({
        where: {
            userId,
            title: { contains: searchString || '' }  
        },
        orderBy: {createdAt: 'desc'}
    });
}

export default function Component() {
    const { id } = useParams();
    const navigation = useNavigation();
    const location = useLocation();
    const invoices = useLoaderData<typeof loader>();
    const [searchParams] = useSearchParams();
    const searchQuery = searchParams.get('q') || '';
    const submit = useSubmit();
    
    return (
        <div className="w-full">
            <H1>Your income</H1>
            <div className="mt-10 w-full flex flex-col-reverse lg:flex-row">
                <section className="lg:p-8 w-full lg:max-w-2xl">
                    <H2 className="sr-only">All incomes</H2>
                    <Form method="GET" action={location.pathname} className="mb-4">
                        <SearchInput name="q" type="search"
                           defaultValue={searchQuery}
                           onChange={(e) => submit(e.target.form)}
                           placeholder="Search..."
                             label="Search by title"
                             autoFocus
                        />
                    </Form>
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