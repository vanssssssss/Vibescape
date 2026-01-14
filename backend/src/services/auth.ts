import {hashPassword,comparePassword} from "../utils/password.js";
import { createUser,findUserByEmail } from "../db/queries/user.js";

export async function registerUser(name: string,
 email: string,password: string){
    const hashed_pwd = await hashPassword(password);
    try{
        const user = await createUser(name,email,hashed_pwd);
        return {
            user_id: user.user_id,
            email: user.email,
        };
    }catch(err:any){
        if(err.code == "23505"){
            throw new Error("EMAIL_EXISTS");
        }
        throw err;
    }
}

export async function loginUser(email: string,password: string){
    const user = await findUserByEmail(email);
    if(!user){
        throw new Error("INVALID_CREDENTIALS");
    }

    const isValid = await comparePassword(password,user.password);

    if(!isValid){
        throw new Error("INVALID_CREDENTIALS");
    }

    return user.user_id;
}