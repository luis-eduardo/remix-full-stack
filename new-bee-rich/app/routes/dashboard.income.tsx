import {H1, H2} from "~/components/headings";
import {Outlet, useNavigation} from "@remix-run/react";
import {ListLinkItem} from "~/components/links";
import clsx from "clsx";

export default function Component() {
    const navigation = useNavigation();
    return (
        <div className="w-full">
            <H1>Your incomes</H1>
            <div className="mt-10 w-full flex flex-col-reverse lg:flex-row">
                <section className="lg:p-8 w-full lg:max-w-2xl">
                    <H2 className="sr-only">All incomes</H2>
                    <ul className="flex flex-col">
                        <ListLinkItem to="/dashboard/income/1">
                            <p className="text-xl font-semibold">Google</p>
                            <p>$100</p>
                        </ListLinkItem>
                        <ListLinkItem to="/dashboard/income/2">
                            <p className="text-xl font-semibold">Uber Eats</p>
                            <p>$100</p>
                        </ListLinkItem>
                        <ListLinkItem to="/dashboard/income/3">
                            <p className="text-xl font-semibold">Spark Driver</p>
                            <p>$100</p>
                        </ListLinkItem>
                    </ul>
                </section>
                <section
                    className={clsx('lg:p-8 w-full', navigation.state === 'loading' && 'motion-safe:animate-pulse')}>
                    <div className="w-full h-full p-8">
                        <Outlet/>
                    </div>
                </section>
            </div>
        </div>
);
}