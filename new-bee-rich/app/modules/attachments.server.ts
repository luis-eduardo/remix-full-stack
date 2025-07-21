import {
    unstable_composeUploadHandlers,
    unstable_createFileUploadHandler,
    unstable_createMemoryUploadHandler,
    UploadHandler,
} from "@remix-run/node";
import path from "node:path";
import {unlink, open} from "node:fs/promises";
import process from "node:process";



const standardFileUploadHandler = unstable_createFileUploadHandler({
    directory: './attachments',
    avoidFileConflicts: true,
});

const attachmentsUploadHandler: UploadHandler = async(args) => {
    if (args.name !== 'attachment' || !args.filename) {
        return null;
    }

    const file = await standardFileUploadHandler(args);
    if (!file) {
        return null;
    }

    if (typeof file === 'string') {
        return file;
    }

    return file.name;
}

export const uploadHandler = unstable_composeUploadHandlers(
    attachmentsUploadHandler,
    unstable_createMemoryUploadHandler()
);

export async function deleteAttachment(fileName: string) {
    const localPath = path.join(process.cwd(), 'attachments', fileName);
    try {
        await unlink(localPath);
    } catch (error) {
        console.error(error);
    }
}

export async function buildFileResponse(fileName: string) {
    const localPath = path.join(process.cwd(), 'attachments', fileName);
    try {
        const file = await open(localPath);
        const stream = file.readableWebStream() as ReadableStream;

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Content-Disposition': `attachment;filename="${fileName}"`,
            }
        })
    } catch (e) {
        console.log(e);
        return new Response('Not Found', { status: 404 });
    }
}