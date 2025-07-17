import {LoaderFunctionArgs, redirect} from "@remix-run/node";
import {useActionData, useLoaderData, useNavigation} from "@remix-run/react";
import {H2} from "~/components/headings";
import {db} from "~/modules/db.server";
import {FloatingActionLink} from "~/components/links";
import {Form, Input, Textarea} from "~/components/forms";
import {Button} from "~/components/buttons";

export async function loader({ params } : LoaderFunctionArgs) {
    const { id } = params;
    const invoice = await db.invoice.findUnique({ where: { id }});
    if (!invoice) {
        throw new Response('Not Found', { status: 404 });
    }
    return invoice;
}

async function updateInvoice(formData: FormData, id: string) {
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
    
    await db.invoice.update({
        where: { id },
        data: {
            title,
            description,
            amount: amountNumber,
        }
    });
    
    return { success: true };
}

async function deleteInvoice(request: Request, id: string) {
    const referer = request.headers.get('referer');
    const redirectPath = referer || 'dashboard/income';
    
    try {
        await db.invoice.delete({ where: { id } });
    } catch (e) {
        throw new Response('Not Found', { status: 404 });
    }
    
    if (redirectPath.includes(id)) {
        return redirect('/dashboard/income');
    }
    return redirect(redirectPath);
}

export async function action({ params, request } : LoaderFunctionArgs) {
    const { id } = params;
    
    if (!id) throw Error('id route parameter must be defined');
    
    const formData = await request.formData();
    const intent = formData.get('intent');
    
    if (intent === 'delete') {
        return deleteInvoice(request, id);
    }
    
    if (intent === 'update') {
        return updateInvoice(formData, id);
    }
    
    throw new Response('Bad request', { status: 400 });
}

export default function Component() {
    const invoice = useLoaderData<typeof loader>();
    const actionData = useActionData<typeof action>();
    const navigation = useNavigation();
    const isSubmitting = navigation.state !== 'idle' && navigation.formAction === `/dashboard/income/${invoice.id}`;
    return (
        <>
            <H2>{invoice.title}</H2>
            <p>${invoice.amount}</p>

            <Form method="POST" action={`/dashboard/income/${invoice.id}`} key={invoice.id}>
                <Input name="title" type="text" label="Title:" defaultValue={invoice.title} required />
                <Textarea name="description" label="Description:" defaultValue={invoice.description || ''} />
                <Input name="amount" type="number" label="Amount (in USD):" defaultValue={invoice.amount} required />
                <Button type="submit" name="intent" value="update" isPrimary disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Save'}
                </Button>
                <p aria-live="polite" className="text-green-600">
                    {actionData?.success && 'Changes saved!'}
                </p>
            </Form>
            
            <FloatingActionLink to="/dashboard/income">Add invoice</FloatingActionLink>
        </>
    )
}