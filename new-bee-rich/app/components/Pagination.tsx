import { Form } from "react-router";
import {Button} from "~/components/buttons";
import type {FormHTMLAttributes} from "react";
import {clsx} from "clsx";

type PaginationProps = FormHTMLAttributes<HTMLFormElement> & {
    count: numer;
    query?: string;
    page: number;
    pageSize: number;
};

export default function Pagination({action, count, query = '', page, pageSize, className, ...props }: PaginationProps) {
    const isOnFirstPage = page === 1;
    const showPagination = count > pageSize || !isOnFirstPage;
    const hasNextPage = count > page * pageSize;
    
    return (
        <>
        {showPagination && (
            <Form 
                method="GET"
                action={action}
                className={clsx('flex justify-between pb-10', className,)}
                {...props}
            >
                <input type="hidden" name="q" value={query} />
                <Button type="submit" name="page" value={page - 1} disabled={isOnFirstPage}>
                    Previous
                </Button>
                <Button type="submit" name="page" value={page + 1} disabled={!hasNextPage}>
                    Next
                </Button>
            </Form> 
        )}
        </>
    )
}