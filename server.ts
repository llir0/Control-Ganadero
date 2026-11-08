import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Healthcheck Endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Control Ganadero Pro Engine',
    databaseArchitecture: 'SQLite/PostgreSQL In-Memory Sync with LocalStorage Ledger Persistence',
  });
});

// Database Architecture Information Endpoint
app.get('/api/db-info', (_req, res) => {
  res.json({
    engine: 'Arquitectura Híbrida: Relacional In-Memory + Ledger LocalSync (Compatible con PostgreSQL / Cloud SQL)',
    schema: {
      tables: [
        {
          name: 'animals',
          description: 'Registro maestro de ganado (aretes, datos biológicos, procedencia, pesos)',
          columns: ['id (NO. ANIMAL)', 'status (ACT/IAC)', 'birthDate', 'sex', 'purpose (CRIA/CEBA/LECHE/REPRODUCTOR)', 'breed', 'corralId', 'purchased', 'fatherId', 'motherId', 'ironBrand', 'warningNote', 'currentWeightKg'],
        },
        {
          name: 'clinical_records',
          description: 'Historial de tratamientos médicos, vacunas, aretado e intervenciones',
          columns: ['id', 'animalId', 'date', 'type', 'description', 'medication', 'veterinarian', 'nextDueDate', 'cost'],
        },
        {
          name: 'tasks_schedule',
          description: 'Pendientes, baños garrapaticidas, visitas médicas y revisiones',
          columns: ['id', 'animalId', 'title', 'type', 'dueDate', 'assignedWorkerId', 'priority', 'status', 'notes'],
        },
        {
          name: 'workers',
          description: 'Personal de campo, capataces, vaqueros y veterinarios con responsabilidad asignada',
          columns: ['id', 'name', 'role', 'phone', 'shift', 'assignedCorralIds', 'assignedAnimalCount', 'status'],
        },
        {
          name: 'corrals',
          description: 'Corrales, potreros y galpones con control de aforo y aforo actual',
          columns: ['id', 'code', 'name', 'capacity', 'currentCount', 'purpose', 'location', 'assignedWorkerName'],
        },
        {
          name: 'feed_inventory',
          description: 'Inventario de concentrado, forraje, sales minerales y alertas de stock bajo',
          columns: ['id', 'name', 'category', 'currentStockKg', 'unit', 'minThresholdKg', 'dailyUsageKg', 'costPerUnitUSD'],
        },
        {
          name: 'audit_logs',
          description: 'Auditoría completa de acciones realizadas por cada empleado',
          columns: ['id', 'timestamp', 'workerName', 'action', 'category', 'details'],
        },
        {
          name: 'financial_transactions',
          description: 'Libro contable de ingresos (ventas ganado/leche) y egresos (alimento/medicina/nómina)',
          columns: ['id', 'date', 'type', 'category', 'description', 'amountUSD', 'animalId', 'batchNumber'],
        },
      ],
    },
  });
});



async function startServer() {
  // Vite middleware in development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌾 Servidor de Control Ganadero escuchando en http://0.0.0.0:${PORT}`);
  });
}

startServer();
