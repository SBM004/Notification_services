import pool from `../db/db.connection.js`;


class SentNotificationModel{
    table=`sent_notifications`;
    async create(params){
        q=`INSERT INTO ${this.table} (sid,user_id,notification_id,read_date,sent_at,sent_to) values ($1,$2,$3,$4,$5,$6) RETURNING *`;
        try{
            const result=await pool.query(q,[params.sid,params.user_id,params.notification_id,params.read_date,params.sent_at,params.sent_to]);
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
        } catch (err) {2
            console.log(err);
            throw err;
        }
    }

    async findByUserId(params){
        const q=`SELECT * FROM ${this.table} WHERE user_id=$1`;
        try{
            const result=await pool.query(q.params.userId);
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
        const q=`DELETE FROM ${this.table} WHERE id=$1`;
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


