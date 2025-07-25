import { ActionFunctionArgs, redirect } from "react-router";
import {requireUserId} from "~/modules/session/session.server";
import {attachmentsUploadHandler} from "~/modules/attachments.cloudinary.server";
import {
    deleteExpense,
    parseExpense,
    removeAttachmentFromExpense,
    updateExpense
} from "~/modules/expenses.server";
import {parseFormData} from "@mjackson/form-data-parser";

async function handleUpdate(formData: FormData, id: string, userId: string) {
    const expenseData = parseExpense(formData);
    await updateExpense({ id, userId, ...expenseData });
    emitter.emit(userId);
    return { success: true };
}

async function handleDelete(request: Request, id: string, userId: string) {
    const referer = request.headers.get('referer');
    const redirectPath = referer || '/dashboard/expenses';
    
    try {
        await deleteExpense(id, userId);
    } catch (e) {
        return { success: false };
    }
    
    emitter.emit(userId);
    if (redirectPath.includes(id)) {
        return redirect('/dashboard/expenses');
    }
    return redirect(redirectPath);
}

async function handleRemoveAttachment(formData: FormData, id: string, userId: string) {
    const attachmentUrl = formData.get('attachmentUrl');
    if (!attachmentUrl || typeof attachmentUrl !== 'string') {
        throw Error('Something went wrong');
    }
    await removeAttachmentFromExpense(id, userId, attachmentUrl);
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
        formData = await parseFormData(request, attachmentsUploadHandler);
    } else {
        formData = await request.formData();
    }

    const intent = formData.get("intent");
    
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