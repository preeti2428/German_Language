import { Request, Response } from 'express';
import crypto from 'crypto';
import User from '../models/User';

/**
 * Forgot-password flow.
 *
 * POST /api/auth/forgot { email }  → emails a 15-minute reset link.
 * POST /api/auth/reset  { email, token, password } → sets the new password.
 *
 * Email goes out via Gmail SMTP when SMTP_USER/SMTP_PASS are set (a Gmail
 * App Password — free). Without SMTP config the reset link is printed to the
 * server console instead, so the flow still works in development.
 * The response is identical whether or not the email exists, so the endpoint
 * can't be used to probe which addresses are registered.
 */

const RESET_TTL_MS = 15 * 60 * 1000;

async function sendResetEmail(to: string, link: string): Promise<boolean> {
  const userEnv = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!userEnv || !pass) {
    console.log(`[forgot-password] SMTP not configured. Reset link for ${to}:\n  ${link}`);
    return true;
  }
  try {
    // Lazy require: nodemailer is only needed when SMTP is configured.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: userEnv, pass },
    });
    await transporter.sendMail({
      from: `"German with Jai" <${userEnv}>`,
      to,
      subject: 'Reset your password',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
          <h2 style="color:#26408B">Reset your password</h2>
          <p>Someone (hopefully you) asked to reset the password for this account on German with Jai.</p>
          <p style="margin:24px 0">
            <a href="${link}" style="background:#4361EE;color:#fff;padding:14px 24px;border-radius:12px;text-decoration:none;font-weight:bold">
              Choose a new password
            </a>
          </p>
          <p style="color:#8A94A2;font-size:13px">This link works for 15 minutes. If you didn't ask for this, you can ignore this email — nothing changes.</p>
        </div>`,
    });
    return true;
  } catch (err) {
    console.error('[forgot-password] email send failed:', (err as Error).message);
    return false;
  }
}

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const email = String(req.body?.email ?? '').trim().toLowerCase();
    // Always the same answer — no account probing.
    const done = () =>
      res.json({ message: 'If that email is registered, a reset link is on its way. Check your inbox (and spam).' });

    if (!email) {
      done();
      return;
    }
    const user = await User.findOne({ email });
    if (!user) {
      done();
      return;
    }

    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
    user.resetPasswordExpires = new Date(Date.now() + RESET_TTL_MS);
    await user.save();

    const base = process.env.FRONTEND_URL || 'http://localhost:3000';
    const link = `${base}/auth/reset?token=${token}&email=${encodeURIComponent(email)}`;
    await sendResetEmail(email, link);
    done();
  } catch (error) {
    console.error('forgotPassword failed:', (error as Error).message);
    res.status(500).json({ message: 'Something went wrong. Try again.' });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const email = String(req.body?.email ?? '').trim().toLowerCase();
    const token = String(req.body?.token ?? '');
    const password = String(req.body?.password ?? '');

    if (!email || !token || password.length < 6) {
      res.status(400).json({ message: 'Password must be at least 6 characters.' });
      return;
    }

    const hashed = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      email,
      resetPasswordToken: hashed,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      res.status(400).json({ message: 'This reset link is invalid or has expired. Request a new one.' });
      return;
    }

    user.password = password; // pre-save hook hashes it
    user.set('resetPasswordToken', undefined);
    user.set('resetPasswordExpires', undefined);
    await user.save();

    res.json({ message: 'Password updated! You can sign in now.' });
  } catch (error) {
    console.error('resetPassword failed:', (error as Error).message);
    res.status(500).json({ message: 'Something went wrong. Try again.' });
  }
};
