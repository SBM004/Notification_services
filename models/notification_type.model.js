import pool from '../db/db.connection.js';


class NotificationTypeModel {
    table='notification_type'

    async find(){
        const q= `SELECT * FROM ${this.table}`;
        try{
            const result = await pool.query(q);
            return result.rows;
        }
        catch(err){
            console.log(err);
            throw err;
        }
    }

    async create(params){
        const q=`INSERT INTO ${this.table} VALUES ($1,$2,$3)`;
        try{
            const result=await pool.query(q,[params.type_id,params.type,params.carrier]);
            return result.rows;

        }
        catch(err){
            console.log(err);
            throw err;

        }
    }

    async findByTypeCarrier(params){
        const q=`SELECT * FROM ${this.table} WHERE type=$1 AND carrier=$2`;
        try{
            const result=await  pool.query(q,[params.type,params.carrier]);
            return result.rows
        }
        catch(err){
            comsole.log(err);
            throw err;
        }
    }

}

export default new NotificationTypeModel();