﻿import {ActionFunctionArgs, redirect} from "@remix-run/node";
import {db} from "~/modules/db.server";
import {Form, Input, Textarea} from "~/components/forms";
import {Button} from "~/components/buttons";
import {useNavigation} from "@remix-run/react";
import {requireUserId} from "~/modules/session/session.server";

export async function action({ request } : ActionFunctionArgs) {
    const userId = await requireUserId(request);
    
    const formData = await request.formData();
    const title = formData.get('title');
    const description = formData.get('description');
    const amount = formData.get('amount');
    
    if(typeof title !== 'string' || typeof description !== 'string' || typeof amount !== 'string') {
        throw Error('Something went wrong');
    }
    
    const amountNumber = Number.parseFloat(amount);
    
    if(Number.isNaN(amountNumber)) {
        throw Error('Number is invalid');
    }
    
    const expense = await db.expense.create({
        data: {
            title,
            description,
            amount: amountNumber,
            currencyCode: 'USD',
            user: {
                connect: { id: userId }
            },
        }
    });
    return redirect(`/dashboard/expenses/${expense.id}`);
}

export default function Component() {
    const navigation = useNavigation();
    const isSubmitting = navigation.state !== 'idle' && navigation.formAction === '/dashboard/expenses/?index';
    return (
        <Form method="POST" action="/dashboard/expenses/?index">
            <Input name="title" type="text" label="Title:" placeholder="Dinner for two" required />
            <Textarea name="description" label="Description:" />
            <Input name="amount" type="number" label="Amount (in USD):" defaultValue={0} required />
            <Button type="submit" isPrimary disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create'}
            </Button>
        </Form>
    );
}