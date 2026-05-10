const express = require('express');
const http = require('http');
const path = require('path');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(path.join(__dirname, 'public')));

// Estado global de los asientos
let seats = {};

function initSeats() {
    ['A', 'B', 'C'].forEach(row => {
        for (let i = 1; i <= 10; i++) {
            seats[`${row}${i}`] = { status: 'available', user: null, expiresAt: 0 };
        }
    });
}

initSeats();

// Manejar conexiones de Socket.io
io.on('connection', (socket) => {
    // Enviar el estado actual al nuevo cliente
    socket.emit('init', seats);

    // Registrar nombre del usuario
    socket.on('setUsername', (username) => {
        socket.username = username;
    });

    // Manejar reserva de asiento
    socket.on('reserve', (seatId) => {
        const seat = seats[seatId];
        if (seat && seat.status === 'available') {
            seat.status = 'reserved';
            seat.user = socket.username;
            seat.expiresAt = Date.now() + 60000;

            io.emit('reserve', { seatId, user: seat.user, expiresAt: seat.expiresAt });

            // Liberar el asiento después de 60 segundos si no se compra
            setTimeout(() => {
                if (seats[seatId] && seats[seatId].status === 'reserved' && Date.now() >= seats[seatId].expiresAt) {
                    seats[seatId] = { status: 'available', user: '', expiresAt: 0 };
                    io.emit('release', seatId);
                }
            }, 60000);
        }
    });

    // Manejar la liberación del asiento de forma manual
    socket.on('release', (seatId) => {
        const seat = seats[seatId];
        if (seat && seat.status === 'reserved' && seat.user === socket.username) {
            seats[seatId] = { status: 'available', user: '', expiresAt: 0 };
            io.emit('release', seatId);
        }
    });

    // Confirmar compra de uno o más asientos
    socket.on('buy', (seatIds) => {
        seatIds.forEach(seatId => {
            seats[seatId] = { status: 'sold', user: socket.username, expiresAt: 0 };
            io.emit('buy', { seatId, user: socket.username });
        });
    });

    // Admin: pedir estadísticas
    socket.on('getStats', () => {
        socket.emit('statsUpdate', seats);
    });

    // Admin: liberar solo los reservados
    socket.on('adminReleaseReserved', () => {
        Object.keys(seats).forEach(seatId => {
            if (seats[seatId].status === 'reserved') {
                seats[seatId] = { status: 'available', user: '', expiresAt: 0 };
                io.emit('release', seatId);
            }
        });
        io.emit('statsUpdate', seats);
    });

    // Admin: resetear todos los asientos
    socket.on('adminReset', () => {
        initSeats();
        io.emit('init', seats);
    });
});

// Iniciar el servidor
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Servidor activo en http://localhost:${PORT}`);
});