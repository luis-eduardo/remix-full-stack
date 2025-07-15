import {Container} from "~/components/containers";
import {Outlet} from "@remix-run/react";

export default function Component() {
    return (
        <>
            <header>
                <Container className="p-4 mb-10">
                    <nav>
                        <ul className="w-full flex flex-row gap-5 font-bold text-lg lg:text-2xl">
                            <li>
                                <a href="/">BeeRich</a>
                            </li>
                            <li className="ml-auto">
                                <a href="/404">Log out</a>
                            </li>
                        </ul>
                        <ul className="w-full flex flex-row gap-5 mt-10 clear-both">
                            <li className="ml-auto">
                                <a href="/dashboard/income">Income</a>
                            </li>
                            <li className="mr-auto">
                                <a href="/dashboard/expenses">Expenses</a>
                            </li>
                        </ul>
                    </nav>
                </Container>
            </header>
            <main className="p-4 w-full flex justify-center items-center">
                <Outlet />
            </main>
        </>
    );
}