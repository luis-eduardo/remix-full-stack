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
import clsx from "clsx";
import {H1, H2} from "~/components/headings";
import {ListLinkItem} from "~/components/links";
import {db} from "~/modules/db.server";
import {formatCurrency, formatDate} from "~/locale/format";
import {LoaderFunctionArgs} from "@remix-run/node";
import {SearchInput} from "~/components/forms";

export async function loader({ request } : LoaderFunctionArgs) {
    const url = new URL(request.url);
    const searchString = url.searchParams.get('q');
    
    return db.expense.findMany({
        where: {
            title: { contains: searchString || '' }
        },
        orderBy: {createdAt: 'desc'},
    });
}

export default function Component() {
    const navigation = useNavigation();
    const location = useLocation();
    const expenses = useLoaderData<typeof loader>();
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const searchQuery = searchParams.get('q') || '';
    const submit = useSubmit();
    
    return (
        <div className="w-full">
            <H1>Your expenses</H1>
            <div className="mt-10 w-full flex flex-col-reverse lg:flex-row">
                <section className="lg:p-8 w-full lg:max-w-2xl">
                    <H2 className="sr-only">All expenses</H2>
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
                            expenses.map(expense => (
                                <ListLinkItem
                                    key={expense.id}
                                    to={`/dashboard/expenses/${expense.id}`}
                                    isActive={expense.id === id}
                                    deleteProps={{ 
                                        ariaLabel: `Delete expense ${expense.title}`,
                                        action: `/dashboard/expenses/${expense.id}`, 
                                    }}>
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