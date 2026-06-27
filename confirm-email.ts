import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
  console.log("Confirming admin email in database...");
  try {
    await prisma.$executeRawUnsafe(`
      UPDATE auth.users 
      SET email_confirmed_at = now() 
      WHERE email = 'admin@rfelectrotech.com';
    `);
    console.log("✅ Email confirmed successfully!");
  } catch (err) {
    console.error("Caught exception:", err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
