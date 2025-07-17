import {ActionFunctionArgs, LoaderFunctionArgs, redirect} from "@remix-run/node";
import {useActionData, useLoaderData, useNavigation} from "@remix-run/react";
import {H2} from "~/components/headings";
import {db} from "~/modules/db.server";
import {FloatingActionLink} from "~/components/links";
import {Form, Input, Textarea} from "~/components/forms";
import {Button} from "~/components/buttons";

export async function loader({ params }: LoaderFunctionArgs) {
    const { id } = params;
    const expense = await db.expense.findUnique({ where: { id } });
    if (!expense) {
        throw new Response('Not Found', { status: 404 });
    }
    return expense;
}

async function updateExpense(formData: FormData, id: string) {
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
        where: { id },
        data: {
            title,
            description,
            amount: amountNumber,
        }
    });
    return { success: true };
}

async function deleteExpense(request: Request, id: string) {
    const referer = request.headers.get('referer');
    const redirectPath = referer || '/dashboard/expenses';
    
    try {
        await db.expense.delete({ where: { id } });
    } catch (e) {
        throw new Response('Not Found', { status: 404 });
    }
    
    if (redirectPath.includes(id)) {
        return redirect('/dashboard/expenses');
    }
    return redirect(redirectPath);
}

export async function action({ params, request } : ActionFunctionArgs) {
    const { id } = params;
    
    if (!id) throw Error('id route parameter must be defined');

    const formData = await request.formData();
    const intent = formData.get("intent");
    
    if (intent === 'delete') {
        return deleteExpense(request, id);
    }
    
    if (intent === 'update') {
        return updateExpense(formData, id);
    }

    throw new Response('Bad request', { status: 400 });
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