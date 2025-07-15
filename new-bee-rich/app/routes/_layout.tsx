import {Outlet} from "@remix-run/react";

export default function Component() {
    return (
        <>
            <header className="mb-4 lg:mb-10">
                <nav className="p-4">
                    <ul className="w-full flex flex-row gap-5 text-lg lg:text-2xl font-bold">
                        <li>
                            <a href="/">Home</a>
                        </li>
                        <li className="ml-auto">
                            <a href="/login">Log in</a>
                        </li>
                        <li>
                            <a href="/signup">Sign up</a>
                        </li>
                    </ul>
                </nav>
            </header>
            <main className="p-4 w-full flex justify-center items-center">
                <Outlet />
            </main>
        </>
    )
}