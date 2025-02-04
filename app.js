import express from "express";
import http from "node:http";
import { Server } from "socket.io";

const port = 3000;
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
    }
});

let users = [];

io.on("connection", (socket) => {
    console.log("Usuário conectado: " + socket.id);
    users.push(socket.id);

    socket.on("message", (msg) => {
        io.emit("message", msg);
    });

    socket.on("image", (imageData) => {
        io.emit("image", imageData);
    });

    // Encontrar um parceiro aleatório para a chamada
    socket.on("findPartner", () => {
        const availableUsers = users.filter(id => id !== socket.id);
        
        if (availableUsers.length > 0) {
            const randomUser = availableUsers[Math.floor(Math.random() * availableUsers.length)];
            io.to(socket.id).emit("partnerFound", randomUser);
            io.to(randomUser).emit("partnerFound", socket.id);
        } else {
            socket.emit("noPartnerAvailable");
        }
    });

    // Iniciar chamada
    socket.on("callUser", ({ userToCall, signalData, from }) => {
        io.to(userToCall).emit("callIncoming", { signal: signalData, from });
    });

    // Aceitar chamada
    socket.on("answerCall", (data) => {
        io.to(data.to).emit("callAccepted", data.signal);
    });

    socket.on("disconnect", () => {
        console.log("Usuário desconectado", socket.id);
        users = users.filter(id => id !== socket.id);
    });
});

server.listen(port, () => {
    console.log(`Servidor rodando em: http://localhost:${port}`);
});
