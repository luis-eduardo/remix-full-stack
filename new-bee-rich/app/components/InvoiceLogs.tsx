import {InvoiceLog} from "@prisma/client";
import {formatCurrency, formatDateAndTime} from "~/locale/format";

export default function InvoiceLogs({ invoiceLogs } : { invoiceLogs: InvoiceLog[] }) {
    return (
        <ul className="space-y-2 max-h[300px] lg:max-h-max overflow-y-scroll lg:overflow-hidden py-5">
            {invoiceLogs.map((log: InvoiceLog) => (
                <li key={log.id}>
                    <p>
                        <b>
                            {`${log.title} - ${formatCurrency(log.currencyCode, log.amount)}`}
                        </b>
                    </p>
                    {log.description &&
                    <p>
                        <i>{log.description}</i>
                    </p>
                    }
                    <p className="text-sm text-gray-500">
                        {formatDateAndTime(log.createdAt)}
                    </p>
                </li>
            ))}
        </ul>
    )
}