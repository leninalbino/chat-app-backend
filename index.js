require('dotenv').config(); // Cargar variables de entorno

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const User = require('./src/models/User');
const Message = require('./src/models/Message');
const socketEvents = require('./src/constants/socketEvents');

// --- Inicialización del Servidor ---
const app = express();
const server = http.createServer(app);

const corsOrigin = process.env.NODE_ENV === 'production' ? 'https://chat-app-v1-beta.vercel.app/' : (process.env.CORS_ORIGIN || "http://localhost:5173");
console.log('Socket.IO CORS Origin configurado:', corsOrigin);

const io = new Server(server, {
  cors: {
    origin: corsOrigin,
    methods: ["GET", "POST"]
  }
});

// --- Middlewares ---
app.use(cors());
app.use(express.json()); // Para parsear body de requests como JSON

// --- API Endpoints ---

// Endpoint para que un usuario inicie sesión o se registre
app.post('/api/login', async (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ error: 'El nombre de usuario es requerido' });
  }

  try {
    let user = await User.findByUsername(username);
    if (user) {
      res.json({ userId: user.id, username: user.username });
    } else {
      user = await User.create(username);
      res.status(201).json(user);
    }
  } catch (err) {
    console.error("Error en login:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Endpoint para obtener los últimos 50 mensajes
app.get('/api/messages', async (req, res) => {
  try {
    const messages = await Message.getAll();
    res.json(messages);
  } catch (err) {
    console.error("Error obteniendo mensajes:", err.message);
    res.status(500).json({ error: err.message });
  }
});


// --- Lógica de WebSockets ---
// --- Lógica de Presencia de Usuarios ---
let connectedUsers = {}; // Almacena { userId: { username, socketId } }
let typingUsers = {}; // Almacena { userId: username }

function broadcastUserList() {
  io.emit(socketEvents.SERVER_USER_LIST_UPDATE, Object.values(connectedUsers).map(u => u.username));
}

function broadcastTypingUsers() {
  io.emit(socketEvents.SERVER_TYPING_USERS_UPDATE, Object.values(typingUsers));
}

io.on('connection', (socket) => {
  console.log('✅ Un usuario se ha conectado:', socket.id);

  // Cuando un usuario se une, lo agregamos a la lista
  socket.on(socketEvents.CLIENT_USER_JOINED, (user) => {
    connectedUsers[user.userId] = { username: user.username, socketId: socket.id };
    // Almacenar userId y username directamente en el socket para fácil acceso en desconexión
    socket.userId = user.userId;
    socket.username = user.username;
    broadcastUserList();
  });

  socket.on('disconnect', () => {
    console.log('❌ Un usuario se ha desconectado:', socket.id);
    if (socket.userId) {
      delete connectedUsers[socket.userId];
      delete typingUsers[socket.userId]; // Eliminar de la lista de escribiendo también
      broadcastUserList();
      broadcastTypingUsers();
    }
  });

  // Escuchar un nuevo mensaje del cliente
  socket.on(socketEvents.CLIENT_SEND_MESSAGE, async (data) => {
    const { content, userId } = data;
    try {
      const newMessage = await Message.create(content, userId);
      io.emit(socketEvents.SERVER_NEW_MESSAGE, newMessage);
    } catch (err) {
      console.error("Error guardando mensaje:", err.message);
      // Emitir error al cliente que intentó enviar el mensaje
      socket.emit(socketEvents.SERVER_MESSAGE_ERROR, { message: "No se pudo enviar el mensaje." });
    }
  });

  // Lógica de "está escribiendo"
  socket.on(socketEvents.CLIENT_USER_TYPING, (user) => {
    typingUsers[user.userId] = user.username;
    broadcastTypingUsers();
  });

  socket.on(socketEvents.CLIENT_USER_STOPPED_TYPING, (user) => {
    delete typingUsers[user.userId];
    broadcastTypingUsers();
  });
});

// --- Iniciar el Servidor ---
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en el puerto ${PORT}`);
});