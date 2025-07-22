import {ActionFunctionArgs, LoaderFunctionArgs} from "@remix-run/node";
import {
    Await,
    isRouteErrorResponse,
    useActionData,
    useLoaderData,
    useNavigation,
    useParams,
    useRouteError
} from "@remix-run/react";
import {H2, H3} from "~/components/headings";
import {FloatingActionLink} from "~/components/links";
import {Attachment, Form, Input, Textarea} from "~/components/forms";
import {Button} from "~/components/buttons";
import {requireUserId} from "~/modules/session/session.server";
import {getPublicId} from "~/modules/attachments.cloudinary.server";
import { getInvoice } from "~/modules/invoices.server";
import {actionFunction} from "~/modules/actions/dashboard.income.$id._index.server";
import {db} from "~/modules/db.server";
import {Suspense} from "react";
import ExpenseLogs from "~/components/ExpenseLogs";
import InvoiceLogs from "~/components/InvoiceLogs";

export async function action(args: ActionFunctionArgs) {
    return actionFunction(args);
}
export async function loader({ request, params } : LoaderFunctionArgs) {
    const userId = await requireUserId(request);
    
    const { id } = params;    
    if (!id) throw new Error("id route parameter must be defined.")
    
    const invoiceLogs = db.invoiceLog.findMany({
        where: { invoiceId: id, userId },
        orderBy: { createdAt: 'desc' },
    }).then((invoice) => invoice);
    
    const invoice = await getInvoice(id, userId);
    if (!invoice) {
        throw new Response('Not Found', { status: 404 });
    }
    const attachmentPublicId = invoice.attachment && getPublicId(invoice.attachment);
    return { invoice, invoiceLogs, attachmentPublicId };
}

export default function Component() {
    const { invoice, invoiceLogs, attachmentPublicId } = useLoaderData<typeof loader>();
    const actionData = useActionData<typeof action>();
    const navigation = useNavigation();
    const attachment = navigation.formData?.get('attachment');
    const isUploadingAttachment = attachment instanceof File && attachment.name !== '';
    const isRemovingAttachment = navigation.formData?.get('intent') === 'remove-attachment';
    const attachmentUrl = attachmentPublicId
        ? `/dashboard/income/${invoice.id}/attachments/${attachmentPublicId}`
        : '';
    
    return (
        <>
            <Form method="POST" action={`/dashboard/income/${invoice.id}?index`} key={invoice.id} encType="multipart/form-data">
                <Input name="title" type="text" label="Title:" defaultValue={invoice.title} required />
                <Textarea name="description" label="Description:" defaultValue={invoice.description || ''} />
                <Input name="amount" type="number" label="Amount (in USD):" defaultValue={invoice.amount} required />
                {(isUploadingAttachment || invoice.attachment) && !isRemovingAttachment
                    ?   <Attachment label="Your attachment" attachmentUrl={attachmentUrl} disabled={isUploadingAttachment} />
                    :   <Input name="attachment" type="file" label="New attachment" disabled={isRemovingAttachment} />
                }
                <Button type="submit" name="intent" value="update" isPrimary>Save</Button>
                <p aria-live="polite" className="text-green-600">
                    {actionData?.success && 'Changes saved!'}
                </p>
            </Form>

            <section className="my-5 w-full m-auto lg:max-w-3xl flex flex-col items-center justify-center gap-5">
                <H3>Invoice History</H3>
                <Suspense fallback="Loading invoice history" key={invoice.id}>
                    <Await resolve={invoiceLogs} errorElement="There was an error loading the invoice history. Please, try again.">
                        {(resolvedInvoiceLogs) =>
                            <InvoiceLogs invoiceLogs={resolvedInvoiceLogs} />
                        }
                    </Await>
                </Suspense>
            </section>
            
            <FloatingActionLink to="/dashboard/income">Add invoice</FloatingActionLink>
        </>
    )
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