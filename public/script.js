const socket = io();
const usernameInput = document.getElementById('usernameInput');
const seating = document.getElementById('seatsContainer');
const timerDisplay = document.getElementById('timerDisplay');
const buyBtn = document.getElementById('buyButton');

const selectedSeats = new Set();    
const seatTimers = {};  

// Precios por fila
const rowPrices = { A: 6, B: 5, C: 4 };

function getSeatPrice(seatId) {
    return rowPrices[seatId[0]] || 0;
}

function createSeats() {
    ['A', 'B', 'C'].forEach(row => {
        for (let i = 1; i <= 10; i++) {
            const seatId = row + i;
            const div = document.createElement('div');
            div.className = 'seat';
            div.id = seatId;
            div.innerText = seatId;

            div.addEventListener('click', () => {
                const username = usernameInput.value.trim();
                if (!username) {
                    alert('Por favor, ingresa tu nombre de usuario');
                    return;
                }

                socket.emit('setUsername', username);

                if (div.classList.contains('sold')) return;

                if (selectedSeats.has(seatId)) {
                    // Deseleccionar solo si es TUYO
                    selectedSeats.delete(seatId);
                    div.classList.remove('reserved');
                    socket.emit('release', seatId);
                    stopSeatTimer(seatId);
                    updateTotal();
                } else if (!div.classList.contains('reserved')) {
                    // Solo reservar si está disponible (no reservado por otro)
                    selectedSeats.add(seatId);
                    div.classList.add('reserved');
                    socket.emit('reserve', seatId);
                    updateTotal();
                }
                else{
                    alert(`El asiento ${seatId} ya está reservado por alguien más`);
                }
            });

            seating.appendChild(div);
        }
    });
}

createSeats();

// Estado inicial del servidor
socket.on('init', (serverSeats) => {
    document.querySelectorAll('.seat').forEach(s => {
        s.classList.remove('reserved', 'sold');
        s.title = '';
    });
    Object.entries(serverSeats).forEach(([id, info]) => {
        const seat = document.getElementById(id);
        if (!seat) return;
        if (info.status === 'reserved') {
            seat.classList.add('reserved');
            seat.title = `Reservado por: ${info.user || ''}`;
        }
        if (info.status === 'sold') {
            seat.classList.add('sold');
            seat.title = `Vendido a: ${info.user || ''}`;
        }
    });
});

// Reserva confirmada (para todos los clientes)
socket.on('reserve', ({ seatId, user, expiresAt }) => {
    const seat = document.getElementById(seatId);
    if (!seat) return;
    seat.classList.add('reserved');
    seat.title = `Reservado por: ${user}`;
    // Timer solo para el dueño del asiento
    if (user === usernameInput.value.trim()) {
        startSeatTimer(seatId, expiresAt);
    }
});

// Inicia un timer para UN asiento específico
function startSeatTimer(seatId, expiresAt) {
    stopSeatTimer(seatId);
    seatTimers[seatId] = {
        expiresAt,
        interval: setInterval(() => {
            const diff = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
            refreshTimerDisplay();
            if (diff <= 0) {
                stopSeatTimer(seatId);
                selectedSeats.delete(seatId);
            }
        }, 1000)
    };
    refreshTimerDisplay();
}
// Muestra el menor tiempo restante entre todos tus asientos reservados
function refreshTimerDisplay() {
    if (Object.keys(seatTimers).length === 0) {
        timerDisplay.innerText = '';
        return;
    }
    const minDiff = Math.min(
        ...Object.values(seatTimers).map(t =>
            Math.max(0, Math.floor((t.expiresAt - Date.now()) / 1000))
        )
    );
    timerDisplay.innerText = `Tiempo restante para confirmar: ${minDiff}s`;
}

function stopSeatTimer(seatId) {
    if (seatTimers[seatId]) {
        clearInterval(seatTimers[seatId].interval);
        delete seatTimers[seatId];
    }
    refreshTimerDisplay();
}
// Asiento liberado (timeout o manual)
socket.on('release', (seatId) => {
    const seat = document.getElementById(seatId);
    if (!seat) return;
    seat.classList.remove('reserved');
    seat.title = '';
    // Solo limpiar estado local si era tuyo
    if (selectedSeats.has(seatId)) {
        selectedSeats.delete(seatId);
        stopSeatTimer(seatId);
    }
});
// Asiento comprado
socket.on('buy', ({ seatId, user}) => {
    const seat = document.getElementById(seatId);
    if (!seat) return;
    seat.classList.remove('reserved');
    seat.classList.add('sold');
    seat.title = `Vendido a: ${user}`
    if (selectedSeats.has(seatId)) {
        selectedSeats.delete(seatId);
        stopSeatTimer(seatId);
    }
});
// Botón comprar
buyBtn.addEventListener('click', () => {
    if (selectedSeats.size === 0) return;

    const seats = Array.from(selectedSeats);
    const lines = seats.map(id => `  ${id} (Fila ${id[0]}): $${getSeatPrice(id)}`).join('\n');
    const total = seats.reduce((sum, id) => sum + getSeatPrice(id), 0);
    const factura = `---- Factura ----\n${lines}\n--------------------------\n  TOTAL: $${total}\n\n¿Confirmar compra :D?`;

    if (!confirm(factura)) return;

    socket.emit('buy', Array.from(selectedSeats));
    selectedSeats.forEach(id => stopSeatTimer(id));
    selectedSeats.clear();
    timerDisplay.innerText = '';
});

function updateTotal() {
    const total = Array.from(selectedSeats).reduce((sum, id) => sum + getSeatPrice(id), 0);
    timerDisplay.innerText = selectedSeats.size > 0
        ? `Asientos: ${Array.from(selectedSeats).join(', ')} | Total: $${total}`
        : '';
}