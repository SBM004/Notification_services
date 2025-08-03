import pool from '../db/db.connection.js';

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
class UserModel{
    //getting the user by email
    table='users'

    async create(params){
        const q=`INSERT INTO ${this.table} (user_id,name,email,role,password) values ($1,$2,$3,$4,$5) RETURNING *`;
        try{
            const result=pool.query(q,[params.userId,params.name,params.email,params.role,params.password]);
            return result;
        }
        catch(err){
            console.log(err);
            throw err;
        }
    }
    async  find(){
        const q=`SELECT * FROM ${this.table}`
        try{
            const result=await pool.query(q);
            // console.log(result.rows)
            return result.rows;

        }
        catch(err){
            console.log(err);
            throw err;
        }

    }
    
    async update(params)
    {
        const q=`UPDATE ${this.table} SET email=$1, password=$2, role=$3 WHERE id=$4 RETURNING *`;
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
            const result=await pool.query(q,[params.email]);
            console.log(result.rows);
            return result.rows;
        }
        catch(err){
            console.log(err);
            throw err;
        }
    }

   
}

export default new UserModel();