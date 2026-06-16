import { MongoClient, type Db } from "mongodb"

if (!process.env.MONGODB_URI) {
  throw new Error("Vui lòng thêm biến môi trường MONGODB_URI")
}

const uri = process.env.MONGODB_URI

let client: MongoClient
let clientPromise: Promise<MongoClient>

// Dùng biến toàn cục để giữ kết nối qua các lần hot-reload trong môi trường dev
const globalForMongo = globalThis as unknown as {
  _mongoClientPromise?: Promise<MongoClient>
}

if (!globalForMongo._mongoClientPromise) {
  client = new MongoClient(uri)
  globalForMongo._mongoClientPromise = client.connect()
}
clientPromise = globalForMongo._mongoClientPromise

export default clientPromise

export async function getDb(): Promise<Db> {
  const connectedClient = await clientPromise
  // Dùng database mặc định trong connection string, fallback về "chatly"
  return connectedClient.db()
}
