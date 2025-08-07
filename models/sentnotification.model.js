import pool from '../db/db.connection.js';

class SentNotificationModel{
    table=`sent_notification`;
    async create(params){
        const q=`INSERT INTO ${this.table} (sid,user_id,notification_id,sent_at,sent_to) values ($1,$2,$3,$4,$5) RETURNING *`;
        try{
            //read_date is not given it will be update read_date when is_read gets 
            //read date is timestamp with time zone
            // sent_at is a timestamp with time zone
            const result=await pool.query(q,[params.sid,params.user_id,params.notification_id,params.sent_at,params.sent_to]);
            return result.rows;
        }
        catch(err){
            console.log(err);
            throw err;
        }
    }
    async find(){
        const q = `SELECT * FROM ${this.table}`;
        try {
            const result = await pool.query(q);
            return result.rows;
        } catch (err) {
            console.log(err);
            throw err;
        }
    }

    async findByDate(params){
        const q=`SELECT * FROM ${this.table} WHERE user_id=$1`;
    }

    async findByUserId(params){
        const q=`SELECT * FROM ${this.table} WHERE user_id=$1`;
        try{
            console.log("user_id:"+params.user_id)
            const result=await pool.query(q,[params.user_id]);
            return result.rows;
        }
        catch(err){
            console.log(err);
            throw err;
        }
    }
    
    async findBySID(params){
        const q=`SELECT * FROM ${this.table} WHERE sid=$1`;
        try{
            const result=await pool.query(q,[params.sid]);
            return result.rows;
        }
        catch(err){
            console.log(err);
            throw err;
        }
    }


    async delete(){
        const q=`DELETE FROM ${this.table}`;
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
        const q=`DELETE FROM ${this.table} WHERE sid=$1`;
        try{
            const result=await pool.query(q, [params.sid]);
            return result;
        }
        catch(err){
            console.log(err);
            throw err;
        }
    }

    async UpdateStatus(params){
         const q=`UPDATE ${this.table} SET delivery_status=$2 WHERE sid=$1 `;
        try{
            const result=await pool.query(q, [params.sid,params.status]);
            return result;
        }
        catch(err){
            console.log(err);
            throw err;
        }
    }
    async UpdateStatusAndId(params){
         const q=`UPDATE ${this.table} SET delivery_status=$2,carriersid=$3,read_datetime=$4  WHERE sid=$1 `;
        try{
            
            const result=await pool.query(q, [params.sid,params.status,params.carriersid,params.read_at]);
            return result;
        }
        catch(err){
            console.log(err);
            throw err;
        }
    }
    
}

export default new SentNotificationModel();


