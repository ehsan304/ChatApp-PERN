import jwt, { JwtPayload } from 'jsonwebtoken'
import { Request, Response, NextFunction } from "express";
import prisma from '../db/prisma.js';




interface DecodedToken extends JwtPayload {
    userId: string;
}

declare global {
    namespace Express {
        export interface Request {
            user: {
                id: string
            }
        }
    }
}


const protectRoute = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.cookies.jwt

        if (!token) {
            return res.status(400).json({ error: "Unauthorized" })
        }

        const decode = jwt.verify(token, process.env.TOKEN_SECRET!) as DecodedToken

        if (!decode) {
            return res.status(400).json({ error: "Unauthorized - Invalid Token" })
        }

        const user = await prisma.user.findUnique({ where: { id: decode.userId }, select: { id: true, fullName: true, username: true, profilePic: true } })

        if (!user) {
            return res.status(400).json({ error: "User not found" })
        }

        req.user = user

        next()



    } catch (error: any) {
        console.log("Error in protectRoute middlware", error.message)
        res.status(500).json({ error: "Internal server error" })
    }
}

export default protectRoute