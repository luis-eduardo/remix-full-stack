const textContent =
`User-agent: *
Disallow: /dashboard/
Allow: /login
Allow: /signup
Allow: /$`;

export function loader() {
    return new Response(textContent, {
        headers: { 'content-type': 'text/plain' }
    });
}