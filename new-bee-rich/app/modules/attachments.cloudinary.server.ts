import {
    unstable_composeUploadHandlers,
    unstable_createMemoryUploadHandler,
    UploadHandler,
    writeAsyncIterableToWritable
} from "@remix-run/node";
import {UploadApiResponse, v2 as cloudinary} from 'cloudinary';
import path from "node:path";
import process from "node:process";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

async function uploadImage(data: AsyncIterable<Uint8Array>) {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: "remix",
            },
            (error, result) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(result);
            },
        );
        writeAsyncIterableToWritable(data, uploadStream);
    });
}

const attachmentsUploadHandler: UploadHandler = async(args) => {
    if (args.name !== 'attachment' || !args.filename) {
        return null;
    }

    const file = await uploadImage(args.data) as UploadApiResponse;
    if (!file) {
        return null;
    }

    return file.secure_url;
}

export const uploadHandler = unstable_composeUploadHandlers(
    attachmentsUploadHandler,
    unstable_createMemoryUploadHandler()
);

const getPublicId = (imageURL: string) => {
    const regex = /\/upload\/v\d+\//; // Matches '/v' followed by digits and a '/'
    const [, publicIdWithExtensionName] = imageURL.split(regex);

    const extensionName = path.extname(publicIdWithExtensionName);
    return publicIdWithExtensionName.replace(extensionName, "");
};

const getFileName = (imageURL: string) => {
    const regex = /\/upload\/v\d+\/*\//; // Matches '/v' followed by digits and a '/'
    const [, fileName] = imageURL.split(regex);

    return fileName;
};

export async function deleteAttachment(attachmentUrl: string) {
    try {
        await cloudinary.uploader
            .destroy(getPublicId(attachmentUrl), { invalidate: true })
            .then(result => console.log("Deleted:", result));
    } catch (error) {
        console.error(error);
    }
}

export async function buildFileResponse(imgUrl: string) {
    try {
        // Fetch the file from Cloudinary using the URL
        const response = await fetch(imgUrl);

        if (!response.ok) {
            return new Response('Not Found', { status: 404 });
        }

        // Get a readable stream from the fetched response
        const stream = response.body as ReadableStream;

        return new Response(stream, {
            headers: {
                'Content-Type': 'application/octet-stream', // Adjust content type based on your file type
                'Content-Disposition': `attachment;filename="${getFileName(imgUrl)}"`,
            }
        });
    } catch (e) {
        console.log(e);
        return new Response('Not Found', { status: 404 });
    }
}