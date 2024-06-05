import express from 'express'
import authRoutes from './routes/auth.route.js'
import messageRoutes from './routes/message.route.js'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser';

dotenv.config()
const PORT = process.env.PORT || 5000
const app = express()
app.use(express.json())
app.use(cookieParser())
app.use("/api/auth", authRoutes)
app.use("/api/messages", messageRoutes)



app.listen(PORT, ()=>{
    console.log("Server is running on port " + PORT)
})