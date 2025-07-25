import {H1} from "~/components/headings";
import {useUser} from "~/modules/session/session";

export default function Index() {
    const user = useUser();
    
    return (
        <>
            <H1>Welcome to BeeRich{user && `, ${user.name}`}!</H1>
            <span className="ml-5">(upgrading to React Router 7)</span>
        </>
    );
}