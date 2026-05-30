const express = require('express');
const app = express();
const path = require('path');

const formRouter = require('./routes/form');

app.set('trust proxy', 1);

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

app.use('/', formRouter);

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});

