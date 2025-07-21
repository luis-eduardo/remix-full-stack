import {ActionFunctionArgs, LoaderFunctionArgs, redirect, unstable_parseMultipartFormData} from "@remix-run/node";
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
import {Attachment, Form, Input, Textarea} from "~/components/forms";
import {Button} from "~/components/buttons";
import {requireUserId} from "~/modules/session/session.server";
import {deleteAttachment, uploadHandler} from "~/modules/attachments.server";

export async function loader({ request, params } : LoaderFunctionArgs) {
    const userId = await requireUserId(request);
    
    const { id } = params;    
    if (!id) throw new Error("id route parameter must be defined.")
    
    const invoice = await db.invoice
        .findUnique({
            where: {
                id_userId: { id, userId },
            }
        });
    if (!invoice) {
        throw new Response('Not Found', { status: 404 });
    }
    return invoice;
}

async function updateInvoice(formData: FormData, id: string, userId: string) {
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

    let attachment= formData.get('attachment');
    if(!attachment || typeof attachment !== 'string') {
        attachment = null;
    }
    
    await db.invoice.update({
        where: {
            id_userId: { id, userId },
        },
        data: {
            title,
            description,
            amount: amountNumber,
            attachment,
        }
    });
    
    return { success: true };
}

async function deleteInvoice(request: Request, id: string, userId: string) {
    const referer = request.headers.get('referer');
    const redirectPath = referer || 'dashboard/income';
    
    try {
        const invoice = await db.invoice.delete({
            where: {
                id_userId: { id, userId },
            }
        });
        if (invoice.attachment) {
            await deleteAttachment(invoice.attachment);
        }
    } catch (e) {
        throw new Response('Not Found', { status: 404 });
    }
    
    if (redirectPath.includes(id)) {
        return redirect('/dashboard/income');
    }
    return redirect(redirectPath);
}

async function removeAttachment(formData:FormData, id: string, userId: string) {
    const attachmentUrl = formData.get('attachmentUrl');
    if (!attachmentUrl || typeof attachmentUrl !== 'string') {
        throw Error('Something went wrong');
    }
    const fileName = attachmentUrl.split('/').pop();
    if (!fileName) {
        throw Error('Something went wrong');
    }
    await db.invoice.update({
        where: {
            id_userId: { id, userId },
        },
        data: {
            attachment: null
        }
    });
    await deleteAttachment(fileName);
    return { success: true };
}

export async function action({ params, request } : ActionFunctionArgs) {
    const userId = await requireUserId(request);
    
    const { id } = params;
    
    if (!id) throw Error('id route parameter must be defined');

    let formData: FormData;
    const contentType = request.headers.get('content-type');
    if (contentType?.toLowerCase().includes('multipart/form-data')) {
        formData = await unstable_parseMultipartFormData(request, uploadHandler);
    } else {
        formData = await request.formData();
    }

    const intent = formData.get('intent');
    
    if (intent === 'delete') {
        return deleteInvoice(request, id, userId);
    }
    
    if (intent === 'update') {
        return updateInvoice(formData, id, userId);
    }

    if (intent === 'remove-attachment') {
        return removeAttachment(formData, id, userId);
    }
    
    throw new Response('Bad request', { status: 400 });
}

export function ErrorBoundary() {
    const error = useRouteError();
    const {id} = useParams();
    let heading = 'Something went wrong';
    let message = <>Apologies, something went wrong on our end, please try again.</>;
    if (isRouteErrorResponse(error) && error.status === 404) {
        heading = 'Invoice not Found';
        message = <>Apologies, the invoice with the id <b>{id}</b> cannot be found.</>;
    }    
    return (
        <>
            <div className="w-full m-auto lg:max-w-3xl flex flex-col items-center justify-center gap-5">
                <H2>{heading}</H2>
                <p>{message}</p>
            </div>
            <FloatingActionLink to="/dashboard/income/">Add invoice</FloatingActionLink>
        </>
    )
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

            <Form method="POST" action={`/dashboard/income/${invoice.id}?index`} key={invoice.id} encType="multipart/form-data">
                <Input name="title" type="text" label="Title:" defaultValue={invoice.title} required />
                <Textarea name="description" label="Description:" defaultValue={invoice.description || ''} />
                <Input name="amount" type="number" label="Amount (in USD):" defaultValue={invoice.amount} required />
                {invoice.attachment
                    ?   <Attachment label="Your attachment" attachmentUrl={`/dashboard/income/${invoice.id}/attachments/${invoice.attachment}`} />
                    :   <Input name="attachment" type="file" label="New attachment" />
                }
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