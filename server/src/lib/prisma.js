import { PrismaClient } from "@prisma/client";

/** Shared client for macro + future services (insightsService still uses its own instance). */
export const prisma = new PrismaClient();
