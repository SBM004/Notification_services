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
    /* old function
    async find(){
        const q = `SELECT * FROM ${this.table}`;
        try {
            const result = await pool.query(q);
            return result.rows;
        } catch (err) {
            console.log(err);
            throw err;
        }
    }*/

    async find({ limit, offset } = {}) {
        let q = `SELECT * FROM ${this.table} ORDER BY sent_at DESC`;
        const params = [];

        if (limit) {
            params.push(limit);
            q += ` LIMIT $${params.length}`;
        }
        if (offset) {
            params.push(offset);
            q += ` OFFSET $${params.length}`;
        }

        try {
            const result = await pool.query(q, params);
            return result.rows;
        } catch (err) {
            console.log(err);
            throw err;
        }
    }

/* old function
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
*/

    async findByUserId({ user_id, limit, offset }) {
        let q = `SELECT * FROM ${this.table} WHERE user_id = $1 ORDER BY sent_at DESC`;
        const params = [user_id];

        if (limit) {
            params.push(limit);
            q += ` LIMIT $${params.length}`;
        }
        if (offset) {
            params.push(offset);
            q += ` OFFSET $${params.length}`;
        }

        try {
            const result = await pool.query(q, params);
            return result.rows;
        } catch (err) {
            console.log(err);
            throw err;
        }
    }


    async findByCarrierSID(params){
        const q=`SELECT * FROM ${this.table} WHERE carriersid=$1`;
        try{
            console.log("user_id:"+params.carrierSID)
            const result=await pool.query(q,[params.carrierSID]);
            return result.rows[0];
        }
        catch(err){
            console.log(err);
            throw err;
        }
    }
    
    async findByMessageId(params){
        const q=`SELECT * FROM ${this.table} WHERE message_id=$1`;
        try{
            // console.log("user_id:"+params.carrierSID)
            const result=await pool.query(q,[params.message_id]);
            return result.rows[0];
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
         const q=`UPDATE ${this.table} SET delivery_status=$2,read_datetime=$3,is_read=$4 WHERE message_id=$1 `;
        try{
            const result=await pool.query(q, [params.message_id,params.status,params.read_at,params.is_read]);
            return result;
        }
        catch(err){
            console.log(err);
            throw err;
        }
    }
    async UpdateStatusAndId(params){
         const q=`UPDATE ${this.table} SET delivery_status=$2,
         carriersid=$3,read_datetime=$4,message_id=$5  WHERE sid=$1 `;
        try{
            
            const result=await pool.query(q, [params.sid,params.status,params.carriersid,params.read_at,params.message_id]);
            return result;
        }
        catch(err){
            console.log(err);
            throw err;
        }
    }


    // Add these methods to your SentNotificationModel class

// Complete the findByDate method that was incomplete in your original model
/* old function
async findByDate() {
    const q = `SELECT * FROM ${this.table} 
               WHERE user_id = $1 
               AND DATE(sent_at) = $2::date
               ORDER BY sent_at DESC`;
    try {
        const result = await pool.query(q, [params.user_id, params.date]);
        return result.rows;
    } catch (err) {
        console.log(err);
        throw err;
    }
*/

async findByDate({user_id,date,limit,offset}) {
    let q = `SELECT * FROM ${this.table} 
               WHERE user_id = $1 
               AND DATE(sent_at) = $2::date
               ORDER BY sent_at DESC`;
    
    const params=[user_id,date];

    if(limit){
        params.push(limit);
        q+=` LIMIT $${params.length}`;
    }

    if(offset){
        params.push(offset);
        q += ` OFFSET $${params.length}`;

    }

    try {
        const result = await pool.query(q, params);
        return result.rows;
    } catch (err) {
        console.log(err);
        throw err;
    }
}

/*
// Admin method: Get all notifications with optional filters
async findAllWithFilters(params) {
    let q = `SELECT * FROM ${this.table} WHERE 1=1`;
    const queryParams = [];
    let paramCount = 0;
    
    // Build dynamic query based on provided filters
    if (params.carrier) {
        paramCount++;
        q += ` AND carrier = ${paramCount}`;
        queryParams.push(params.carrier);
    }
    
    if (params.delivery_status) {
        paramCount++;
        q += ` AND delivery_status = ${paramCount}`;
        queryParams.push(params.delivery_status);
    }
    
    if (params.date) {
        paramCount++;
        q += ` AND DATE(sent_at) = ${paramCount}::date`;
        queryParams.push(params.date);
    }
    
    q += ` ORDER BY sent_at DESC`;
    
    // Add pagination
    if (params.limit) {
        paramCount++;
        q += ` LIMIT ${paramCount}`;
        queryParams.push(params.limit);
    }
    
    if (params.offset) {
        paramCount++;
        q += ` OFFSET ${paramCount}`;
        queryParams.push(params.offset);
    }
    
    try {
        const result = await pool.query(q, queryParams);
        return result.rows;
    } catch (err) {
        console.log(err);
        throw err;
    }
}
    */
   
// Admin method: Get all notifications with optional filters
 async findAllWithFilters({ carrier, delivery_status, date, limit, offset }) {
        let q = `SELECT * FROM ${this.table} WHERE 1=1`;
        const params = [];

        if (carrier) {
            params.push(carrier);
            q += ` AND carrier = $${params.length}`;
        }
        if (delivery_status) {
            params.push(delivery_status);
            q += ` AND delivery_status = $${params.length}`;
        }
        if (date) {
            params.push(date);
            q += ` AND DATE(sent_at) = $${params.length}::date`;
        }

        q += ` ORDER BY sent_at DESC`;

        if (limit) {
            params.push(limit);
            q += ` LIMIT $${params.length}`;
        }
        if (offset) {
            params.push(offset);
            q += ` OFFSET $${params.length}`;
        }

        try {
            const result = await pool.query(q, params);
            return result.rows;
        } catch (err) {
            console.log(err);
            throw err;
        }
    }

// ADMIN MODEL METHODS - No user_id filtering

// Admin: Get all notifications (no user filtering)
async findAll() {
    const q = `SELECT * FROM ${this.table} ORDER BY sent_at DESC`;
    try {
        const result = await pool.query(q);
        return result.rows;
    } catch (err) {
        console.log(err);
        throw err;
    }
}

// Admin: Find notifications by date range (all users or specific user)
async adminFindByDateRange(params) {
    let q, queryParams;
    
    if (params.user_id) {
        // Filter by specific user
        q = `SELECT * FROM ${this.table} 
             WHERE user_id = $1 
             AND sent_at >= $2::date 
             AND sent_at < $3::date + INTERVAL '1 day'
             ORDER BY sent_at DESC`;
        queryParams = [params.user_id, params.start_date, params.end_date];
    } else {
        // All users
        q = `SELECT * FROM ${this.table} 
             WHERE sent_at >= $1::date 
             AND sent_at < $2::date + INTERVAL '1 day'
             ORDER BY sent_at DESC`;
        queryParams = [params.start_date, params.end_date];
    }
    
    try {
        const result = await pool.query(q, queryParams);
        return result.rows;
    } catch (err) {
        console.log(err);
        throw err;
    }
}

// Admin: Find notifications with multiple filters
/*async adminFindWithFilters(params) {
    let q = `SELECT * FROM ${this.table} WHERE 1=1`;
    const queryParams = [];
    let paramCount = 0;
    
    // Build dynamic query based on provided filters
    if (params.user_id) {
        paramCount++;
        q += ` AND user_id = ${paramCount}`;
        queryParams.push(params.user_id);
    }
    
    if (params.carrier) {
        paramCount++;
        q += ` AND carrier = ${paramCount}`;
        queryParams.push(params.carrier);
    }
    
    if (params.delivery_status) {
        paramCount++;
        q += ` AND delivery_status = ${paramCount}`;
        queryParams.push(params.delivery_status);
    }
    
    if (params.date) {
        paramCount++;
        q += ` AND DATE(sent_at) = ${paramCount}::date`;
        queryParams.push(params.date);
    }
    
    q += ` ORDER BY sent_at DESC`;
    
    // Add pagination
    if (params.limit) {
        paramCount++;
        q += ` LIMIT ${paramCount}`;
        queryParams.push(params.limit);
    }
    
    if (params.offset) {
        paramCount++;
        q += ` OFFSET ${paramCount}`;
        queryParams.push(params.offset);
    }
    
    try {
        const result = await pool.query(q, queryParams);
        return result.rows;
    } catch (err) {
        console.log(err);
        throw err;
    }
}
*/

// Admin: Find notifications with multiple filters
async adminFindWithFilters({ user_id, carrier, delivery_status, date, limit, offset }) {
        let q = `SELECT * FROM ${this.table} WHERE 1=1`;
        const params = [];

        if (user_id) {
            params.push(user_id);
            q += ` AND user_id = $${params.length}`;
        }
        if (carrier) {
            params.push(carrier);
            q += ` AND carrier = $${params.length}`;
        }
        if (delivery_status) {
            params.push(delivery_status);
            q += ` AND delivery_status = $${params.length}`;
        }
        if (date) {
            params.push(date);
            q += ` AND DATE(sent_at) = $${params.length}::date`;
        }

        q += ` ORDER BY sent_at DESC`;

        if (limit) {
            params.push(limit);
            q += ` LIMIT $${params.length}`;
        }
        if (offset) {
            params.push(offset);
            q += ` OFFSET $${params.length}`;
        }

        try {
            const result = await pool.query(q, params);
            return result.rows;
        } catch (err) {
            console.log(err);
            throw err;
        }
    }

    // Find notifications by date range
    async findByDateRange({ user_id, start_date, end_date, limit, offset }) {
        let q = `SELECT * FROM ${this.table} 
                 WHERE user_id = $1 
                 AND sent_at >= $2::date 
                 AND sent_at < $3::date + INTERVAL '1 day'
                 ORDER BY sent_at DESC`;

        const params = [user_id, start_date, end_date];
        if (limit) {
            params.push(limit);
            q += ` LIMIT $${params.length}`;
        }
        if (offset) {
            params.push(offset);
            q += ` OFFSET $${params.length}`;
        }

        try {
            const result = await pool.query(q, params);
            return result.rows;
        } catch (err) {
            console.log(err);
            throw err;
        }
    }

        async findByTimeRange({ user_id, date, start_time, end_time, limit, offset }) {
        let q = `SELECT * FROM ${this.table} 
                 WHERE user_id = $1 
                 AND DATE(sent_at) = $2::date
                 AND TIME(sent_at) BETWEEN $3::time AND $4::time
                 ORDER BY sent_at DESC`;

        const params = [user_id, date, start_time, end_time];
        if (limit) {
            params.push(limit);
            q += ` LIMIT $${params.length}`;
        }
        if (offset) {
            params.push(offset);
            q += ` OFFSET $${params.length}`;
        }

        try {
            const result = await pool.query(q, params);
            return result.rows;
        } catch (err) {
            console.log(err);
            throw err;
        }
    }

        async findRecent({ user_id, hours, days, limit, offset }) {
        let q;
        const params = [user_id];

        if (hours) {
            q = `SELECT * FROM ${this.table} 
                 WHERE user_id = $1 
                 AND sent_at >= NOW() - INTERVAL '${hours} hours'`;
        } else if (days) {
            q = `SELECT * FROM ${this.table} 
                 WHERE user_id = $1 
                 AND sent_at >= NOW() - INTERVAL '${days} days'`;
        } else {
            q = `SELECT * FROM ${this.table} WHERE user_id = $1`;
        }

        q += ` ORDER BY sent_at DESC`;

        if (limit) {
            params.push(limit);
            q += ` LIMIT $${params.length}`;
        }
        if (offset) {
            params.push(offset);
            q += ` OFFSET $${params.length}`;
        }

        try {
            const result = await pool.query(q, params);
            return result.rows;
        } catch (err) {
            console.log(err);
            throw err;
        }
    }

/*
old funtion
// Find notifications by date range
async findByDateRange(params) {
    const q = `SELECT * FROM ${this.table} 
               WHERE user_id = $1 
               AND sent_at >= $2::date 
               AND sent_at < $3::date + INTERVAL '1 day'
               ORDER BY sent_at DESC`;
    try {
        const result = await pool.query(q, [params.user_id, params.start_date, params.end_date]);
        return result.rows;
    } catch (err) {
        console.log(err);
        throw err;
    }
}


// Find notifications by specific date
async findByDate(params) {
    const q = `SELECT * FROM ${this.table} 
               WHERE user_id = $1 
               AND DATE(sent_at) = $2::date
               ORDER BY sent_at DESC`;
    try {
        const result = await pool.query(q, [params.user_id, params.date]);
        return result.rows;
    } catch (err) {
        console.log(err);
        throw err;
    }
}


// Find notifications by time range on a specific date
async findByTimeRange(params) {
    const q = `SELECT * FROM ${this.table} 
               WHERE user_id = $1 
               AND DATE(sent_at) = $2::date
               AND TIME(sent_at) BETWEEN $3::time AND $4::time
               ORDER BY sent_at DESC`;
    try {
        const result = await pool.query(q, [
            params.user_id, 
            params.date, 
            params.start_time, 
            params.end_time
        ]);
        return result.rows;
    } catch (err) {
        console.log(err);
        throw err;
    }
}

// Find recent notifications (last N hours or days)
async findRecent(params) {
    let q, queryParams;
    
    if (params.hours) {
        q = `SELECT * FROM ${this.table} 
             WHERE user_id = $1 
             AND sent_at >= NOW() - INTERVAL '${params.hours} hours'
             ORDER BY sent_at DESC`;
        queryParams = [params.user_id];
    } else if (params.days) {
        q = `SELECT * FROM ${this.table} 
             WHERE user_id = $1 
             AND sent_at >= NOW() - INTERVAL '${params.days} days'
             ORDER BY sent_at DESC`;
        queryParams = [params.user_id];
    }
    
    try {
        const result = await pool.query(q, queryParams);
        return result.rows;
    } catch (err) {
        console.log(err);
        throw err;
    }
}
    */
    
}

export default new SentNotificationModel();


//ngrok http 3001
