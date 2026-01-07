import type { Response, Request } from "express";
import { registerUser, loginUser} from "../services/auth.js";

export const register = async(req : Request,res : Response) =>{
    const name = req.body.name;
    const email = req.body.email?.toLowerCase().trim();;
    const password = req.body.password;

    if(!name || !email || !password){
        return res.status(400).json({errors:"Missing fields!"});
    }

    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    
    if (!EMAIL_REGEX.test(email)) {
        return res.status(400).json({
            error: "Invalid email format",
        });
    }
    
    try{
        const registeredUser = await registerUser(name,email,password);

        const userId = registeredUser.user_id;
        const userEmail = registeredUser.email;
     
        return res.status(201).json({message:"User created successfully!",user_id:userId, email:userEmail});

    }catch(err:any){
        if(err.message == "EMAIL_EXISTS"){
            return res.status(409).json({msg:"Account with this email already exists!"});
        }
        return res.status(500).json({message:"Internal server error"});
    }
}

export const login = async(req : Request,res : Response) =>{
    const email = req.body.email?.toLowerCase().trim();;
    const password = req.body.password;

    if(!email || !password){
        return res.status(400).json({errors:"Missing fields!"});
    }
    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    
    if (!EMAIL_REGEX.test(email)) {
        return res.status(400).json({
            error: "Invalid email format",
        });
    }
    try{
        const userId = await loginUser(email,password);

        return res.status(200).json({message:"User logged in successfully!",user_id:userId});
    }catch(err:any){
        if(err.message == "INVALID_CREDENTIALS"){
            return res.status(401).json({msg:"wrong username or password. Try again!!!"});
        }
        return res.status(500).json({message:"Internal server error"});
    }
    
}
