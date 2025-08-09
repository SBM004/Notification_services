export const getPlaceholderStringForArray = (arr) => {
    if (!Array.isArray(arr)) {
        throw new Error('Invalid input');
    }

    // if is array, we'll clone the arr 
    // and fill the new array with placeholders
    const placeholders = [...arr];
    return placeholders.fill('?').join(', ').trim();
}

export const multipleColumnSet = (object) => {
    if (typeof object !== 'object' || object === null) {
        throw new Error('Invalid input: expected non-null object');
    }

    const keys = Object.keys(object);
    
    if (keys.length === 0) {
        throw new Error('Object cannot be empty');
    }

    const values = Object.values(object);

    // PostgreSQL uses $1, $2, $3... instead of ?
    const columnSet = keys.map((key, index) => `${key} = $${index + 1}`).join(', ');

    return {
        columnSet,
        values
    };
};

// Alternative version with more descriptive property names
export const multipleColumnSetDetailed = (object) => {
    if (typeof object !== 'object' || object === null) {
        throw new Error('Invalid input: expected non-null object');
    }

    const keys = Object.keys(object);
    
    if (keys.length === 0) {
        throw new Error('Object cannot be empty');
    }

    const values = Object.values(object);

    // Create column string for PostgreSQL
    const column = keys.map((key, index) => `${key} = $${index + 1}`).join(', ');

    return {
        column,  // This matches what your updateByEmail expects
        values
    };
};


export const multipleColumncommon = (object) => {
    if (typeof object !== 'object' || object === null) {
        throw new Error('Invalid input: expected non-null object');
    }

    const keys = Object.keys(object);
    
    if (keys.length === 0) {
        throw new Error('Object cannot be empty');
    }

    const values = Object.values(object);

    // Create column names and placeholders for INSERT
    const columns = keys.join(', ');
    const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ');

    return {
        columns,        // "name, email, role"
        placeholders,   // "$1, $2, $3"
        values         // ['John', 'john@example.com', 'admin']
    };
};
// Example usage and expected output:
/*
Input: { name: 'John', email: 'john@example.com', age: 25 }

MySQL version would output:
{
  columnSet: 'name = ?, email = ?, age = ?',
  values: ['John', 'john@example.com', 25]
}

PostgreSQL version outputs:
{
  columnSet: 'name = $1, email = $2, age = $3',
  values: ['John', 'john@example.com', 25]
}
*/