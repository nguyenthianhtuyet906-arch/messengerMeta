import { betterAuth } from "better-auth"
import { mongodbAdapter } from "better-auth/adapters/mongodb"
import clientPromise from "@/lib/mongodb"

const getDatabase = async () => {
  const client = await clientPromise
  return client.db()
}

export const auth = betterAuth({
  database: mongodbAdapter(await getDatabase()),
  emailAndPassword: {
    enabled: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 ngày
  },
})
