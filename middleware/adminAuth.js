const express = require('express')

const adminMiddleware = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        
        if (user && user.role === 'admin') {
            next(); // User is an admin, proceed
        } else {
            // User is not authorized or not found
            res.status(403).json({ message: 'Access denied: Admins only.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error during role check' });
    }
};