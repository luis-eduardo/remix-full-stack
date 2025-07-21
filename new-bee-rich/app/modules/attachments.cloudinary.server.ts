import {
    unstable_composeUploadHandlers,
    unstable_createMemoryUploadHandler,
    UploadHandler,
    writeAsyncIterableToWritable
} from "@remix-run/node";
import {UploadApiResponse, v2 as cloudinary} from 'cloudinary';
import path from "node:path";
import process from "node:process";
import {open} from "node:fs/promises";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

async function uploadImage(data: AsyncIterable<Uint8Array>) {
    const uploadPromise = new Promise(async (resolve, reject) => {
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
        await writeAsyncIterableToWritable(data, uploadStream);
    });

    return uploadPromise;
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
    const result = publicIdWithExtensionName.replace(extensionName, "");
    return result;
};

const getFileName = (imageURL: string) => {
    const regex = /\/upload\/v\d+\/*\//; // Matches '/v' followed by digits and a '/'
    const [, fileName] = imageURL.split(regex);

    return fileName;
};

export async function deleteAttachment(imgUrl: string) {
    try {
        await cloudinary.uploader
            .destroy(getPublicId(imgUrl), { invalidate: true })
            .then(result => console.log("Deleted:", result));
    } catch (error) {
        console.error(error);
    }
}

export async function buildFileResponse(imgUrl: string) {
    try {

        const resp = cloudinary.image(getPublicId(imgUrl), {transformation: [
                {gravity: "face", height: 150, width: 150, crop: "thumb"},
                {radius: 20},
                {effect: "sepia"},
                {overlay: "cloudinary_icon"},
                {effect: "brightness:90"},
                {opacity: 60},
                {width: 50, crop: "scale"},
                {flags: "layer_apply", gravity: "south_east", x: 5, y: 5},
                {angle: 10},
                {quality: "auto"}
            ]})

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