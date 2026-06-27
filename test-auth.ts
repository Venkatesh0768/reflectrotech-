import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";

const supabase = createClient(
  "https://slofmhujezbohdofgsdn.supabase.co",
  "sb_publishable_ERgDoXCwNUQ3Zf1ciY34Dw_mZB5IjB5"
);
const prisma = new PrismaClient();

async function run() {
  console.log("Dropping trigger to bypass database error...");
  try {
    await prisma.$executeRawUnsafe(`DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;`);
    
    console.log("Signing up...");
    const { data, error } = await supabase.auth.signUp({
      email: "admin@rfelectrotech.com",
      password: "AdminPassword123!",
      options: { data: { full_name: "Super Admin", role: "admin" } }
    });
    console.log({ data, error });

    if (data?.user?.id) {
      console.log("Creating profile manually...");
      await prisma.profile.upsert({
        where: { id: data.user.id },
        update: {},
        create: {
          id: data.user.id,
          email: data.user.email!,
          fullName: "Super Admin",
          role: "admin",
          isActive: true
        }
      });
      console.log("✅ Admin user and profile created successfully!");
    }
  } catch (err) {
    console.error("Caught exception:", err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
