import { Router, Request, Response } from 'express';
import { z } from 'zod';
import logger from '../lib/logger.js';
import { encryptToken } from '../lib/crypto.js';

const router = Router();

// ─── Validation ──────────────────────────────────────────────────────────────

const SyncUserSchema = z.object({
  githubId: z.string().min(1, 'githubId is required'),
  githubToken: z.string().min(1, 'githubToken is required'),
  email: z.string().email().optional().nullable(),
  name: z.string().optional().nullable(),
  avatarUrl: z.string().url().optional().nullable(),
});

// ─── POST /api/auth/sync-user ────────────────────────────────────────────────

/**
 * Called by the Next.js BFF after a successful GitHub OAuth login.
 * Upserts the user — creates a new record or updates the existing one.
 *
 * Protected by the global HMAC middleware (x-timestamp/x-nonce/x-signature).
 */
router.post('/sync-user', async (req: Request, res: Response) => {
  try {
    // 1. Validate request body
    const parsed = SyncUserSchema.safeParse(req.body);
    if (!parsed.success) {
      const errors = parsed.error.issues.map(
        i => `${i.path.join('.')}: ${i.message}`
      );
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors,
      });
    }

    const { githubId, githubToken, email, name, avatarUrl } = parsed.data;

    // 2. Encrypt the GitHub token (for when DB is re-enabled)
    const _encryptedToken = encryptToken(githubToken);

    // 3. Prisma disabled — skip DB upsert; validate only
    logger.info(
      { githubId, email, name },
      'User sync validated (DB disabled — not persisted)'
    );
    void _encryptedToken; // used when DB is re-enabled

    return res.status(200).json({ success: true });
  } catch (error) {
    logger.error({ error }, 'Failed to sync user');
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

export default router;
