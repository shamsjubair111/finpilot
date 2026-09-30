import "server-only";
import dns from "node:dns";
import net from "node:net";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// Node's parallel IPv6/IPv4 "happy eyeballs" attempts time out on some networks (ETIMEDOUT after ~1s);
// connecting over IPv4 only is reliable. Same workaround as --no-network-family-autoselection.
net.setDefaultAutoSelectFamily(false);
dns.setDefaultResultOrder("ipv4first");

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  // Neon suspends idle compute; the first connection after a pause can take several seconds.
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
    connectionTimeoutMillis: 20_000,
    idleTimeoutMillis: 60_000,
    max: 10,
  });
  // Neon adds a network round trip per query, so multi-step transactions (payments, onboarding,
  // sample data) need more than Prisma's 5-second default.
  return new PrismaClient({ adapter, transactionOptions: { maxWait: 10_000, timeout: 20_000 } });
}

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
