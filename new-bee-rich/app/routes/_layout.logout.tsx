import {ActionFunctionArgs, redirect} from "@remix-run/node";
import {logout} from "~/modules/session/session.server";

export function action({request}: ActionFunctionArgs) {
    return logout(request);
}

export function loader() {
    return redirect('/login');
}