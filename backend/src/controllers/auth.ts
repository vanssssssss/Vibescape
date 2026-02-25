import type { Response, Request } from "express";
import { registerUser, loginUser, resetPasswordWithToken} from "../services/auth.js";
import { findUserByEmail } from "../db/queries/user.js";
import { generateResetToken,hashToken } from "../utils/token.js";
import { sendResetMail } from "../services/sendMail.js";
import { createPasswordReset } from "../db/queries/passwordReset.js";
import jwt from "jsonwebtoken";


export const register = async(req : Request,res : Response) =>{
    const name = req.body.name;
    const email = req.body.email?.toLowerCase().trim();
    const password = req.body.password;

    console.log("register");

    if(!name || !email || !password){
        return res.status(400).json({message:"Missing fields!"});
    }

    if (!validateEmail(email)) {
        return res.status(400).json({
            message: "Invalid email format",
        });
    }
    
    try{
        const registeredUser = await registerUser(name,email,password);

        const userId = registeredUser.user_id;
        const userEmail = registeredUser.email;

        const token = jwt.sign({id: userId}, process.env.JWT_SECRET_KEY as string , {expiresIn: '2h'});
     
        return res.status(201).json({message:"User created successfully!",user_id:userId, email:userEmail,token});

    }catch(err:any){
        if(err.message == "EMAIL_EXISTS"){
            return res.status(409).json({message:"Account with this email already exists!"});
        }
        return res.status(500).json({message:"Internal server error"});
    }
}

export const login = async(req : Request,res : Response) =>{
    const email = req.body.email?.toLowerCase().trim();
    const password = req.body.password;

    console.log("login");

    if(!email || !password){
        return res.status(400).json({message:"Missing fields!"});
    }
    if (!validateEmail(email)) {
        return res.status(400).json({
            message: "Invalid email format",
        });
    }
    try{
        const userId = await loginUser(email,password);

        const token = jwt.sign({id: userId}, process.env.JWT_SECRET_KEY as string , {expiresIn: '2h'});

        return res.status(200).json({message:"User logged in successfully!",user_id:userId, token});
    }catch(err:any){
        if(err.message == "INVALID_CREDENTIALS"){
            return res.status(401).json({message:"wrong username or password. Try again!!!"});
        }
        return res.status(500).json({message:"Internal server error", error: err});
    }
    
}

export const forgotPassword = async(req : Request, res : Response) => {
    const email = req.body.email?.toLowerCase().trim();

    console.log("forgot password");
    if(!email){
        return res.status(400).json({message:"Missing fields!"});
    }

    if (!validateEmail(email)) {
        return res.status(400).json({
            message: "Invalid email",
        });
    }

    const user = await findUserByEmail(email);
    if(!user){
        return res.status(200).json({message:"If the email exists, a reset link was sent"});
    }

    const rawToken = generateResetToken();
    const tokenHash = hashToken(rawToken);
    await createPasswordReset(user.user_id,tokenHash);

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}`;

    try{
        await sendResetMail(email, resetUrl);
    }catch(err:any){
        console.error("Reset email failed", err.message);
    }
    return res.status(200).json({"msg": "If the email exists, a reset link was sent."});
}

export const resetPassword = async(req : Request, res : Response) => {
    const { token, newPassword } = req.body;

    console.log("reset password");
    if (!token || !newPassword) {
        return res.status(400).json({ message: "Missing fields" });
   }

   const success = await resetPasswordWithToken(token, newPassword);

    if (!success) {
        return res.status(400).json({ message: "Invalid or expired token" });
    }
    return res.status(200).json({message: "Password reset successful"});
}

const validateEmail = (email:string)=>{
    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    return EMAIL_REGEX.test(email)
}