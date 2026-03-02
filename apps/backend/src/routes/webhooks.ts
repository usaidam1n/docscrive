import { Router, Request, Response } from 'express';
import express from 'express';
import crypto from 'crypto';
import logger from '../lib/logger.js';
import { appConfig } from '../config/index.js';
import { enqueueDocJob } from '../lib/queue.js';
import type { DocJobPayload } from '../types/index.js';

const router = Router();

// ─── Constants ───────────────────────────────────────────────────────────────

const SUPPORTED_BRANCHES = ['refs/heads/main', 'refs/heads/master'];

// ─── Signature Validation ────────────────────────────────────────────────────

/**
 * Validates the x-hub-signature-256 header sent by GitHub.
 * Signs the RAW request body (not parsed JSON) — this is critical;
 * any re-serialization would break the HMAC.
 */
function validateGithubSignature(
  rawBody: any,
  signatureHeader: string | undefined
): boolean {
  const secret = appConfig.github.webhookSecret;
  if (!secret) {
    logger.warn('GITHUB_WEBHOOK_SECRET is not set — rejecting webhook');
    return false;
  }

  if (!signatureHeader) return false;

  // Ensure the body is a valid format for crypto.update (String or Buffer).
  // If an upstream parser forced an Object, we blindly stringify it.
  const hashableBody =
    typeof rawBody === 'object' && !Buffer.isBuffer(rawBody)
      ? JSON.stringify(rawBody)
      : rawBody;

  const expected =
    'sha256=' +
    crypto.createHmac('sha256', secret).update(hashableBody).digest('hex');

  // Pad to same length before timingSafeEqual to avoid length-leak
  const sigBuf = Buffer.from(signatureHeader);
  const expBuf = Buffer.from(expected);

  if (sigBuf.length !== expBuf.length) return false;
  return crypto.timingSafeEqual(sigBuf, expBuf);
}

// ─── Webhook Handler ─────────────────────────────────────────────────────────

router.post(
  '/',
  // Use express.raw() ONLY for this route so we have the raw Buffer for HMAC
  express.raw({ type: 'application/json' }),
  async (req: Request, res: Response) => {
    const rawBody = req.body;

    // 1. Validate GitHub signature
    const signature = req.headers['x-hub-signature-256'] as string | undefined;
    if (!validateGithubSignature(rawBody, signature)) {
      logger.warn({ path: req.path }, 'Invalid GitHub webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // 2. Only handle push events
    const event = req.headers['x-github-event'];
    if (event !== 'push') {
      return res.status(200).json({ message: `Event '${event}' ignored` });
    }

    // 3. Parse JSON after signature is confirmed
    let payload: any;
    try {
      payload = JSON.parse(rawBody.toString('utf-8'));
    } catch {
      return res.status(400).json({ error: 'Invalid JSON payload' });
    }

    const { ref, repository, head_commit } = payload;

    // 4. Only process pushes to main/master
    if (!SUPPORTED_BRANCHES.includes(ref)) {
      return res
        .status(200)
        .json({ message: `Branch '${ref}' not tracked — ignoring` });
    }

    const repoFullName: string = repository?.full_name;
    const commitSha: string = head_commit?.id;

    if (!repoFullName || !commitSha) {
      return res
        .status(400)
        .json({ error: 'Missing repository.full_name or head_commit.id' });
    }

    // 5. Use server-level GitHub token (Prisma disabled — no per-user token lookup)
    const githubToken = appConfig.github.apiToken;

    if (!githubToken) {
      logger.error(
        { repo: repoFullName },
        'No GitHub token available — cannot process webhook job'
      );
      return res
        .status(500)
        .json({ error: 'Server configuration error: missing GitHub token' });
    }

    // 6. Build job payload and enqueue (idempotent on commit SHA)
    const jobPayload: DocJobPayload = {
      repoFullName,
      branch: ref,
      githubUrl: `https://github.com/${repoFullName}`,
      githubToken,
      userId: 'webhook-user',
      organizationId: null,
      jobId: commitSha,
      triggeredAt: new Date().toISOString(),
    };

    try {
      await enqueueDocJob(jobPayload);
      logger.info(
        { repo: repoFullName, sha: commitSha, branch: ref },
        'Webhook received — doc job enqueued'
      );

      // Return 202 immediately — never block on AI processing
      return res.status(202).json({
        message: 'Documentation job accepted',
        jobId: commitSha,
        repository: repoFullName,
        branch: ref,
      });
    } catch (err) {
      logger.error({ err, repo: repoFullName }, 'Failed to enqueue doc job');
      return res
        .status(500)
        .json({ error: 'Failed to enqueue documentation job' });
    }
  }
);

export default router;
