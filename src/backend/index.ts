import { ic, nat64, Opt, Principal, text, Vec } from 'azle';
import express from 'express';

const app = express();
app.use(express.json());

let messages: Vec<{ user: text; message: text; timestamp: nat64 }> = [];

// /whoami 엔드포인트
app.get('/whoami', (req, res) => {
    res.send(ic.caller().toString());
});

// /messages 엔드포인트 - GET
app.get('/messages', (req, res) => {
    res.json(messages);
});

// /messages 엔드포인트 - POST
app.post('/messages', (req, res) => {
    const { user, message } = req.body;
    const timestamp = BigInt(Date.now());
    messages.push({ user, message, timestamp });
    res.sendStatus(200);
});

app.use(express.static('/dist'));

app.listen();
