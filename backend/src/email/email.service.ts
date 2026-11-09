
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_APP_PASSWORD?.replace(/\s/g, ''),
    },
  });

  async sendOtpEmail(to: string, otp: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: {
          name: 'Centyzz Hair & Beauty Salon',
          address: process.env.SMTP_USER!,
        },
        to,
        subject: 'Your Centyzz Email Verification Code',
        text: `Your Centyzz verification code is ${otp}. It expires in 5 minutes. If you did not request this code, you can ignore this email.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto;">
            <h2>Centyzz Email Verification</h2>
            <p>Use the following code to verify your email address:</p>
            <div style="font-size: 30px; font-weight: bold; letter-spacing: 8px;">
              ${otp}
            </div>
            <p>This code expires in 5 minutes.</p>
            <p>If you did not request this code, you can ignore this email.</p>
          </div>
        `,
      });
    } catch (error) {
      console.error(
        'Failed to send verification email:',
        error instanceof Error ? error.message : 'Unknown error',
      );

      throw new InternalServerErrorException(
        'Unable to send verification email. Please try again later.',
      );
    }
  }

  async sendPasswordResetOtpEmail(to: string, otp: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: {
          name: 'Centyzz Hair & Beauty Salon',
          address: process.env.SMTP_USER!,
        },
        to,
        subject: 'Centyzz Password Reset OTP',
        text: `Your Centyzz password reset OTP is ${otp}. It expires in 15 minutes. If you did not request this, please ignore this email.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto;">
            <h2>Centyzz Password Reset</h2>
            <p>Use the following OTP code to reset your password:</p>
            <div style="font-size: 30px; font-weight: bold; letter-spacing: 8px; color: #d97706;">
              ${otp}
            </div>
            <p>This code expires in 15 minutes.</p>
            <p>If you did not request this password reset, you can safely ignore this email.</p>
          </div>
        `,
      });
    } catch (error) {
      console.error(
        'Failed to send password reset email:',
        error instanceof Error ? error.message : 'Unknown error',
      );

      throw new InternalServerErrorException(
        'Unable to send password reset email. Please try again later.',
      );
    }
  }
  async sendCredentialResetLinkEmail(to: string, kind: 'password' | 'pin', link: string): Promise<void> {
    const label = kind === 'pin' ? 'PIN' : 'password';
    const safeLink = link.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    try {
      const result = await this.transporter.sendMail({
        from: { name: 'Centyzz Hair & Beauty Salon', address: process.env.SMTP_USER! }, to,
        subject: `Centyzz — reset your ${label}`,
        text: `An administrator requested a ${label} reset for your Centyzz account. Open this link to choose your new ${label}: ${link}\nThis link expires in 15 minutes and works once. If you did not expect this email, do not use the link and contact your administrator. Your credentials have not changed.`,
        html: `<div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;color:#2A1E1B"><h2>Centyzz ${label} reset</h2><p>An administrator requested a reset for your account. Choose your own new ${label} using the button below.</p><p><a href="${safeLink}" style="display:inline-block;padding:14px 22px;background:#8B5E3C;color:white;border-radius:8px;text-decoration:none">Reset my ${label}</a></p><p>This link expires in <strong>15 minutes</strong> and works once.</p><p>If the button does not work, copy this link into your browser:</p><p style="word-break:break-all">${safeLink}</p><p>If you did not expect this email, do not use the link and contact your administrator. Your credentials have not changed.</p></div>`,
      });
      if (!result.accepted?.length) throw new Error('Recipient not accepted');
    } catch {
      throw new InternalServerErrorException('Unable to send the reset email. Please try again later.');
    }
  }

  async sendCredentialChangedEmail(to: string, kind: 'password' | 'pin'): Promise<void> {
    const label = kind === 'pin' ? 'PIN' : 'password';
    await this.transporter.sendMail({
      from: { name: 'Centyzz Hair & Beauty Salon', address: process.env.SMTP_USER! }, to,
      subject: `Centyzz — your ${label} was changed`,
      text: `Your Centyzz ${label} was successfully reset. Existing Admin/Staff sessions have been signed out. If you did not make this change, contact your administrator immediately.`,
    });
  }

}
