﻿import bcrypt from "bcryptjs";
import {db} from "~/modules/db.server";
import {User} from "@prisma/client";
import { createCookieSessionStorage, redirect } from "react-router";
import {setVisitorCookieData} from "~/modules/visitors.server";

type UserRegistrationData = {
    name: string;
    email: string;
    password: string;
}

export async function registerUser({ name, email, password }: UserRegistrationData): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedName = name.trim();
    
    const existingUser = await db.user.findUnique({
        where: { email: sanitizedEmail } 
    });
    
    if (existingUser) {
        throw new Error(`User already exists with email: ${sanitizedEmail}`);
    }
    
    try {
        return db.user.create({
            data: {
                name: sanitizedName,
                email: sanitizedEmail,
                password: hashedPassword,
            }
        });
    } catch (error) {
        console.error(error);
        throw new Error('Unable to create user.');
    }
}

type UserLoginData = {
    email: string;
    password: string;
}

export async function loginUser({ email, password }: UserLoginData): Promise<User> {
    const sanitizedEmail = email.trim().toLowerCase();
    
    const user = await db.user.findUnique({
        where: { email: sanitizedEmail }
    });
    
    if (!user) {
        throw new Error(`No user found for email: ${email}`);
    }
    
    const passwordValid = await bcrypt.compare(password, user.password);
    
    if (!passwordValid) {
        throw new Error('Invalid password.');
    }
    
    return user;
}

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
    throw new Error('SESSION_SECRET must be set');
}
const { getSession, commitSession, destroySession } = createCookieSessionStorage({
    cookie: {
        name: 'bee-rich-session',
        secure: process.env.NODE_ENV === 'production',
        secrets: [sessionSecret],
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
        httpOnly: true,
    }
});

export async function createUserSession(user: User, headers = new Headers()) {
    const session = await getSession();
    session.set('userId', user.id);
    headers.set('Set-Cookie', await commitSession(session));
    return headers;
}

export async function getUserSession(request: Request) {
    return getSession(request.headers.get('Cookie'));
}

export async function logout(request: Request) {
    const session = await getUserSession(request);
    return redirect('/login', {
        headers: {
            'Set-Cookie': await destroySession(session)
        }
    })
}

export async function getUserId(request: Request) {
    const session = await getUserSession(request);
    const userId = session.get('userId');
    
    if (!userId || typeof userId !== 'string') {
        return null;
    }
    
    return userId;
}

export async function requireUserId(request: Request) {
    const session = await getUserSession(request);
    const userId = session.get('userId');
    
    if (!userId || typeof userId !== 'string') {
        const headers = await setVisitorCookieData({redirectUrl: request.url});
        throw redirect('/login', { headers });
    }
    return userId;
}

export async function getUser(request: Request) {
    const userId = await getUserId(request);
    
    if (!userId) {
        return null;
    }
    
    try {
        return db.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
                updatedAt: true,
            }
        })
    } catch {
        return logout(request);
    }
}

export async function requireUser(request: Request) {
    const user = await getUser(request);
    if (!user) {
        return logout(request);
    }
    return user;
}