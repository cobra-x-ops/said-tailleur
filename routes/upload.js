const express = require('express');
const router = express.Router();
const upload = require('../config/upload');

router.post('/', (req, res) => {
    upload.single('image')(req, res, (err) => {
        if (err) {
            return res.status(400).json({
                success: false,
                message: err
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file selected!'
            });
        }

        // Return the path relative to the server (accessible via http://localhost:3030/uploads/filename)
        res.status(200).json({
            success: true,
            message: 'File Uploaded!',
            filePath: `http://localhost:3030/uploads/${req.file.filename}`
        });
    });
});

module.exports = router;
