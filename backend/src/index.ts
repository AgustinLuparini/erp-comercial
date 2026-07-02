import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { json, urlencoded } from 'express';
import { existsSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from './config/config.js';
import { logger } from './logs/logger.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { authRouter } from './routes/auth.routes.js';
import { userRouter } from './routes/user.routes.js';
import productRouter from './routes/product.routes.js';
import labelRouter from './routes/label.routes.js';
import customerRouter from './routes/customer.routes.js';
import supplierRouter from './routes/supplier.routes.js';
import reportRouter from './routes/report.routes.js';
import purchaseRouter from './routes/purchase.routes.js';
import stockRouter from './routes/stock.routes.js';
import saleRouter from './routes/sale.routes.js';
import cashRouter from './routes/cash.routes.js';
import uploadRouter from './routes/upload.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const swaggerCandidates = [
  resolve(__dirname, './swagger.json'),
  resolve(process.cwd(), 'dist/swagger.json'),
  resolve(process.cwd(), 'src/swagger.json')
];
const swaggerPath = swaggerCandidates.find((candidate) => existsSync(candidate));

if (!swaggerPath) {
  throw new Error('swagger.json not found in dist or src');
}

const swaggerDocument = JSON.parse(readFileSync(swaggerPath, 'utf-8'));

const app = express();
const httpStream = { write: (message: string) => logger.info(message.trim()) };
app.use(helmet());
app.use(cors());
app.use(json());
app.use(urlencoded({ extended: true }));
app.use(morgan('combined', { stream: httpStream }));

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/products', productRouter);
app.use('/api/labels', labelRouter);
app.use('/api/customers', customerRouter);
app.use('/api/suppliers', supplierRouter);
app.use('/api/reports', reportRouter);
app.use('/api/purchases', purchaseRouter);
app.use('/api/stock', stockRouter);
app.use('/api/sales', saleRouter);
app.use('/api/cash', cashRouter);
app.use('/uploads', express.static(resolve(process.cwd(), 'uploads')));
app.use('/api/uploads', uploadRouter);
app.use(errorHandler);

const startServer = (port: number, retries = 0): void => {
  const server = app.listen(port, () => {
    logger.info(`Server running on port ${port}`);
  });

  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE' && retries < 10) {
      const nextPort = port + 1;
      logger.warn(`Port ${port} is in use, retrying on ${nextPort}`);
      startServer(nextPort, retries + 1);
      return;
    }

    throw error;
  });
};

startServer(config.port);
