import College from "@models/college.model";
import User from "@models/user.model";
import { NextFunction, Request, Response } from "express";
import { v4 as uuidV4 } from "uuid";
import bcrypt from 'bcryptjs'
import { sendVerificationEmail } from "../helpers/mail";
import { InternalServerError } from "@errors/InternalServerError";
import jwt, { JwtPayload } from 'jsonwebtoken'
import { BadRequestError } from "@errors/BadRequestError";
import { UnauthorizedError } from "@errors/UnauthorizedError";
import { NotFoundError } from "@errors/NotFoundError";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "@utils/index";
import { ForbiddenError } from "@errors/ForbiddenError";
import Club from "@models/club/club.model";
export const signUp = async(req:Request,res:Response,next:NextFunction)=> {
    try {
      const { username, email, password, name } = req.body;
  
      // Extract domain from email
      const emailDomain = email.split('@')[1];
  
      // Find college by email domain
      const college = await College.findOne({ emailDomain });
      if (!college) {
        return next(new BadRequestError('Invalid college email id'));
      }
  
      // Check if username is already taken
      const isUsernameTaken = await User.findOne({ username, verified: true });
      if (isUsernameTaken) {
      return next(new BadRequestError('Username already taken'))
      }
  
      // Check if a user already exists with the provided email
      const isUserAlreadyExistsByEmail = await User.findOne({ email, verified: true });
      const uuid = uuidV4();
  
      // Transform UUID into a short OTP (first 6 characters)
      const otp = uuid.replace(/-/g, '').replace(/\D/g, '').slice(0, 6);
  
      if (isUserAlreadyExistsByEmail) {
        if (isUserAlreadyExistsByEmail.verified) {
         res.status(400).json({
            success: false,
            message: 'User already exists with this email',
          });
        } else {
          const hashed = await bcrypt.hash(password, 10);
          const expiryDate = new Date();
          expiryDate.setHours(expiryDate.getHours() + 1);
  
          isUserAlreadyExistsByEmail.otp = otp;
          isUserAlreadyExistsByEmail.password = hashed;
          isUserAlreadyExistsByEmail.otpExpiry = expiryDate;
  
          await isUserAlreadyExistsByEmail.save();
        }
      } else {
        const hashed = await bcrypt.hash(password, 10);
        const expiryDate = new Date();
        expiryDate.setHours(expiryDate.getHours() + 1);
  
        const user = new User({
          name,
          email,
          username,
          lastOtpSent:new Date(),
          password: hashed,
          otp,
          otpExpiry: expiryDate,
          college: college._id,
        });
        
        await user.save();
      }
  
      // Send verification email
      const emailRes = await sendVerificationEmail(email, username, otp);
      if (!emailRes.success) {
        console.error(emailRes);
        return next(new InternalServerError(emailRes.message))
      }
  
     res.status(200).json({
        success: true,
        message: 'User Registered Successfully. Please verify your college email',
      });
    } catch (error) {
      console.error(error);
      return next(new InternalServerError("Some error occured"));
    }
}
export const login = async(req:Request,res:Response,next:NextFunction)=>{
    const { usernameOrEmail, password } = req.body;

    // Input validation
    if (!usernameOrEmail || !password) {
      next(new BadRequestError("Please provide the credentials"));
    }
  
    try {
      // Check if the user exists by email or username
      const user = await User.findOne({$or:[{
        email:usernameOrEmail
      },{username:usernameOrEmail}]});
  
      if (!user) {
        return next(new NotFoundError('User Not Found'));
      }
  
      // Compare password with the hashed password in the database
      const isMatch = await bcrypt.compare(password, user.password);
  
      if (!isMatch) {
        return next(new UnauthorizedError("Invalid Credentials"));
      }
  
      // If the password is correct, create a JWT token
      const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());
    user.refresh_token = refreshToken;
    await user.save();
    res.cookie('refresh_token', refreshToken, { httpOnly: true, secure: true });
      // Send the token in the response
      res.status(200).json({
        success: true,
        message: 'Login successful.',
        user:{email:user.email,name:user.name,username:user.username,verified:user.verified},
        accessToken,refreshToken
      });
    } catch (error) {
      console.error(error);
      return next(new InternalServerError("Some error occured"));
    }
}
export const update = async(req:Request,res:Response,next:NextFunction)=>{

        //@ts-ignore
        const _user = req.user;
    if(!_user){
        return next(new UnauthorizedError("Please Login First"));
    }
    try {
        const {username,name,bio,profile,social_links} = req.body;
        const user = await User.findById(_user.userId);
       
        if(!user){
            return next(new BadRequestError('Bad request'));
        }
if(!user.verified){
    return next(new UnauthorizedError('Please verify your account first'));
}
        if(username){
            user.username = username;
        }
        if(name){
            user.name = name;
        }
        if(bio){
            user.bio = bio;
        }
        if(profile){
            user.profile = profile;
        }
        if(social_links){
       
         const socials:string[] = user.socials;
        
if(socials.find(link=>social_links===link)){
return next(new BadRequestError("Already added"));
}
             user.socials.push(social_links)
        }
        await user.save();
        res.status(200).json({ success:true,message:"Details updated successfully"})
    } catch (error) {
        console.log(error);
        return next(new InternalServerError("Some error occured"));
    }
}
export const verify = async(req:Request,res:Response,next:NextFunction)=>{
    const { username, otp } = req.body;

    // Input validation
    if (!username || !otp) {
      return next(new BadRequestError("Username and OTP are required"));
    }
  
    try {
      // Find the user by username
      const user = await User.findOne({ username });
  
      if (!user) {
        return next(new NotFoundError("User does not exist"));
      }
  
      // Check if the user is already verified
      if (user.verified) {
        return next(new BadRequestError("User already verified"));
      }
  
      // Check if the OTP has expired
      const currentTime = new Date();
      if (user.otpExpiry && user.otpExpiry.getTime() < currentTime.getTime()) {
        return next(new BadRequestError('Verification code expired. Please request a new one.'));
      }
  
      // Validate OTP
      if (otp === user.otp) {
        user.verified = true;
        user.otp = null;  // Clear the OTP after verification
        await user.save();
      res.status(200).json({ success: true, message: 'User verified successfully.' });
      } else {
        return next(new BadRequestError("Invlid OTP"));
      }
    } catch (error) {
      console.error(error);
      return next(new InternalServerError("Some error occured"));
    }
}
export const refreshToken = async(req:Request,res:Response,next:NextFunction)=>{
    const refreshToken = req.headers.authorization?.split(' ')[1];
    // const refreshToken = req.body.token;

    if (!refreshToken) {
       res.status(403).json({ success: false, message: 'Refresh token required' });
       return;
    }
  
    // Verify the refresh token
    const userData = verifyRefreshToken(refreshToken) as JwtPayload;
    
    if (!userData) {
        return next(new ForbiddenError('Invalid or expired refresh token'));
    }
    const user = await User.findOne({refresh_token:refreshToken});
    if(!user){
     return next(new ForbiddenError('Invalid or expired refresh token'));
    }
    // Generate new access token
    const accessToken = generateAccessToken(userData.userId);
  
    res.status(200).json({
      success: true,
      accessToken,  // Send new access token
    });
}
export const resendVerificationToken = async(req:Request,res:Response,next:NextFunction)=>{
    const username = req.query.username;
    const uuid = uuidV4();
  
    // Transform UUID into a short OTP (first 6 characters)
    const otp = uuid.replace(/-/g, '').replace(/\D/g, '').slice(0, 6);

  try {
    const user = await User.findOne({username:username});
    if(!user){
      return next(new BadRequestError("User not registered"));
    }
   let diff = 0;
    if(user.lastOtpSent){
      const prev = new Date(user.lastOtpSent);
      const curr = new Date();
      diff = curr.getTime()-prev.getTime();
      if(diff<(15*60*1000)){
        return next(new ForbiddenError("Already requested otp please wait"))
      }
    }
    const emailRes = await sendVerificationEmail(user.email, user.username, otp);
    if (!emailRes.success) {
      console.error(emailRes);
      return next(new InternalServerError(emailRes.message))
    }
    res.status(200).json({success:true,message:"Verification code sent"});
  } catch (error) {
    console.log(error);
    return next(new InternalServerError("Some error occured"));
  }
}
export const logout = async(req:Request,res:Response,next:NextFunction)=>{
  //@ts-ignore
  const _user = req.user;
   
  try {
   const user = await User.findById(_user.userId);
   if(!user){
    return next(new ForbiddenError("Invalid session please login again"))
   } 
   user.refresh_token = null;
   await user.save();
   res.status(200).json({success:true,message:"Logout successfull"});
  } catch (error) {
    console.error(error);
    return next(new InternalServerError("Some error occured"));
  }
}
export const session = async(req:Request,res:Response,next:NextFunction)=>{
  //@ts-ignore
  const _user = req.user;
  try {
    const user = await User.findById(_user.userId);
    if(!user)
    {
      return next(new ForbiddenError("Invalid session , Please login again"))
    }
    res.status(200).json({ success:true,user:{email:user.email,name:user.name,username:user.username,verified:user.verified}})
  } catch (error) {
    console.error(error);
    return next(new InternalServerError("Some error occured"))
  }
}
export const me = async(req:Request,res:Response,next:NextFunction)=>{
  //@ts-ignore
  const _user = req.user;
  try {
    const user = await User.findById(_user.userId);
    if(!user){
      return next(new ForbiddenError("Invalid session Please login again"))
    }
    const isClubAdmin = await Club.findOne({admin:user._id});
    const resp = {username:user.username,name:user.name,profile:user.profile,bio:user.bio,interest:user.interests,courses:[],events:[],socials:user.socials,isClubAdmin:isClubAdmin?true:false}
 res.status(200).json({success:true,data:resp});
  } catch (error) {
    console.error(error);
    return next(new InternalServerError("Some error occured"));
  }
}
