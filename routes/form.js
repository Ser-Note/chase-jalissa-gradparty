const express = require('express');
const router = express.Router();
const submissions = require('../config/db').submissions;

router.get('/', (req, res) => {
    return res.render('form', {
        title: 'Grad Party Form Page'
    });
});

router.post('/', (req, res) => {
    const { attendance, fname, lname, phone } = req.body || {};

    if(!attendance || !fname || !lname || !phone) {
        console.log('Missing fields in form submission');
        return res.status(400).json({
            ok: false,
            message: 'All fields are required.'
        });
    } 

    const phoneDigits = phone.replace(/\D/g, '');

    if (phoneDigits.length !== 10) {
        console.log('Invalid phone number format:', phone);
        return res.status(400).json({
            ok: false,
            message: 'Phone number must contain exactly 10 digits.'
        });
    }

    submissions.addSubmission(attendance, fname, lname, phoneDigits)
        .then(() => {
            console.log('Submission added successfully');
            return res.status(200).json({
                ok: true,
                message: 'Submission successful!',
                submission: {
                    attendance,
                    fname,
                    lname,
                    phone: phoneDigits
                }
            });
        })
        .catch((error) => {
            console.error('Error adding submission:', error);
            return res.status(500).json({
                ok: false,
                message: 'An error occurred while processing your submission.'
            });
        });

});
module.exports = router;