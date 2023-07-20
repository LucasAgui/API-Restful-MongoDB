/* eslint-disable quotes */
const { MongoClient } = require("mongodb");
const path = require("path");

require("dotenv").config({ path: path.join(__dirname, ".env") });
const URL = process.env.DATABASE_URL;

const client = new MongoClient(URL);

async function connect() {
    try {
        console.log("Conectando a MongoDB");
        await client.connect();
        console.log("Conectado");

        return client;
    } catch (error) {
        console.log(error.message);
        return null;
    }
}
async function disconnect() {
    try {
        await client.close();
        console.log("Se ha cerrado la conexión");
    } catch (error) {
        console.log(error.message);
    }
}
async function connectToDb(collectionName) {
    const connection = await connect();
    const db = connection.db(process.env.DATABASE_NAME);
    const collection = db.collection(collectionName);
    return collection;
}
async function generateCode(collection) {
    const documentMaxCode = await collection
        .find()
        .sort({ codigo: -1 })
        .limit(1)
        .toArray();
    const maxCode = documentMaxCode[0]?.codigo ?? 0;
    return maxCode + 1;
}

module.exports = { disconnect, connectToDb, generateCode };
