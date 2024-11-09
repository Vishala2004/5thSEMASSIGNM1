
const express = require('express');
const bodyParser = require('body-parser');
const Queue = require('./queues/Queue');
const PriorityQueue = require('./queues/PriorityQueue');
const Stack = require('./stacks/Stack');
const { generateInvoice } = require('./fileHandling/fileOperations');

const app = express();
const port = 3000;

const paymentQueue = new Queue();
const priorityQueue = new PriorityQueue();
const transactionHistory = new Stack();

app.use(bodyParser.json());


app.post('/api/payments', (req, res) => {
    const { customerName, address, type, amount, urgent } = req.body;

    const request = {
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        customerName,
        address,
        type,
        amount,
        urgent
    };

    if (urgent) {
        priorityQueue.enqueue(request, 1);
    } else {
        paymentQueue.enqueue(request);
    }

    res.json({ message: "Payment request added", request });
});

app.post('/api/payments/process', (req, res) => {
    try {
        while (!priorityQueue.isEmpty() || !paymentQueue.isEmpty()) {
            let request;

            if (!priorityQueue.isEmpty()) {
                request = priorityQueue.dequeue();
            } else {
                request = paymentQueue.dequeue();
            }

            console.log("Processing request:", request);
            processTransaction(request);
        }
        res.json({ message: "All payments processed." });
    } catch (error) {
        console.error("Error processing payments:", error);
        res.status(500).json({ message: "Error processing payments", error });
    }
});

function processTransaction(request) {
    try {
        generateInvoice(request);
        transactionHistory.push(request); 
    } catch (error) {
        console.error("Error in processTransaction:", error);
        throw error; 
    }
}


app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
