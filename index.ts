import dotenv from "dotenv";
dotenv.config({ path: "./env" })
import app from "./app.js"
import prisma from "./src/config/db.js";


try {
    console.log('🔄 Connecting to the database...');
    await prisma.$connect();
    console.log('✅ Database connected successfully!');

    app.listen(process.env.PORT || 3002, () => {
        console.log(`📦 App is running on port: ${process.env.PORT}`);
    });
} catch (error) {
    console.error("Failed to start the application", error);
    process.exit(1);
};
