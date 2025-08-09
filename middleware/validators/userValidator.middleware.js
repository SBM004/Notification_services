import {body} from 'express-validator';
// import Role from '../../utils/userRoles.utils.js'

const validRoles=['admin','viewer','editor'];

const validatePasswordConfirmation = (value, {req})=> {
    if(!req.body.confirm_password){
        throw new Error('Please confirm your password');
    }

    if(value !==req.body.confirm_password){
        throw new Error('Password do not Match');
    }
    return true;
}

export const createUserSchema = [
    body('name')
        .exists()
        .withMessage('Name is required')
        .matches(/^[A-Za-z\s]+$/)
        .withMessage('Must be only alphabetical chars')
        .isLength({ min: 2 })
        .withMessage('Must be at least 2 chars long'),
    body('email')
        .exists()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Must be a valid email')
        .normalizeEmail(),
    body('role')
        .exists()
        .withMessage('Role is required')
        .isIn(validRoles)
        .withMessage('Invalid Role type'),
    body('password')
        .exists()
        .withMessage('Password is required')
        .notEmpty()
        .isLength({ min: 6 })
        .withMessage('Password must contain at least 6 characters')
        .isLength({ max: 10 })
        .withMessage('Password can contain max 10 characters'),
    body('confirm_password')
        .exists()
        .withMessage('Confirm Password is required')
        .custom(validatePasswordConfirmation)
];

export const updateUserSchema = [
    body('name')
        .optional()
        .matches(/^[A-Za-z\s]+$/)
        .withMessage('Must be only alphabetical chars')
        .isLength({ min: 2 })
        .withMessage('Must be at least 2 chars long'),
    body('email')
        .optional()
        .isEmail()
        .withMessage('Must be a valid email')
        .normalizeEmail(),
    body('role')
        .optional()
        .isIn(validRoles)
        .withMessage('Invalid Role type'),
    body('password')
        .optional()
        .isLength({ min: 6 })
        .withMessage('Password must contain at least 6 characters')
        .isLength({ max: 10 })
        .withMessage('Password can contain max 10 characters')
        .custom((value, { req }) => {
        if (req.body.confirm_password && value !== req.body.confirm_password) {
            throw new Error('Passwords do not match');
        }
        return true;
    }),
    body('confirm_password')
        .optional(),
    

    body()
        .custom(value => {
            return !!Object.keys(value).length;
        })
        .withMessage('Please provide required field to update')
        .custom(value => {
            const updates = Object.keys(value);
            const allowUpdates = ['name', 'email', 'role', 'password', 'confirm_password'];
            return updates.every(update => allowUpdates.includes(update));
        })
        .withMessage('Invalid update!')
];



export const validateLogin = [
    body('email')
        .exists()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Must be a valid email')
        .normalizeEmail(),
    body('password')
        .exists()
        .withMessage('Password is required')
        .notEmpty()
        .withMessage('Password cannot be empty')
];