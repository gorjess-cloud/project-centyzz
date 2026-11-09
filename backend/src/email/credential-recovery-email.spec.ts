import { EmailService } from './email.service.js';
const {sendMail}=vi.hoisted(()=>({sendMail:vi.fn()}));
vi.mock('nodemailer',()=>({default:{createTransport:()=>({sendMail})}}));
describe('Credential recovery email',()=>{
  beforeEach(()=>{vi.clearAllMocks();sendMail.mockResolvedValue({accepted:['recipient@example.invalid']});});
  it.each(['password','pin'] as const)('sends a clear %s reset link with expiry and no credential',async kind=>{
    const link=`http://localhost:5173/#/recover/${kind}?token=${'a'.repeat(43)}`;
    await new EmailService().sendCredentialResetLinkEmail('recipient@example.invalid',kind,link);
    const message=sendMail.mock.calls[0][0];
    expect(message.to).toBe('recipient@example.invalid');
    expect(message.text).toContain(link);expect(message.text).toContain('15 minutes');
    expect(message.html).toContain(`href="${link}"`);
    expect(message.html).toContain(kind==='pin'?'Reset my PIN':'Reset my password');
  });
  it('does not claim success for a rejected recipient',async()=>{
    sendMail.mockResolvedValue({accepted:[],rejected:['recipient@example.invalid']});
    await expect(new EmailService().sendCredentialResetLinkEmail('recipient@example.invalid','password','https://salon.example/')).rejects.toThrow('Unable to send');
  });
  it('does not expose SMTP error details to the caller',async()=>{
    sendMail.mockRejectedValue(Error('secret-smtp-password'));
    await expect(new EmailService().sendCredentialResetLinkEmail('recipient@example.invalid','pin','https://salon.example/')).rejects.toThrow('Unable to send the reset email. Please try again later.');
  });
  it('sends a change notification without a new password or token',async()=>{
    await new EmailService().sendCredentialChangedEmail('recipient@example.invalid','password');
    const message=sendMail.mock.calls[0][0];
    expect(message.text).toContain('successfully reset');expect(message.text).not.toMatch(/token=|new password is/i);
  });
});
