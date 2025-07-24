import { ActionFunctionArgs, redirect } from "react-router";
import {Form, Input, Textarea} from "~/components/forms";
import {Button} from "~/components/buttons";
import { useNavigation } from "react-router";
import {requireUserId} from "~/modules/session/session.server";
import {attachmentsUploadHandler} from "~/modules/attachments.cloudinary.server";
import {createInvoice, parseInvoice} from "~/modules/invoices.server";
import {parseFormData} from "@mjackson/form-data-parser";

export async function action({ request } : ActionFunctionArgs) {
    const userId = await requireUserId(request);
    const formData = await parseFormData(request, attachmentsUploadHandler);
    const invoiceData = parseInvoice(formData);
    const invoice = await createInvoice({userId, ...invoiceData});
    emitter.emit(userId);
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