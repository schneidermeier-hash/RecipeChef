import { PrismaClient, Prisma } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export async function checkDatabaseConnection(): Promise<{ ok: boolean; error?: string }> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return { ok: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { ok: false, error: message }
  }
}

export function describePrismaError(error: unknown): { message: string; status: number } {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return {
      message: `Prisma-Fehler ${error.code}: ${error.message}`,
      status: 400,
    }
  }
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return {
      message: `Datenbank nicht erreichbar: ${error.message}`,
      status: 503,
    }
  }
  if (error instanceof Prisma.PrismaClientValidationError) {
    return {
      message: `Validierungsfehler: ${error.message}`,
      status: 400,
    }
  }
  if (error instanceof Error) {
    return {
      message: `Unerwarteter Fehler: ${error.message}`,
      status: 500,
    }
  }
  return {
    message: `Unbekannter Fehler: ${String(error)}`,
    status: 500,
  }
}
