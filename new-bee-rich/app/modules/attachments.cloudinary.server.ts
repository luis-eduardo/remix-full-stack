import {writeAsyncIterableToWritable, writeReadableStreamToWritable} from "@react-router/node";
import {UploadApiResponse, v2 as cloudinary} from 'cloudinary';
import path from "node:path";
import process from "node:process";
import {FileUpload} from "@mjackson/form-data-parser";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

async function uploadImage(data: File) {
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
        writeReadableStreamToWritable(data.stream(), uploadStream);
    });
}

export const attachmentsUploadHandler = async (args: FileUpload) => {
    if (args.fieldName !== 'attachment' || !args.name) {
        return null;
    }

    const file = await uploadImage(args) as UploadApiResponse;
    if (!file) {
        return null;
    }

    return file.secure_url;
}

export const getPublicId = (imageURL: string) => {
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

export async function buildFileResponse(imgUrl: string, headers = new Headers()) {
    try {
        // Fetch the file from Cloudinary using the URL
        const response = await fetch(imgUrl);

        if (!response.ok) {
            return new Response('Not Found', { status: 404 });
        }
        
        headers.append('Content-Type', 'application/octet-stream');
        headers.append('Content-Disposition', `attachment;filename="${getFileName(imgUrl)}"`);
        
        // Get a readable stream from the fetched response
        const stream = response.body as ReadableStream;

        return new Response(stream, { headers });
    } catch (e) {
        console.log(e);
        return new Response('Not Found', { status: 404 });
    }
}