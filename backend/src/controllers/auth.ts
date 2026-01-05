import type { Response, Request } from "express"

export const register = async(req : Request,res : Response) =>{
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;

    if(!name || !email || !password){
        return res.status(400).json({errors:"Missing fields!"});
    }

    const user_id = 1;
    res.status(201).json({message:"User created successfully!",user_id:user_id});
}

export const login = async(req : Request,res : Response) =>{
    const email = req.body.email;
    const password = req.body.password;

    if(!email || !password){
        return res.status(400).json({errors:"Missing fields!"});
    }

    const user_id = 1;
    res.status(200).json({message:"User logged in successfully!",user_id:user_id});
}