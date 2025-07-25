﻿import bcrypt from 'bcryptjs';
import type {Expense, Invoice, User} from '@prisma/client';
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

const expenses = [
    {
        title: 'Groceries',
        amount: 50,
        currencyCode: 'USD',
        date: '2022-12-05',
    },
    {
        title: 'Gym Membership',
        amount: 20,
        currencyCode: 'USD',
        date: '2022-12-03',
    },
    {
        title: 'Movies',
        amount: 20,
        currencyCode: 'USD',
        date: '2022-12-02',
    },
    {
        title: 'Mobile Service',
        amount: 55,
        currencyCode: 'USD',
        date: '2022-11-01',
    },
    {
        title: 'Rent December',
        amount: 1000,
        currencyCode: 'USD',
        date: '2022-12-01',
    },
    {
        title: 'Groceries',
        amount: 55,
        currencyCode: 'USD',
        date: '2022-12-01',
    },
    {
        title: 'Takeout',
        amount: 55,
        currencyCode: 'USD',
        date: '2022-11-30',
    },
    {
        title: 'Gym Membership',
        amount: 20,
        currencyCode: 'USD',
        date: '2022-11-03',
    },
    {
        title: 'Groceries',
        amount: 15,
        currencyCode: 'USD',
        date: '2022-11-02',
    },
    {
        title: 'Mobile Service',
        amount: 55,
        currencyCode: 'USD',
        date: '2022-11-01',
    },
    {
        title: 'Rent November',
        amount: 1000,
        currencyCode: 'USD',
        date: '2022-11-01',
    },
    {
        title: 'Groceries',
        amount: 55,
        currencyCode: 'USD',
        date: '2022-10-30',
    },
    {
        title: 'Groceries',
        amount: 55,
        currencyCode: 'USD',
        date: '2022-10-15',
    },
    {
        title: 'Dinner',
        amount: 40,
        currencyCode: 'USD',
        date: '2022-10-11',
    },
    {
        title: 'Gym Membership',
        amount: 20,
        currencyCode: 'USD',
        date: '2022-10-03',
    },
    {
        title: 'Groceries',
        amount: 25,
        currencyCode: 'USD',
        date: '2022-10-02',
    },
    {
        title: 'Mobile Service',
        amount: 55,
        currencyCode: 'USD',
        date: '2022-10-01',
    },
    {
        title: 'Rent October',
        amount: 1000,
        currencyCode: 'USD',
        date: '2022-10-01',
    },
    {
        title: 'Groceries',
        amount: 55,
        currencyCode: 'USD',
        date: '2022-10-01',
    },
];

const income = [
    {
        title: 'Salary December',
        amount: 2500,
        currencyCode: 'USD',
        date: '2022-12-30',
    },
    {
        title: 'Salary November',
        amount: 2500,
        currencyCode: 'USD',
        date: '2022-11-30',
    },
    {
        title: 'Salary October',
        amount: 2500,
        currencyCode: 'USD',
        date: '2022-10-30',
    },
    {
        title: 'Salary September',
        amount: 2500,
        currencyCode: 'USD',
        date: '2022-09-30',
    },
];

function createExpense(expenseData: (typeof expenses)[number], user: User) {
    return db.expense.create({
        data: {
            title: expenseData.title,
            amount: expenseData.amount,
            currencyCode: expenseData.currencyCode,
            createdAt: new Date(expenseData.date),
            userId: user.id,
        },
    });
}

function createInvoice(incomeData: (typeof income)[number], user: User) {
    return db.invoice.create({
        data: {
            title: incomeData.title,
            amount: incomeData.amount,
            currencyCode: incomeData.currencyCode,
            createdAt: new Date(incomeData.date),
            userId: user.id,
        },
    });
}

function createExpenseLog({ userId, id, title, description, currencyCode, amount }: Expense) {
    return db.expenseLog.create({
        data: {
            title,
            description,
            currencyCode,
            amount,
            userId,
            expenseId: id,
        },
    });
}

function createInvoiceLog({ userId, id, title, description, currencyCode, amount }: Invoice) {
    return db.invoiceLog.create({
        data: {
            title,
            description,
            currencyCode,
            amount,
            userId,
            invoiceId: id,
        },
    });
}

console.log('🌱 Seeding the database...');
const start = performance.now();
const user = await db.user.create({
    data: {
        name: 'Ichiro Suzuki',
        email: 'isuzuki@nomail.com',
        password: await bcrypt.hash('BeeRich', 10)
    }
});
const expensePromises = Promise.all(expenses.map((expense) => createExpense(expense, user)));
const invoicePromises = Promise.all(income.map((income) => createInvoice(income, user)));
const [createdExpenses, createdInvoices] = await Promise.all([expensePromises, invoicePromises]);
const expenseLogPromises = createdExpenses.map((expense) => createExpenseLog(expense));
const invoiceLogPromises = createdInvoices.map((invoice) => createInvoiceLog(invoice));
await Promise.all([...expenseLogPromises, ...invoiceLogPromises]);
const end = performance.now();
console.log(`🚀 Seeded the database. Done in ${Math.round(end - start)}ms`);
