import {ActionFunctionArgs, redirect, unstable_parseMultipartFormData} from "@remix-run/node";
import {requireUserId} from "~/modules/session/session.server";
import {uploadHandler} from "~/modules/attachments.cloudinary.server";
import {deleteInvoice, parseInvoice, removeAttachmentFromInvoice, updateInvoice} from "~/modules/invoices.server";

async function handleUpdate(formData: FormData, id: string, userId: string) {
    const expenseData = parseInvoice(formData);
    await updateInvoice({ id, userId, ...expenseData });
    emitter.emit(userId);
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

    emitter.emit(userId);
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
    emitter.emit(userId);
    return { success: true };
}

export async function actionFunction({ params, request } : ActionFunctionArgs) {
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