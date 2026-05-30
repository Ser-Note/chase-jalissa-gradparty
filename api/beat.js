const { heartbeat } = require('../config/db');

module.exports = async function handler(req, res) {
    try {
        const day = new Date().toISOString().split('T')[0];
        const data = await heartbeat.beat(day);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
