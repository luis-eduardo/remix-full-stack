import zod from 'zod';
import {db} from "~/modules/db.server";
import {deleteAttachment} from "~/modules/attachments.cloudinary.server";
import {Prisma} from '@prisma/client';

export async function getUserExpenses(userId: string, searchString: string, pageNumber: number, pageSize: number) {
    const where: Prisma.ExpenseWhereInput = {
        title: { contains: searchString || '' },
        userId
    };

    return db.$transaction([
        db.expense.count({where}),
        db.expense.findMany({
            where,
            orderBy: {createdAt: 'desc'},
            take: pageSize,
            skip: (pageNumber - 1) * pageSize,
        }),
    ])
}

export async function getExpense(id: string, userId: string) {
    return db.expense
        .findUnique({
            where: {
                id_userId: { id, userId }
            }
        });
}

type ExpenseCreateData = {
    title: string;
    description: string;
    amount: number;
    userId: string;
    attachment?: string;
};

export async function createExpense({ title, description, amount, userId, attachment }: ExpenseCreateData) {
    return db.expense.create({
        data: {
            title,
            description,
            amount,
            currencyCode: 'USD',
            attachment,
            user: {
                connect: {
                    id: userId,
                }
            },
            logs: {
                create: {
                    title,
                    description,
                    amount,
                    currencyCode: 'USD',
                    user: { connect: { id: userId } },
                },
            },
        }
    });
}

export async function deleteExpense(id: string, userId: string) {
    const expense = await db.expense.delete({
        where: {
            id_userId: { id, userId }
        }
    });
    if (expense.attachment) {
        await deleteAttachment(expense.attachment);
    }
}

type ExpenseUpdateData = {
    id: string;
    userId: string;
    title: string;
    description: string;
    amount: number;
    attachment?: string;
}

export async function updateExpense({ id, title, description, amount, userId, attachment }: ExpenseUpdateData) {
    return db.expense.update({
        where: {
            id_userId: { id, userId }
        },
        data: {
            title,
            description,
            amount: amount,
            attachment,
            logs: {
                create: {
                    title,
                    description,
                    amount,
                    currencyCode: 'USD',
                    user: { connect: { id: userId } },
                },
            },
        }
    });
}

export async function removeAttachmentFromExpense(id: string, userId: string, attachmentUrl: string) {
    await deleteAttachment(attachmentUrl);
    return db.expense.update({
        where: { id_userId: { id, userId } },
        data: { attachment: null },
    });
}

const expenseSchema = zod.object({
    title: zod.string(),
    description: zod.string(),
    amount: zod.string(),
});

export function parseExpense(formData: FormData) {
    const data = Object.fromEntries(formData);
    const { title, description, amount } = expenseSchema.parse(data);
    const amountNumber = Number.parseInt(amount);
    if (Number.isNaN(amountNumber)) {
        throw Error('Invalid amount number');
    }
    let attachment: FormDataEntryValue | null | undefined = formData.get('attachment');
    if (!attachment || typeof attachment !== 'string') {
        attachment = undefined;
    }
    return { title, description, amount: amountNumber, attachment };
}