import {H1, H3} from "~/components/headings";
import {useActionData, useNavigation} from "@remix-run/react";
import {Card} from "~/components/containers";
import {Form, Input} from "~/components/forms";
import {Button} from "~/components/buttons";
import {InlineError} from "~/components/texts";
import {ActionFunctionArgs, LinksFunction, LoaderFunctionArgs, MetaFunction, redirect} from "@remix-run/node";
import {createUserSession, getUserId, loginUser} from "~/modules/session/session.server";
import loginCSS from "~/styles/login.css?url";

export const meta: MetaFunction = () => {
    return [
        { title: 'Log In | BeeRich'},
        {
            name: 'description',
            content: 'Log into your BeeRich account to track your expenses and income.'
        }
    ];
}

export const links: LinksFunction = () => {
    return [{ rel: 'stylesheet', href: loginCSS }];
}

export async function action({ request }: ActionFunctionArgs) {
    const formData = await request.formData();
    const { email, password } = Object.fromEntries(formData);

    if (!email || !password) {
        return { error: 'Please fill out all fields.'};
    }

    if (typeof email !== 'string' || typeof password !== 'string') {
        throw new Error('Invalid form data');
    }
    
    try {
        const user = await loginUser({email, password});
        return redirect('/dashboard', {
            headers: await createUserSession(user)
        });
    } catch (error: any) {
        return {
            error: error?.message || 'Something went wrong.'
        }
    }
}

export async function loader({ request }: LoaderFunctionArgs) {
    const userId = await getUserId(request);
    if (userId) {
        return redirect('/dashboard');
    }
    return {};
}

export default function LoginPage() {
    const actionData = useActionData<typeof action>();
    const navigation = useNavigation();
    const isSubmitting = navigation.state !== 'idle' && navigation.formAction === '/login';
    return (
        <Card>
            <H3>Sign in</H3>
            <Form method="POST" action="/login">
                <Input name="email" type="email" label="Your email" placeholder="name@email.com" required />
                <Input name="password" type="password" label="Your password" placeholder="••••••••" required />
                <Button type="submit" isPrimary className="mt-4" disabled={isSubmitting}>
                    {isSubmitting ? 'Signing you in...' : 'Sign in'}
                </Button>
                <InlineError aria-live="polite">
                    {actionData?.error && actionData.error}
                </InlineError>
            </Form>
        </Card>
    )
}