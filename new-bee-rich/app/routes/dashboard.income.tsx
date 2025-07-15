import {H1, H2} from "~/components/headings";
import {Outlet} from "@remix-run/react";

export default function Component() {
    return (
        <div className="w-full">
            <H1>Your incomes</H1>
            <div className="mt-10 w-full flex flex-col-reverse lg:flex-row">
                <section className="lg:p-8 w-full lg:max-w-2xl">
                    <H2 className="sr-only">All incomes</H2>
                    <ul className="flex flex-col">
                        <li>
                            <a href="/dashboard/income/1">
                                <p className="text-xl font-semibold">Google</p>
                                <p>$100</p>
                            </a>
                        </li>
                        <li>
                            <a href="/dashboard/income/2">
                                <p className="text-xl font-semibold">Uber Eats</p>
                                <p>$100</p>
                            </a>
                        </li>
                        <li>
                            <a href="/dashboard/income/3">
                                <p className="text-xl font-semibold">Spark Driver</p>
                                <p>$100</p>
                            </a>
                        </li>
                    </ul>
                </section>
                <Outlet />
            </div>
        </div>
    );
}