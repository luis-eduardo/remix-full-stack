import {ActionFunctionArgs, redirect, unstable_parseMultipartFormData} from "@remix-run/node";
import {Form, Input, Textarea} from "~/components/forms";
import {Button} from "~/components/buttons";
import {db} from "~/modules/db.server";
import {useNavigation} from "@remix-run/react";
import {requireUserId} from "~/modules/session/session.server";
import {uploadHandler} from "~/modules/attachments.server";

export async function action({ request } : ActionFunctionArgs) {
    const userId = await requireUserId(request);
    
    const formData = await unstable_parseMultipartFormData(request, uploadHandler);
    const title = formData.get('title');
    const description = formData.get('description');
    const amount = formData.get('amount');
    
    if (typeof title !== 'string' || typeof description !== 'string' || typeof amount !== 'string') {
        throw Error('Something went wrong');
    }
    
    const amountNumber = Number.parseFloat(amount);
    
    if (Number.isNaN(amountNumber)) {
        throw Error('Number is invalid');
    }

    let attachment = formData.get('attachment');
    if (!attachment || typeof attachment !== 'string') {
        attachment = null;
    }
    
    const invoice = await db.invoice.create({
        data: {
            title,
            description,
            amount: amountNumber,
            currencyCode: 'USD',
            attachment,
            user: {
                connect: { id: userId }
            },
        }
    });
    return redirect(`/dashboard/income/${invoice.id}`);
}

export default function Component() {
    const navigation = useNavigation();
    const isSubmitting = navigation.state !== 'idle' && navigation.formAction === '/dashboard/income/?index';    
    return (
        <Form method="POST" action="/dashboard/income/?index" encType="multipart/form-data">
            <Input name="title" type="text" label="Title:" placeholder="Salary" required />
            <Textarea name="description" label="Description:" />
            <Input name="amount" type="number" label="Amount (in USD):" defaultValue={0} required />
            <Input name="attachment" type="file" label="Attachment" />
            <Button type="submit" isPrimary disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create'}
            </Button>
        </Form>
    );
}