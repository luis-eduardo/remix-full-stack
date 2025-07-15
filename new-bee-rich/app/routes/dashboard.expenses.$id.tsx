import {LoaderFunctionArgs} from "@remix-run/node";
import {useLoaderData} from "@remix-run/react";
import {H2} from "~/components/headings";

const data = [
    {
        id: 1,
        title: 'Food',
        amount: 100,
    },
    {
        id: 2,
        title: 'Transport',
        amount: 120,
    },
    {
        id: 3,
        title: 'Entertainment',
        amount: 150,
    }
];

export function loader({ params }: LoaderFunctionArgs) {
    const { id } = params;
    const expense = data.find((expense) => expense.id === Number(id));
    if (!expense) {
        throw new Response('Not Found', { status: 404 });
    }
    return expense;
}

export default function Component() {
    const expense = useLoaderData<typeof loader>();
    return (
        <div className="w-full h-full p-8">
            <H2>{expense.title}</H2>
            <p>${expense.amount}</p>
        </div>
    );
}