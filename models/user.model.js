import pool from '../db/db.connection.js';
import pool from '../db/db.connection.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
class UserModel{
    //getting the user by email
    table='users'
    async  find(){
        const q='SELECT * FROM users'
        try{
            const result=await pool.query(q);
            return result.rows;

        }
        catch(err){
            console.log(err);
            throw err;
        }

    }
    
    async update(params)
    {
        const q='UPDATE users SET email=$1, password=$2, role=$3 WHERE id=$4 RETURNING *';
        try{
            const result=await pool.query(q,[params.email, params.password, params.role, params.id]);
            return result.rows[0];
        }
        catch(err){
            console.log(err);
            throw err;
        }

    }

    async findUserByEmail(params){
        const q='SELECT * FROM users WHERE email=$1';   
        try{
            const result=await pool.query(q,[params.email])
            return result.rows[0];
        }
        catch(err){
            console.log(err);
            throw err;
        }
    }

   
}

export default UserModel;