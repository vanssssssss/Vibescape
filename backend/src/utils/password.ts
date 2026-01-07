import bcrypt from "bcrypt";

export async function hashPassword(password: string){
    return await bcrypt.hash(password,12);
}

export async function comparePassword(password: string,existingPassword:string){
    return await bcrypt.compare(password,existingPassword);
}