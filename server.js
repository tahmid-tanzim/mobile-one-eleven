const express = require('express');
const app = express();
const request = require('request');
const axios = require('axios');
const bodyParser = require('body-parser');

const config = require('./config');
const products = require('./products');

// Set the Template Engine to ejs
app.set('view engine', 'ejs');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
    res.render('pages/index', { products: products });
});

app.post('/process-payment', (req, res) => {
    const id = parseFloat(req.body.product_id);
    const product = products.find((item) => item.id === id);
    let referenceId = Math.random().toString(35).substring(2, 15) + Math.random().toString(35).substring(2, 15);
    let callbackURL = 'http://192.168.0.124:' + config.PORT + '/payment-status/' + id + '/' + product.price + '/' + referenceId;
    // Create Order
    console.time("responseTime");
    axios({
            method: 'POST',
            url: config.API_URL + '/order',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': config.API_KEY
            },
            data: {
                'amount': product.price,
                'description': product.name,
                'failureCallbackUrl': callbackURL + '/failed',
                'cancelCallbackUrl': callbackURL + '/cancelled',
                'successCallbackUrl': callbackURL + '/success',
                'referenceId': referenceId
            }
        })
        .then(({ data, status, statusText, headers, config }) => {
            console.timeEnd("responseTime");
            console.log('PG response: ', JSON.stringify({ data, status, statusText, headers, config }, null, 2));
            res.writeHead(301, {
                Location: data.paymentUrl
            });
            res.end();
        })
        .catch(error => {
            if (error.response) {
                console.log(error.response.data, error.response.status, error.response.headers);
            } else if (error.request) {
                console.log(error.request);
            } else {
                console.log('Error', error.message);
            }
            console.log(error.config);

            res.format({
                html() {
                    const html = `<!DOCTYPE html>
                                    <html>
                                        <head>
                                            <meta charset="UTF-8">
                                            <title>Error</title>
                                            <link rel="stylesheet"
                                            href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css"
                                            integrity="sha384-BVYiiSIFeK1dGmJRAkycuHAHRg32OmUcww7on3RYdg4Va+PmSTsz/K68vbdEjh4u"
                                            crossorigin="anonymous">
                                        </head>
                                        <body>
                                            <div class="container">
                                                <div class="row">
                                                    <pre><strong>Error:</strong> ${JSON.stringify(error, null, 2)}</pre>
                                                </div>
                                            </div>
                                        </body>
                                    </html>`;
                    res.send(html);
                }
            });
        });
});

app.get('/payment-status/:product_id/:amount/:reference_id/:status', (req, res) => {
    console.log('payment status: ', req.params.status);
    console.log('payment amount: ', req.params.amount);
    console.log('payment referenceId: ', req.params.reference_id);
    res.render('pages/payment', {
        status: req.params.status,
        amount: req.params.amount,
        reference_id: req.params.reference_id,
        product_id: req.params.product_id,
        alert_mapper: {
            success: 'success',
            failed: 'danger',
            cancelled: 'warning'
        }
    });
});

app.get('/app/status/:status', (req, res) => {
    console.log('payment status: ', req.params.status);
    res.render('pages/status', {
        status: req.params.status,
        alert_mapper: {
            primary: 'primary',
            success: 'success',
            failed: 'danger',
            cancelled: 'warning',
            info: 'info',
            secondary: 'secondary'
        }
    });
});

app.listen(config.PORT, () => console.log('Server running on port ' + config.PORT));