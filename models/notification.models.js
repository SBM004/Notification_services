import {v4 as uuidv4} from 'uuid';
import pool from '../db/db.connection.js';


class NotificationModel{
    table='notifications';
    
    async find(){
        const q = 'SELECT * FROM notifications';
        try {
            const result = await pool.query(q);
            return result.rows;
        } catch (err) {
            console.log(err);
            throw err;
        }
    }

    
    async create(params){
        const q=''
    }
    async delete(){
        const q='DELETE FROM notifications';
        try{
            const result=await pool.query(q);
            return result;
        }
        catch(err){
            console.log(err);
            throw err;

        }
    }

    async deleteById(params){
        const q='DELETE FROM notifications WHERE id=$1';
        try{
            const result=await pool.query(q, [params.id]);
            return result;
        }
        catch(err){
            console.log(err);
            throw err;
        }
    }

}