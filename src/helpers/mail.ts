import { resend } from "@config/resend";
// import EmailTemplate from "../../emails/VerificationEmail";


export async function sendVerificationEmail(email:string,username:string,verifyCode:string):Promise<any>{
    try {
       await resend.emails.send({
          from: 'glbconnect@mkdev.site',
          to: email,
          subject: 'Verification',
          html: `<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Template</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="email-template">
    <h1>Verification OTP, <span class="otp">${verifyCode}</span>!</h1>
  </div>
</body>
</html>`,
        });
    
        
    
        return {success:true,message:"Verification Code sent to your college email id"};
      } catch (error) {
        return {success:false,message:"Failed to send email"}
      }
}
export async function sendEventRegistrationEmail(email:string,username:string,event:{eventName:string,eventDate:Date,venue:string})
{
  try {
    await resend.emails.send({
      from:'glbconnect@mkdev.site',
      to:email,
      subject:`Successfull registration for ${event.eventName}`,
      html:`
      <!DOCTYPE html>
<html>
<head>
    <title>Successful Event Registration</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f9f9f9;
        }
        .email-container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background-color: #007bff;
            color: #ffffff;
            text-align: center;
            padding: 20px;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .content {
            padding: 20px;
        }
        .content p {
            margin: 0 0 15px;
            line-height: 1.6;
            color: #333333;
        }
        .content .event-details {
            margin: 20px 0;
            padding: 15px;
            background-color: #f1f1f1;
            border-radius: 6px;
        }
        .content .event-details h3 {
            margin: 0 0 10px;
            font-size: 18px;
            color: #007bff;
        }
        .content .event-details p {
            margin: 5px 0;
        }
        .footer {
            background-color: #f1f1f1;
            text-align: center;
            padding: 10px;
            font-size: 14px;
            color: #666666;
        }
        .footer a {
            color: #007bff;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>Registration Confirmed!</h1>
        </div>
        <div class="content">
            <p>Dear [Recipient's Name],</p>
            <p>We are excited to confirm your registration for <strong>${event.eventName}</strong>. Thank you for joining us!</p>
            <div class="event-details">
                <h3>Event Details:</h3>
                <p><strong>Date:</strong> ${event.eventDate}</p>
                <p><strong>Time:</strong> </p>
                <p><strong>Location:</strong> ${event.venue}</p>
            </div>
            <p>We look forward to seeing you there. If you have any questions, feel free to reply to this email or contact us at <a href="mailto:[support-email@example.com]">[support-email@example.com]</a>.</p>
            <p>Thank you,<br>The ${event.eventName} Team</p>
        </div>
        
    </div>
</body>
</html>

      `
    })
  } catch (error) {
    console.error(error);
    return {success:false,message:"Failed to send email"}
  }
}
export async function sendNewTeamMemberMail(email:string,memberName:string,teamname:string,event:{eventName:string,eventDate:Date,venue:string})
{
  try {
    await resend.emails.send({
      from:'glbconnect@mkdev.site',
      to:email,
      subject:`New Team member`,
      html:`
      <!DOCTYPE html>
<html>
<head>
    <title>You have a new team member</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f9f9f9;
        }
        .email-container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background-color: #007bff;
            color: #ffffff;
            text-align: center;
            padding: 20px;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .content {
            padding: 20px;
        }
        .content p {
            margin: 0 0 15px;
            line-height: 1.6;
            color: #333333;
        }
        .content .event-details {
            margin: 20px 0;
            padding: 15px;
            background-color: #f1f1f1;
            border-radius: 6px;
        }
        .content .event-details h3 {
            margin: 0 0 10px;
            font-size: 18px;
            color: #007bff;
        }
        .content .event-details p {
            margin: 5px 0;
        }
        .footer {
            background-color: #f1f1f1;
            text-align: center;
            padding: 10px;
            font-size: 14px;
            color: #666666;
        }
        .footer a {
            color: #007bff;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>Registration Confirmed!</h1>
        </div>
        <div class="content">
            <p>Dear [Recipient's Name],</p>
            <p>${memberName} has joined your team ${teamname} <strong>${event.eventName}</strong>. Thank you for joining us!</p>
            <div class="event-details">
                <h3>Event Details:</h3>
                <p><strong>Date:</strong> ${event.eventDate}</p>
                <p><strong>Time:</strong> </p>
                <p><strong>Location:</strong> ${event.venue}</p>
            </div>
            <p>We look forward to seeing you there. If you have any questions, feel free to reply to this email or contact us at <a href="mailto:[support-email@example.com]">[support-email@example.com]</a>.</p>
            <p>Thank you,<br>The ${event.eventName} Team</p>
        </div>
        
    </div>
</body>
</html>

      `
    })
  } catch (error) {
    console.error(error);
    return {success:false,message:"Failed to send email"}
  }
}
export async function sendUserBannedEmail(email:string,username:string,reason:string):Promise<any>{
    try {
       await resend.emails.send({
          from: 'glbconnect@mkdev.site',
          to: email,
          subject: 'You are Banned From Campus Connect',
          html: `<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Banned From campus connect</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="email-template">
    <h1>You are banned from campus connect because , <span class="otp">${reason}</span>!</h1>
  </div>
</body>
</html>`,
        });
    
        
    
        return {success:true};
      } catch (error) {
        return {success:false,message:"Failed to send email"}
      }
}
export async function sendPasswordResetEmail(email: string, username: string, resetToken: string, userId: string): Promise<any> {
  try {
    const resetUrl = `${process.env.FRONTEND!}/auth/reset-password?token=${resetToken}&id=${userId}`;

    await resend.emails.send({
      from: 'glbconnect@mkdev.site',
      to: email,
      subject: 'Reset Your Password - Campus Connect',
      html: `
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset</title>
        </head>
        <body style="font-family: Arial, sans-serif; background-color: #0f172a; color: #ffffff; padding: 2rem;">
          <div style="max-width: 600px; margin: auto; background-color: #1e293b; border-radius: 8px; padding: 2rem; border: 1px solid #3b82f6;">
            <h2 style="color: #facc15;">Hi ${username},</h2>
            <p>You recently requested to reset your password for your Campus Connect account.</p>
            <p>Click the button below to reset it. <strong>This link will expire in 15 minutes.</strong></p>
            <a href="${resetUrl}" style="display: inline-block; margin-top: 1rem; padding: 10px 20px; background-color: #3b82f6; color: #fff; text-decoration: none; border-radius: 5px;">
              Reset Password
            </a>
            <p style="margin-top: 2rem;">If you did not request a password reset, please ignore this email or contact support.</p>
            <hr style="border: 1px solid #334155; margin-top: 2rem;">
            <p style="font-size: 0.8rem; color: #94a3b8;">Campus Connect | GLBITM</p>
          </div>
        </body>
      </html>
      `,
    });

    return { success: true };
  } catch (error) {
    return { success: false, message: "Failed to send reset password email" };
  }
}
