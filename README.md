# Reserva de Asientos - WebSockets

Aplicacion de reserva de asientos en tiempo real usando Node.js, Express y Socket.IO.

## Estructura del proyecto

```
proyecto/
├── server.js
├── package.json
└── public/
    ├── index.html
    ├── style.css
    ├── script.js
    ├── admin.html
    └── admin.js
```

## Instalacion

```bash
npm init -y
npm install express socket.io
```

## Ejecucion

```bash
node server.js
```

Abrir en el navegador: `http://localhost:3000`

Panel de administrador: `http://localhost:3000/admin.html`

---

## Parte 1: Estructura de la app

### server.js
- Configura el servidor con Express y Socket.IO
- Sirve archivos estaticos desde la carpeta `public/`
- Inicializa 30 asientos (filas A, B, C)
- Maneja eventos: conexion de clientes, reserva, liberacion y compra de asientos

### public/index.html
- Campo de nombre de usuario
- Contenedor de asientos generado dinamicamente
- Temporizador visual de reserva
- Boton de compra

### public/style.css
- Asientos en filas ordenadas
- Colores por estado: gris (disponible), amarillo (reservado), rojo (vendido)

### public/script.js
- Conexion con Socket.IO
- Generacion dinamica de los 30 asientos
- Logica de seleccion, reserva y compra
- Manejo de eventos `reserve`, `release` y `buy`

---

## Parte 2: Actividades

### 1. Tooltip con nombre de usuario
Se usa el atributo `title` del elemento HTML para mostrar quien reservo o compro cada asiento al pasar el mouse.

### 2. Precios por fila y factura
Precios asignados por fila: A = $6, B = $5, C = $4. Al seleccionar asientos se muestra el total en tiempo real. Al confirmar la compra se presenta un resumen con el desglose por asiento antes de proceder.

### 3. Panel de administrador
Vista separada en `admin.html` con el estado global de todos los asientos, contadores de disponibles, reservados y vendidos, y botones para liberar reservas o resetear todos los asientos.
