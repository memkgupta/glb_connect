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

// export as