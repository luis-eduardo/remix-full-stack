import {LoaderFunctionArgs} from "@remix-run/node";
import {useLoaderData} from "@remix-run/react";
import {H2} from "~/components/headings";
import {db} from "~/modules/db.server";

export async function loader({ params } : LoaderFunctionArgs) {
    const { id } = params;
    const income = await db.invoice.findUnique({ where: { id }});
    if (!income) {
        throw new Response('Not Found', { status: 404 });
    }
    return income;
}

export default function Component() {
    const income = useLoaderData<typeof loader>();
    return (
        <>
            <H2>{income.title}</H2>
            <p>${income.amount}</p>
        </>
    )
}