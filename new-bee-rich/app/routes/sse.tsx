import {LoaderFunctionArgs} from "@remix-run/node";
import {requireUserId} from "~/modules/session/session.server";
import {eventStream, OnSetup} from "~/modules/server-sent-events/events.server";

export async function loader({ request }: LoaderFunctionArgs) {
    const userId = await requireUserId(request);
    const onSetup: OnSetup = (send) => {
        function handler() {
            send('server-change', `Data change for ${userId}`);
        }
        emitter.addListener(userId, handler);
        return () => {
            emitter.removeListener(userId, handler);
        };
    };
    return eventStream(request, onSetup);
}