import {LoaderFunctionArgs} from "@remix-run/node";
import {useLoaderData} from "@remix-run/react";
import {H2} from "~/components/headings";

const data = [
    {
        id: 1,
        title: 'Google',
        amount: 100
    },
    {
        id: 2,
        title: 'Uber Eats',
        amount: 100
    },
    {
        id: 3,
        title: 'Spark Driver',
        amount: 100
    }
];

export function loader({ params } : LoaderFunctionArgs) {
    const { id } = params;
    const income = data.find(income => income.id === Number(id));
    if (!income) {
        throw new Response('Not Found', { status: 404 });
    }
    return income;
}

export default function Component() {
    const income = useLoaderData<typeof loader>();
    return (
        <div className="w-full h-full p-8">
            <H2>{income.title}</H2>
            <p>${income.amount}</p>
        </div>
    )
}