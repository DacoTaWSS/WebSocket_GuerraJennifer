const socket = io();
const seating = document.getElementById('seatsContainer');
function createSeats() {
    ['A', 'B', 'C'].forEach(row => {
        for (let i = 1; i <= 10; i++) {
            const seatId = row + i;
            const div = document.createElement('div');
            div.className = 'seat';
            div.id = 'seat-' + seatId;
            div.innerText = seatId;
            seating.appendChild(div);
        }
    });
}
function updateSeat(seatId, status, user) {
    const div = document.getElementById('seat-' + seatId);
    if (!div) return;
    div.classList.remove('reserved', 'sold');
    if (status === 'reserved') {
        div.classList.add('reserved');
        div.title = `Reservado por: ${user || ''}`;
    } else if (status === 'sold') {
        div.classList.add('sold');
        div.title = `Vendido a: ${user || ''}`;
    } else {
        div.title = '';
    }
}
function updateStats(seats) {
    const values = Object.values(seats);
    document.getElementById('countAvailable').innerText = values.filter(s => s.status === 'available').length;
    document.getElementById('countReserved').innerText  = values.filter(s => s.status === 'reserved').length;
    document.getElementById('countSold').innerText      = values.filter(s => s.status === 'sold').length;
}
createSeats();
// Estado inicial
socket.on('init', (seats) => {
    document.querySelectorAll('.seat').forEach(s => {
        s.classList.remove('reserved', 'sold');
        s.title = '';
    });
    Object.entries(seats).forEach(([id, info]) => updateSeat(id, info.status, info.user));
    updateStats(seats);
});
// Eventos en tiempo real
socket.on('reserve', ({ seatId, user }) => {
    updateSeat(seatId, 'reserved', user);
    socket.emit('getStats');
});
socket.on('release', (seatId) => {
    updateSeat(seatId, 'available', '');
    socket.emit('getStats');
});
socket.on('buy', ({ seatId, user }) => {
    updateSeat(seatId, 'sold', user);
    socket.emit('getStats');
});
socket.on('statsUpdate', (seats) => {
    updateStats(seats);
});
// Botones admin
document.getElementById('btnLiberarReservados').addEventListener('click', () => {
    if (confirm('¿Liberar todos los asientos reservados?')) {
        socket.emit('adminReleaseReserved');
    }
});
document.getElementById('btnResetear').addEventListener('click', () => {
    if (confirm('¿Resetear TODOS los asientos? Esto borrará reservas y ventas.')) {
        socket.emit('adminReset');
    }
});