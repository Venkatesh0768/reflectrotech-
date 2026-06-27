import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
  console.log("Restoring Supabase Auth trigger...");
  try {
    await prisma.$executeRawUnsafe(`
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
      BEGIN
        INSERT INTO public.profiles (id, email, full_name, role)
        VALUES (
          NEW.id,
          NEW.email,
          COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
          COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'employee')
        );
        RETURN NEW;
      END;
      $$;
    `);
    
    await prisma.$executeRawUnsafe(`
      DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
    `);
    
    await prisma.$executeRawUnsafe(`
      CREATE TRIGGER trg_on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    `);

    console.log("✅ Trigger restored successfully!");
  } catch (err) {
    console.error("Caught exception:", err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
