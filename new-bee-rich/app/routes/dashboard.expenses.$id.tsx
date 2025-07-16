import {LoaderFunctionArgs} from "@remix-run/node";
import {useLoaderData} from "@remix-run/react";
import {H2} from "~/components/headings";
import {db} from "~/modules/db.server";

export async function loader({ params }: LoaderFunctionArgs) {
    const { id } = params;
    const expense = await db.expense.findUnique({ where: { id } });
    if (!expense) {
        throw new Response('Not Found', { status: 404 });
    }
    return expense;
}

export default function Component() {
    const expense = useLoaderData<typeof loader>();
    return (
        <>
            <H2>{expense.title}</H2>
            <p>${expense.amount}</p>
        </>
    );
}