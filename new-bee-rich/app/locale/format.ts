const locale = 'en-us';

export function formatCurrency(currencyCode: string | undefined, amount: any): string {
    return Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currencyCode
        })
        .format(amount);
}

export function formatDate(date: Date): string {
    return date.toLocaleDateString(locale);
}