import {v4 as uuidv4} from 'uuid';
import pool from '../db/db.connection.js';


class NotificationModel{
    table='notification';
    
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
        const q=`INSERT INTO ${this.table} VALUES ($1,$2,$3,$4) RETURNING *`;
        try{
            const result=pool.query(q,[params.notification_id,params.type_id,params.message,params.title]);
            return result.rows;

        }
        catch(err){
            console.log(err);
            throw err;
        }
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
        const q='DELETE FROM notifications WHERE notification_id=$1';
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


export default new NotificationModel();