import type { LoaderFunctionArgs } from '@remix-run/node';
import { buildFileResponse, getPublicId } from '~/modules/attachments.cloudinary.server';
import { db } from '~/modules/db.server';
import { requireUserId } from '~/modules/session/session.server';
import {redirect} from "@remix-run/router";

export async function loader({ request, params }: LoaderFunctionArgs) {
    const userId = await requireUserId(request);
    const { id } = params;
    const slug = params['*'];
    if (!id || !slug) {
        throw Error('id and slug route parameters must be defined');
    }

    const invoice = await db.invoice.findUnique({ where: { id_userId: { id, userId } } });
    if (!invoice || !invoice.attachment) {
        throw new Response('Not found', { status: 404 });
    }
    const publicId = getPublicId(invoice.attachment);
    if (slug !== publicId) {
        return redirect(`/dashboard/income/${id}/attachments/${publicId}`);
    }
    
    const headers = new Headers();
    headers.set('ETag', publicId);
    if (request.headers.get('If-None-Match') === publicId) {
        return new Response(null, { status: 304, headers });
    }

    return buildFileResponse(invoice.attachment, headers);
}