import pool from `../db/db.connection.js`;


class SentNotificationModel{
    table=`sent_notifications`;

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


