import { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import {
    Await,
    isRouteErrorResponse,
    useActionData,
    useLoaderData,
    useNavigation,
    useParams,
    useRouteError,
} from "react-router";
import {H2, H3} from "~/components/headings";
import {FloatingActionLink} from "~/components/links";
import {Attachment, Form, Input, Textarea} from "~/components/forms";
import {Button} from "~/components/buttons";
import {requireUserId} from "~/modules/session/session.server";
import {getPublicId} from "~/modules/attachments.cloudinary.server";
import {getExpense} from "~/modules/expenses.server";
import {actionFunction} from "~/modules/actions/dashboard.expenses.$id._index.server";
import { db } from "~/modules/db.server";
import ExpenseLogs from "~/components/ExpenseLogs";
import {Suspense} from "react";

export async function action(args: ActionFunctionArgs) {
    return actionFunction(args);
}

export async function loader({ request, params }: LoaderFunctionArgs) {
    const userId = await requireUserId(request);
    
    const { id } = params;    
    if (!id) throw new Error("id route parameter must be defined");
    
    const expenseLogs = db.expenseLog.findMany({
        where: { expenseId: id, userId },
        orderBy: { createdAt: 'desc' }
    }).then((expense) => expense);
    
    const expense = await getExpense(id, userId);
    if (!expense) {
        throw new Response('Not Found', { status: 404 });
    }    
    const attachmentPublicId = expense.attachment && getPublicId(expense.attachment);
    return { expense, expenseLogs, attachmentPublicId };
}

export default function Component() {
    const { expense, expenseLogs, attachmentPublicId } = useLoaderData<typeof loader>();
    const actionData = useActionData<typeof action>();
    const navigation = useNavigation();
    const attachment = navigation.formData?.get('attachment');
    const isUploadingAttachment = attachment instanceof File && attachment.name !== '';
    const isRemovingAttachment = navigation.formData?.get('intent') === 'remove-attachment';
    const attachmentUrl = attachmentPublicId
        ? `/dashboard/expenses/${expense.id}/attachments/${attachmentPublicId}`
        : '';
    
    return (
        <>
            <Form method="POST" action={`/dashboard/expenses/${expense.id}?index`} key={expense.id} encType="multipart/form-data">
                <Input name="title" type="text" label="Title:" defaultValue={expense.title} required />
                <Textarea name="description" label="Description:" defaultValue={expense.description || ''} />
                <Input name="amount" type="number" label="Amount (in USD):" defaultValue={expense.amount} required />
                {(isUploadingAttachment || expense.attachment) && !isRemovingAttachment
                    ?   <Attachment label="Current attachment" attachmentUrl={attachmentUrl} disabled={isUploadingAttachment} />
                    :   <Input name="attachment" type="file" label="New attachment" disabled={isRemovingAttachment} />
                }

                <Button type="submit" name="intent" value="update" isPrimary>Save</Button>
                <p aria-live="polite" className="text-green-600">
                    {actionData?.success && 'Changes saved!'}
                </p>
            </Form>
            
            <section className="my-5 w-full m-auto lg:max-w-3xl flex flex-col items-center justify-center gap-5">
                <H3>Expense History</H3>
                <Suspense fallback="Loading expense history..." key={expense.id}>
                    <Await resolve={expenseLogs} errorElement="There was an error loading the expense history. Please, try again.">
                    {(resolvedExpenseLogs) =>
                        <ExpenseLogs expenseLogs={resolvedExpenseLogs} />
                    }
                    </Await>
                </Suspense>
            </section>
            
            <FloatingActionLink to="/dashboard/expenses/">Add expense</FloatingActionLink>
        </>
    );
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