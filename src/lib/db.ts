import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Always create fresh PrismaClient to avoid stale connections
if (globalForPrisma.prisma) {
  try { globalForPrisma.prisma.$disconnect() } catch { /* ignore */ }
  globalForPrisma.prisma = undefined
}

export const db = new PrismaClient({ log: ['query'] })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db