import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log("Starting seed script...");

    // Seed group: SuperAdmin
    const superAdminGroup = await prisma.group.upsert({
        where: { name: 'SuperAdmin' },
        update: {}, // If it exists, don't modify
        create: { name: 'SuperAdmin' }, // If it doesn't exist, create it
    });
    console.log(`Group '${superAdminGroup.name}' ensured.`);

    // Seed user: SuperAdmin
    const superAdminUser = await prisma.user.upsert({
        where: { email: 'admin@example.com' },
        update: {}, // If the user exists, don't modify it
        create: {
            username: 'admin',
            email: 'admin@example.com',
            password: await bcrypt.hash('password123', 10), // Hash the password
            groups: {
                connect: { id: superAdminGroup.id }, // Link to SuperAdmin group
            },
        },
    });
    console.log(`SuperAdmin user '${superAdminUser.username}' ensured.`);
}

main()
    .then(() => {
        console.log("Seeding completed.");
        prisma.$disconnect();
    })
    .catch((error) => {
        console.error("Seeding failed:", error);
        prisma.$disconnect();
        process.exit(1);
    });
