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
import {formatCurrency, formatDate} from "~/locale/format";
import {LoaderFunctionArgs} from "@remix-run/node";
import {SearchInput} from "~/components/forms";
import {requireUserId} from "~/modules/session/session.server";
import {getUserInvoices} from "~/modules/invoices.server";
import Pagination from "~/components/Pagination";

const PAGE_SIZE = 2;

export async function loader({ request }: LoaderFunctionArgs) {
    const userId = await requireUserId(request);
    
    const url = new URL(request.url);
    const searchString = url.searchParams.get('q');
    const pageNumberString = url.searchParams.get('page');
    const pageNumber = pageNumberString ? Number(pageNumberString) : 1;
    
    const [count, invoices] = await getUserInvoices(userId, searchString, pageNumber, PAGE_SIZE);
    
    return {count, invoices};
}

export default function Component() {
    const { id } = useParams();
    const navigation = useNavigation();
    const location = useLocation();
    const {count, invoices} = useLoaderData<typeof loader>();
    const [searchParams] = useSearchParams();
    const searchQuery = searchParams.get('q') || '';
    const pageNumber = searchParams.get('page')
        ? Number(searchParams.get('page'))
        : 1;
    const submit = useSubmit();
    
    return (
        <div className="w-full">
            <H1>Your income</H1>
            <div className="mt-10 w-full flex flex-col-reverse lg:flex-row">
                <section className="lg:p-8 w-full lg:max-w-2xl">
                    <H2 className="sr-only">All incomes</H2>
                    <Form method="GET" action={location.pathname} className="mb-4">
                        <input type="hidden" name="page" value="1" />
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
                                        action: `/dashboard/income/${invoice.id}?index`,
                                    }}>
                                    <p><i>{formatDate(invoice.createdAt)}</i></p>
                                    <p className="text-xl font-semibold">{invoice.title}</p>
                                    <p><b>{formatCurrency(invoice.currencyCode, invoice.amount)}</b></p>
                                </ListLinkItem>
                            ))
                        }
                    </ul>
                    <Pagination
                        action={location.pathname}
                        count={count}
                        query={searchQuery}
                        page={pageNumber}
                        pageSize={PAGE_SIZE}>                        
                    </Pagination>
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