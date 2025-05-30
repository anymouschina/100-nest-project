import { PrismaClient } from '@prisma/client'

declare global {
  namespace PrismaClient {
    export type ExtendedPrismaClient = PrismaClient
  }
}

export {}; 