import { Router, Request, Response } from 'express';
import { createJob, setJobResult, setJobError, getJob } from '../utils/jobManager';
import config from '../config';

const TIMEOUT = config.firebird.asyncQueryTimeout || 3600000;

const router: Router = Router();

// Async query endpoint: submit a long-running query, get immediate response with requestId
router.post('/async-query', async (req: Request, res: Response) => {
  const requestId = req.headers['x-request-id'] as string;
  if (!requestId) {
    return res.status(400).json({ success: false, error: 'Missing X-Request-ID header' });
  }
  createJob(requestId);
  const response = {
    success: true,
    requestId,
    status: 'processing',
    message: 'Query is being processed asynchronously.'
  };
  // Start background processing
  (async () => {
    try {
      const { sql, params = [] } = req.body;
      const { crudService } = await import('../database/crud');
      const result = await crudService.executeQuery(sql, params, TIMEOUT);
      setJobResult(requestId, result);
    } catch (error) {
      setJobError(requestId, error instanceof Error ? error.message : 'Unknown error');
    }
  })();
  return res.json(response);
});

// Endpoint to check async job status by requestId
router.get('/jobs/:requestId/status', (req: Request, res: Response) => {
  const job = getJob(req.params.requestId as string);
  if (!job) {
    return res.status(404).json({ success: false, error: 'Job not found', requestId: req.params.requestId });
  }
  return res.json({ success: true, requestId: req.params.requestId, status: job.status });
});

// Endpoint to get async job result by requestId
router.get('/jobs/:requestId/result', (req: Request, res: Response) => {
  const job = getJob(req.params.requestId as string);
  if (!job) {
    return res.status(404).json({ success: false, error: 'Job not found', requestId: req.params.requestId });
  }
  if (job.status === 'processing') {
    return res.status(202).json({ success: false, status: 'processing', requestId: req.params.requestId });
  }
  if (job.status === 'error') {
    return res.status(500).json({ success: false, error: job.error, requestId: req.params.requestId });
  }
  return res.json({ success: true, requestId: req.params.requestId, result: job.result });
});

export default router;
