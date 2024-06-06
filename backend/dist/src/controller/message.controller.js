import prisma from "../db/prisma.js";
import { getReceiverSocketId, io } from "../socket/socket.js";
export const sendMessage = async (req, res) => {
    try {
        const { message } = req.body;
        const { id: receiverId } = req.params;
        const senderId = req.user.id;
        // checking that is there any conversation exist befor or notvc
        let conversation = await prisma.conversation.findFirst({
            where: {
                participantIds: {
                    hasEvery: [senderId, receiverId]
                }
            }
        });
        // if there is no conversation before then create
        if (!conversation) {
            conversation = await prisma.conversation.create({
                data: {
                    participantIds: {
                        set: [receiverId, senderId]
                    }
                }
            });
        }
        // creating new message
        const newMessage = await prisma.message.create({
            data: {
                senderId,
                body: message,
                conversationId: conversation.id
            }
        });
        // if there is new message then updating the conversation for new message
        if (newMessage) {
            conversation = await prisma.conversation.update({
                where: { id: conversation.id },
                data: {
                    messages: {
                        connect: {
                            id: newMessage.id
                        }
                    }
                }
            });
        }
        // socket.io logic
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage);
        }
        res.status(201).json(newMessage);
    }
    catch (error) {
        console.log("Error in send message", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
export const getMessages = async (req, res) => {
    try {
        const { id: userToChatId } = req.params;
        const senderId = req.user.id;
        // find existing conversation
        const conversation = await prisma.conversation.findFirst({
            where: {
                participantIds: {
                    hasEvery: [senderId, userToChatId]
                }
            },
            include: {
                messages: {
                    orderBy: {
                        createdAt: "asc"
                    }
                }
            }
        });
        if (!conversation) {
            return res.status(200).json([]);
        }
        return res.status(200).json(conversation.messages);
    }
    catch (error) {
        console.log("Error in get messages", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
export const getUserForSidebar = async (req, res) => {
    try {
        const authUserId = req.user.id;
        const users = await prisma.user.findMany({
            where: {
                id: {
                    not: authUserId
                }
            },
            select: {
                id: true,
                fullName: true,
                profilePic: true
            }
        });
        return res.status(200).json(users);
    }
    catch (error) {
        console.log("Error in get user for sidebar", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
