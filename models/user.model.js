import pool from '../db/db.connection.js';
import {multipleColumnSet,multipleColumnSetDetailed,multipleColumncommon} from '../utils/common.utils.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';


class UserModel{
    //getting the user by email
    table='users'

    async create(params){
        const {columns,placeholders,values}=multipleColumncommon(params)
        const q=`INSERT INTO ${this.table} (${columns}) values (${placeholders})  RETURNING *`;
        try{
            const result=pool.query(q,values);
            return result;
        }
        catch(err){
            console.log("create",err);
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


      // NEW: Find with pagination
    async findPaginated(limit, offset) {
        const q = `SELECT * FROM ${this.table} ORDER BY name ASC LIMIT $1 OFFSET $2`;
        try {
            const result = await pool.query(q, [limit, offset]);
            return result.rows;
        } catch (err) {
            console.log(err);
            throw err;
        }
    }

    // NEW: Count all records
    async countAll() {
        const q = `SELECT COUNT(*) AS total FROM ${this.table}`;
        try {
            const result = await pool.query(q);
            return parseInt(result.rows[0].total);
        } catch (err) {
            console.log(err);
            throw err;
        }
    }

    
    // async updateByEmail(body,email)
    // {
    //     const {column,values}=multipleColumnSet(body)
    //     const q=`UPDATE ${this.table} SET ${column} WHERE email=${email} RETURNING *`;
    //     try{
    //         const result=await pool.query(q,values);
    //         return result.rows[0];
    //     }
    //     catch(err){
    //         console.log(err);
    //         throw err;
    //     }

    // }

        async updateByEmail(body, email) {
            const { column, values } = multipleColumnSetDetailed(body);
            
            // Add email as a parameter
            // values.push(email);
            // const emailParam = values.length;
            
            // Use parameter placeholder
            const q = `UPDATE ${this.table} SET ${column} WHERE email='${email}' RETURNING *`;
            try{

                const result = await pool.query(q, values);
                console.log(result.rows[0]);
                return result.rows[0];
            }
            catch(err){
                console.log('in updateByEmail')
                throw err;
            }
        }
    async update(body,id)
    {
        const {column,values}=multipleColumnSetDetailed(body)
        const q=`UPDATE ${this.table} SET ${column} WHERE id=${id} RETURNING *`;
        try{
            const result=await pool.query(q,values);
            return result.rows[0];
        }
        catch(err){
            console.log(err);
            throw err;
        }

    }

    // async findUserByEmail(params){
    //     const q='SELECT * FROM users WHERE email=$1';   
    //     try{
    //         const result=await pool.query(q,[params.email]);
    //         console.log(result.rows);
    //         return result.rows[0];
    //     }
    //     catch(err){
    //         console.log(err);
    //         throw err;
    //     }
    // }
    async findUserByEmail(params){
        const q='SELECT * FROM users WHERE email=$1';   
        try{
            const result=await pool.query(q,[params.email]);
            console.log(result.rows);
            return result.rows[0];
        }
        catch(err){
            console.log(err);
            throw err;
        }
    }
    async findUserById(params){
        const q='SELECT * FROM users WHERE user_id=$1';   
        try{
            const result=await pool.query(q,[params.user_id]);
            console.log(result.rows);
            return result.rows[0];
        }
        catch(err){
            console.log(err);
            throw err;
        }
    }

   
}

export default new UserModel();