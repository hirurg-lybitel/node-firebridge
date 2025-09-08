import { config } from './config';
import app from './app';
import { firebirdConnection } from './database/connection';

const startServer = async (): Promise<void> => {
  try {
    // Проверяем подключение к базе данных
    console.log('Testing database connection...');
    const isConnected = await firebirdConnection.testConnection();
    
    if (!isConnected) {
      console.error('Failed to connect to Firebird database');
      process.exit(1);
    }
    
    console.log('Database connection successful');

    // Получаем информацию о базе данных
    try {
      const dbInfo = await firebirdConnection.getDatabaseInfo();
      console.log('Database info:', {
        version: dbInfo.version,
        page_size: dbInfo.page_size,
        sql_dialect: dbInfo.sql_dialect,
      });
    } catch (error) {
      console.warn('Could not retrieve database info:', error);
    }

    // Запускаем сервер
    const server = app.listen(config.server.port, () => {
      console.log(`🚀 Server is running on port ${config.server.port}`);
      console.log(`📊 Environment: ${config.server.nodeEnv}`);
      console.log(`🔗 Health check: http://localhost:${config.server.port}/health`);
      console.log(`📖 API documentation: http://localhost:${config.server.port}/`);
      console.log(`🗄️  Database: ${config.firebird.host}:${config.firebird.port}${config.firebird.database}`);
    });

    // Graceful shutdown
    const gracefulShutdown = (signal: string) => {
      console.log(`\n${signal} received. Starting graceful shutdown...`);
      
      server.close(() => {
        console.log('HTTP server closed');
        
        firebirdConnection.destroy();
        console.log('Database connections closed');
        
        console.log('Graceful shutdown completed');
        process.exit(0);
      });

      // Force close after 10 seconds
      setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      gracefulShutdown('uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('unhandledRejection');
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Запускаем сервер
startServer();

