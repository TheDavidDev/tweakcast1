const express = require('express')
const app = express();
const bodyParser = require('body-parser')
const cors = require('cors')
const axios = require('axios');
const { response } = require('express');

const port = process.env.PORT || 3000
require('dotenv').config()
const corsOptions = {
    exposedHeaders: 'Authorization',
};
app.use(cors(corsOptions));
app.use(bodyParser.json())
app.set('view engine', 'ejs')
app.use(express.static('public'));
let token = '';
const localDB = []

const KLARNA_API_ENDPOINT='https://api.playground.klarna.com'
const KLARNA_USERNAME='PK37038_984cc1e6eebd'
const KLARNA_PASSWORD='pRJJCMQitPSm4879'

app.get('/payment/:order_id', (req, res) => {
    if (localDB.length) {
        const paymentData = localDB.find(order => order.order_id === req.params.order_id)
        if (Object.keys(paymentData).length) {
            res.render('payment', { data: paymentData.html_snippet })
        } else {
            res.send({ status: "error" })
        }
    } else {
        res.send({ status: "error" })
    }
});

app.get('/confirmation', (req, res) => {

    axios.get(`${KLARNA_API_ENDPOINT}/checkout/v3/orders/${req.query.klarna_order_id}`, {
        headers: {
            Authorization: token
        }
    })
        .then(function (response) {
            res.render('confirmation', { data: response.data.html_snippet })
        })
        .catch(function (error) {
            console.log(error);
            res.send({ status: "error" })
        });
})

app.post('/payment', (req, res) => {
    axios.post(`${KLARNA_API_ENDPOINT}/checkout/v3/orders`, req.body, {
        headers: { 'content-type': 'application/json' },
        auth: {
            username: KLARNA_USERNAME,
            password: KLARNA_PASSWORD,
        }
    })
        .then(function (response) {
            localDB.push(response.data)
            console.log("Data", response.data);
            token = 'Basic' + response['request']['_header'].split("Basic")[1].split("==")[0] + '=='
            res.send({ status: "success", order_id: response.data.order_id })
        })
        .catch(function (error) {
            res.send({ status: "error" })
        });
});


app.listen(port, () => console.log(`listening at ${port}`));
