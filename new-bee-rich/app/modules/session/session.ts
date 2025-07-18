import type {User} from '@prisma/client';

import {useRootLoaderData} from '~/root';

export type PublicUser = Omit<User, 'password'>;

// Type guard to ensure that the object has the correct shape
const isPublicUser = (user: any): user is PublicUser => {
    return typeof user.name === 'string' &&
        typeof user.id === 'string' &&
        typeof user.email === 'string' &&
        user.createdAt instanceof Date &&
        user.updatedAt instanceof Date;
};

export function useUser(): PublicUser | null {
    const data = useRootLoaderData();
    if (!data || !data.user) {
        return null;
    }

    if (!isPublicUser(data.user)) {
        return null;
    }

    return {
        ...data.user
    };
}