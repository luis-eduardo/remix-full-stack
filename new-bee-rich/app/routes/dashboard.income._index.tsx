import {ActionFunctionArgs, redirect} from "@remix-run/node";
import {Form, Input, Textarea} from "~/components/forms";
import {Button} from "~/components/buttons";
import {db} from "~/modules/db.server";
import {useNavigation} from "@remix-run/react";

export async function action({ request } : ActionFunctionArgs) {
    const formData = await request.formData();
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
    
    const invoice = await db.invoice.create({
        data: {
            title,
            description,
            amount: amountNumber,
            currencyCode: 'USD',
        }
    });
    return redirect(`/dashboard/income/${invoice.id}`);
}

export default function Component() {
    const navigation = useNavigation();
    const isSubmitting = navigation.state !== 'idle' && navigation.formAction === '/dashboard/income/?index';    
    return (
        <Form method="POST" action="/dashboard/income/?index">
            <Input name="title" type="text" label="Title:" placeholder="Salary" required />
            <Textarea name="description" label="Description:" />
            <Input name="amount" type="number" label="Amount (in USD):" defaultValue={0} required />
            <Button type="submit" isPrimary disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create'}
            </Button>
        </Form>
    );
}