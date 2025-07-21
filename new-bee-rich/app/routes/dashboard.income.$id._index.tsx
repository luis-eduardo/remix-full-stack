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
import {FloatingActionLink} from "~/components/links";
import {Attachment, Form, Input, Textarea} from "~/components/forms";
import {Button} from "~/components/buttons";
import {requireUserId} from "~/modules/session/session.server";
import {uploadHandler} from "~/modules/attachments.cloudinary.server";
import {
    deleteInvoice,
    getInvoice,
    parseInvoice,
    removeAttachmentFromInvoice,
    updateInvoice
} from "~/modules/invoices.server";

export async function loader({ request, params } : LoaderFunctionArgs) {
    const userId = await requireUserId(request);
    
    const { id } = params;    
    if (!id) throw new Error("id route parameter must be defined.")
    
    const invoice = await getInvoice(id, userId);
    if (!invoice) {
        throw new Response('Not Found', { status: 404 });
    }
    return invoice;
}

async function handleUpdate(formData: FormData, id: string, userId: string) {
    const expenseData = parseInvoice(formData);
    await updateInvoice({ id, userId, ...expenseData });
    return { success: true };
}

async function handleDelete(request: Request, id: string, userId: string) {
    const referer = request.headers.get('referer');
    const redirectPath = referer || 'dashboard/income';
    
    try {
        await deleteInvoice(id, userId);
    } catch (e) {
        return { success: false };
    }
    
    if (redirectPath.includes(id)) {
        return redirect('/dashboard/income');
    }
    return redirect(redirectPath);
}

async function handleRemoveAttachment(formData:FormData, id: string, userId: string) {
    const attachmentUrl = formData.get('attachmentUrl');
    if (!attachmentUrl || typeof attachmentUrl !== 'string') {
        throw Error('Something went wrong');
    }

    await removeAttachmentFromInvoice(id, userId, attachmentUrl);
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
        return handleDelete(request, id, userId);
    }
    
    if (intent === 'update') {
        return handleUpdate(formData, id, userId);
    }

    if (intent === 'remove-attachment') {
        return handleRemoveAttachment(formData, id, userId);
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
    const attachment = navigation.formData?.get('attachment');
    const isUploadingAttachment = attachment instanceof File && attachment.name !== '';
    return (
        <>
            <Form method="POST" action={`/dashboard/income/${invoice.id}?index`} key={invoice.id} encType="multipart/form-data">
                <Input name="title" type="text" label="Title:" defaultValue={invoice.title} required />
                <Textarea name="description" label="Description:" defaultValue={invoice.description || ''} />
                <Input name="amount" type="number" label="Amount (in USD):" defaultValue={invoice.amount} required />
                {(isUploadingAttachment || invoice.attachment)
                    ?   <Attachment label="Your attachment" attachmentUrl={`${invoice.attachment}`} disabled={isUploadingAttachment} />
                    :   <Input name="attachment" type="file" label="New attachment" />
                }
                <Button type="submit" name="intent" value="update" isPrimary>Save</Button>
                <p aria-live="polite" className="text-green-600">
                    {actionData?.success && 'Changes saved!'}
                </p>
            </Form>
            
            <FloatingActionLink to="/dashboard/income">Add invoice</FloatingActionLink>
        </>
    )
}