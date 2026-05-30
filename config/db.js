const supabase = require('./supabaseClient');

const submissions = {
    async addSubmission(attendance, fname, lname, phone) {
        try {
            if(!attendance || !fname || !lname || !phone) {
                throw new Error('All fields are required.');
            }

            const { data, error } = await supabase
                .from('grad-submissions')
                .upsert([
                    { attendance, fname, lname, phone }
                ]);
                if (error) {
                    throw error;
                }
                return data;
        } catch (error) {
            console.error('Error adding submission:', error);
            throw error;
        }
    }
}

const heartbeat = {
    async beat(day) {
        const { data, error } = await supabase
            .from('heartbeat')
            .upsert({id: 1, date_beat: day })
            .select()      
            .maybeSingle();
        if (error) throw error;
        return data;
    }
};

module.exports = {submissions, heartbeat, supabase};