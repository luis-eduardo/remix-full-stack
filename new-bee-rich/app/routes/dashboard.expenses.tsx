import {
    Form,
    Outlet,
    useLoaderData,
    useLocation,
    useNavigation,
    useParams,
    useSearchParams,
    useSubmit,
} from "react-router";
import clsx from "clsx";
import {H1, H2} from "~/components/headings";
import {ListLinkItem} from "~/components/links";
import {formatCurrency, formatDate} from "~/locale/format";
import { LoaderFunctionArgs } from "react-router";
import {SearchInput} from "~/components/forms";
import {requireUserId} from "~/modules/session/session.server";
import {getUserExpenses} from "~/modules/expenses.server";
import Pagination from "~/components/Pagination";

const PAGE_SIZE = 5;

export async function loader({ request } : LoaderFunctionArgs) {
    const userId = await requireUserId(request);
    
    const url = new URL(request.url);
    const searchString = url.searchParams.get('q');
    const pageNumberString = url.searchParams.get('page');
    const pageNumber = pageNumberString ? Number(pageNumberString) : 1;
    
    const [count, expenses] = await getUserExpenses(userId, searchString, pageNumber, PAGE_SIZE);
    
    return {count, expenses};
}

export default function Component() {
    const navigation = useNavigation();
    const location = useLocation();
    const {count, expenses} = useLoaderData<typeof loader>();
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const searchQuery = searchParams.get('q') || '';
    const pageNumber: number = searchParams.get('page')
        ? Number(searchParams.get('page'))
        : 1;
    const submit = useSubmit();
    
    return (
        <div className="w-full">
            <H1>Your expenses</H1>
            <div className="mt-10 w-full flex flex-col-reverse lg:flex-row">
                <section className="lg:p-8 w-full lg:max-w-2xl">
                    <H2 className="sr-only">All expenses</H2>
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
                            expenses.map(expense => (
                                <ListLinkItem
                                    key={expense.id}
                                    to={`/dashboard/expenses/${expense.id}`}
                                    isActive={expense.id === id}
                                    deleteProps={{ 
                                        ariaLabel: `Delete expense ${expense.title}`,
                                        action: `/dashboard/expenses/${expense.id}?index`,
                                    }}>
                                    <p><i>{formatDate(expense.createdAt)}</i></p>
                                    <p className="text-xl font-semibold">{expense.title}</p>
                                    <p><b>{formatCurrency(expense.currencyCode, expense.amount)}</b></p>
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
)
}