
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
}
