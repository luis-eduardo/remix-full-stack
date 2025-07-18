import {H3} from "~/components/headings";
import {Card} from "~/components/containers";
import {Form, Input} from "~/components/forms";
import {Button} from "~/components/buttons";
import {ActionFunctionArgs, redirect} from "@remix-run/node";
import {createUserSession, registerUser} from "~/modules/session/session.server";
import {useActionData, useNavigation} from "@remix-run/react";
import {InlineError} from "~/components/texts";

export async function action({ request }: ActionFunctionArgs) {
    const formData = await request.formData();
    const {
        name,
        email,
        password,
        passwordConfirmation
        } = Object.fromEntries(formData);
    
    if (!name || !email || !password || !passwordConfirmation) {
        return { error: 'Please fill out all fields.'};
    }
    
    if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string' || typeof passwordConfirmation !== 'string') {
        throw new Error('Invalid form data');
    }
    
    if(password !== passwordConfirmation) {
        return { error: 'Please make sure passwords match.' };
    }
    
    try {
        const user = await registerUser({
            name,
            email,
            password
        });

        return redirect('/dashboard', {
            headers: await createUserSession(user) 
        });
    } catch (error: any) {
        return {
            error: error?.message || 'Something went wrong.'
        }
    }
}

export default function Component() {
    const actionData = useActionData<typeof action>();
    const navigation = useNavigation();
    const isSubmitting = navigation.state !== 'idle' && navigation.formAction === '/signup';
    return (
        <Card>
            <H3>Create an account</H3>
            <Form method="POST" action="/signup">
                <Input name="name" type="text" label="Full name" placeholder="John Doe" required />
                <Input name="email" type="email" label="Your email" placeholder="name@email.com" required />
                <Input name="password" type="password" label="Password" placeholder="••••••••" required />
                <Input name="passwordConfirmation" type="password" label="Confirm password" placeholder="••••••••" required />
                <Button type="submit" isPrimary className="mt-4" disabled={isSubmitting}>
                    {isSubmitting ? 'Signing you up...' : 'Create an account'}
                </Button>
                <InlineError aria-live="polite">
                    {actionData?.error && actionData.error}
                </InlineError>
            </Form>
        </Card>
    )
}