import { resend } from "@config/resend";
// import EmailTemplate from "../../emails/VerificationEmail";


export async function sendVerificationEmail(email:string,username:string,verifyCode:string):Promise<any>{
    try {
       await resend.emails.send({
          from: 'campusconnect@mkdev.site',
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