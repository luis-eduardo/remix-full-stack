import type { LoaderFunctionArgs } from 'react-router';
import { redirect } from 'react-router';

import { buildFileResponse, getPublicId } from '~/modules/attachments.cloudinary.server';
import { db } from '~/modules/db.server';
import { requireUserId } from '~/modules/session/session.server';

export async function loader({ request, params }: LoaderFunctionArgs) {
    const userId = await requireUserId(request);
    const { id } = params;
    const slug = params['*'];
    if (!id || !slug) {
        throw Error('id and slug route parameters must be defined');
    }

    const expense = await db.expense.findUnique({ where: { id_userId: { id, userId } } });
    if (!expense || !expense.attachment) {
        throw new Response('Not found', { status: 404 });
    }
    const publicId = getPublicId(expense.attachment);
    if (slug !== publicId) {
        return redirect(`/dashboard/expenses/${id}/attachments/${publicId}`);
    }
    
    const headers = new Headers();
    headers.set('ETag', publicId);
    if (request.headers.get('If-None-Match') === publicId) {
        return new Response(null, { status: 304, headers });
    }
    return buildFileResponse(expense.attachment, headers);
}