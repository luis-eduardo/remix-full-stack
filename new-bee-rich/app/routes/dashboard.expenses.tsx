import {H1, H2} from "~/components/headings";
import {Outlet, useNavigation} from "@remix-run/react";
import {ListLinkItem} from "~/components/links";
import clsx from "clsx";

export default function Component() {
    const navigation = useNavigation();
    console.log(navigation.state);
    return (
        <div className="w-full">
            <H1>Your expenses</H1>
            <div className="mt-10 w-full flex flex-col-reverse lg:flex-row">
                <section className="lg:p-8 w-full lg:max-w-2xl">
                    <H2 className="sr-only">All expenses</H2>
                    <ul className="flex flex-col">
                        <ListLinkItem to="/dashboard/expenses/1">
                            <p className="text-xl font-semibold">Food</p>
                            <p>$100</p>
                        </ListLinkItem>
                        <ListLinkItem to="/dashboard/expenses/2">
                            <p className="text-xl font-semibold">Transport</p>
                            <p>$100</p>
                        </ListLinkItem>
                        <ListLinkItem to="/dashboard/expenses/3">
                            <p className="text-xl font-semibold">Entertainment</p>
                            <p>$100</p>
                        </ListLinkItem>
                    </ul>
                </section>
                <section className={clsx('lg:p-8 w-full', navigation.state === 'loading' && 'motion-safe:animate-pulse')}>
                    <Outlet />    
                </section>
            </div>
        </div>
    )
}