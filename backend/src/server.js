import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { config } from './config/index.js';
import { pool } from './database/db.js';
import { SocketManager } from './services/socket/socketManager.js';
import { createMigrationWorker } from './services/queue/worker.js';
import authRoutes from './routes/auth.js';
import storesRoutes from './routes/stores.js';
import migrationsRoutes from './routes/migrations.js';
import testRoutes from './routes/test.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: config.cors.origin,
    credentials: true,
  },
});

const socketManager = new SocketManager(io);

const PgSession = connectPgSimple(session);

app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(compression());
app.use(cors(config.cors));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (config.env === 'development') {
  app.use(morgan('dev'));
}

app.use(session({
  store: new PgSession({
    pool,
    tableName: 'session',
    createTableIfMissing: true,
  }),
  secret: config.security.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: config.env === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
}));

app.use('/api/auth', authRoutes);
app.use('/api/stores', storesRoutes);
app.use('/api/migrations', migrationsRoutes);
app.use('/api/test', testRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({
    name: 'Zenith Weave - Shopify Store Duplicator API',
    version: '1.0.0',
    status: 'running',
  });
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('authenticate', (data) => {
    if (data.userId) {
      socketManager.registerUser(data.userId, socket.id);
      socket.emit('authenticated', { success: true });
    }
  });

  socket.on('subscribe:migration', (migrationId) => {
    socket.join(`migration:${migrationId}`);
  });

  socket.on('unsubscribe:migration', (migrationId) => {
    socket.leave(`migration:${migrationId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

createMigrationWorker(socketManager);

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: config.env === 'production' ? 'Internal server error' : err.message 
  });
});

const PORT = config.port;

httpServer.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║           🚀 Zenith Weave - Shopify Duplicator           ║
║                                                           ║
║  Server running on port ${PORT}                             ║
║  Environment: ${config.env}                          ║
║  Frontend URL: ${config.cors.origin}      ║
║                                                           ║
║                                                           ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);

  // Auto-setup database on startup - DISABLED
  // if (process.env.NODE_ENV === 'production') {
  //   (async () => {
  //     try {
  //       console.log('🗄️ Running database setup...');
  //       await import('./database/migrate.js');
  //       await import('./database/seed.js');
  //       console.log('✅ Database setup completed');
  //     } catch (error) {
  //       console.log('⚠️ Database setup skipped (might already exist):', error.message);
  //     }
  //   })();
  // }
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  httpServer.close(() => {
    console.log('HTTP server closed');
    pool.end(() => {
      console.log('Database pool closed');
      process.exit(0);
    });
  });
});
