import {ActionFunctionArgs, LoaderFunctionArgs, redirect} from "@remix-run/node";
import {
    isRouteErrorResponse,
    useActionData,
    useLoaderData,
    useNavigation,
    useParams,
    useRouteError
} from "@remix-run/react";
import {H2} from "~/components/headings";
import {db} from "~/modules/db.server";
import {FloatingActionLink} from "~/components/links";
import {Form, Input, Textarea} from "~/components/forms";
import {Button} from "~/components/buttons";
import {requireUserId} from "~/modules/session/session.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
    const userId = await requireUserId(request);
    
    const { id } = params;    
    if (!id) throw new Error("id route parameter must be defined");
    
    const expense = await db.expense
        .findUnique({
            where: {
                id_userId: { id, userId }
            }
        });
    if (!expense) {
        throw new Response('Not Found', { status: 404 });
    }
    return expense;
}

async function updateExpense(formData: FormData, id: string, userId: string) {
    const title = formData.get('title');
    const description = formData.get('description');
    const amount = formData.get('amount');

    if (typeof title !== 'string' || typeof description !== 'string' || typeof amount !== 'string') {
        throw Error('Something went wrong');
    }

    const amountNumber = Number.parseFloat(amount);

    if (Number.isNaN(amountNumber)) {
        throw Error('Number is invalid');
    }

    await db.expense.update({
        where: {
            id_userId: { id, userId }
        },
        data: {
            title,
            description,
            amount: amountNumber,
        }
    });
    return { success: true };
}

async function deleteExpense(request: Request, id: string, userId: string) {
    const referer = request.headers.get('referer');
    const redirectPath = referer || '/dashboard/expenses';
    
    try {
        await db.expense.delete({
            where: {
                id_userId: { id, userId }
            } 
        });
    } catch (e) {
        throw new Response('Not Found', { status: 404 });
    }
    
    if (redirectPath.includes(id)) {
        return redirect('/dashboard/expenses');
    }
    return redirect(redirectPath);
}

export async function action({ params, request } : ActionFunctionArgs) {
    const userId = await requireUserId(request);
    
    const { id } = params;
    
    if (!id) throw Error('id route parameter must be defined');

    const formData = await request.formData();
    const intent = formData.get("intent");
    
    if (intent === 'delete') {
        return deleteExpense(request, id, userId);
    }
    
    if (intent === 'update') {
        return updateExpense(formData, id, userId);
    }

    throw new Response('Bad request', { status: 400 });
}

export function ErrorBoundary() {
    const error = useRouteError();
    const {id} = useParams();
    let heading = 'Something went wrong';
    let message = <>Apologies, something went wrong on our end, please try again.</>;
    if (isRouteErrorResponse(error) && error.status === 404) {
        heading = 'Expense not found';
        message = <>Apologies, the expense with the id <b>{id}</b> cannot be found.</>; 
    }
    return (
        <>
            <div className="w-full m-auto lg:max-w-3xl flex flex-col items-center justify-center gap-5">
                <H2>{heading}</H2>
                <p>{message}</p>
            </div>
            <FloatingActionLink to="/dashboard/expenses/">Add expense</FloatingActionLink>
        </>
    );
}

export default function Component() {
    const expense = useLoaderData<typeof loader>();
    const actionData = useActionData<typeof action>();
    const navigation = useNavigation();
    const isSubmitting = navigation.state !== 'idle' && navigation.formAction === `/dashboard/expenses/${expense.id}`;
    return (
        <>
            <H2>{expense.title}</H2>
            <p>${expense.amount}</p>

            <Form method="POST" action={`/dashboard/expenses/${expense.id}`} key={expense.id}>
                <Input name="title" type="text" label="Title:" defaultValue={expense.title} required />
                <Textarea name="description" label="Description:" defaultValue={expense.description || ''} />
                <Input name="amount" type="number" label="Amount (in USD):" defaultValue={expense.amount} required />
                <Button type="submit" name="intent" value="update" isPrimary disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Save'}
                </Button>
                <p aria-live="polite" className="text-green-600">
                    {actionData?.success && 'Changes saved!'}
                </p>
            </Form>
            
            <FloatingActionLink to="/dashboard/expenses/">Add expense</FloatingActionLink>
        </>
    );
}