export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { db } = await import("@/lib/db");
    setInterval(async () => {
      try { await db.$queryRaw`SELECT 1`; } catch {}
    }, 45000);
  }
}
