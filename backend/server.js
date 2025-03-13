const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

app.use(cors());
app.use(bodyParser.json());

function getSign(dX, dY) {
    let signX, signY
    if (dX < 0) signX = -1
    else if ( dX > 0) signX = 1
    else signX = 0
    if (dY < 0) signY = -1
    else if ( dY > 0) signY = 1
    else signY = 0
    return {signX, signY}
}

class Line {
    constructor(X, Y) {
        this.k = Y/X
    }

    point({x, y}) {
        if (x) return x * this.k
        else return y / this.k
    }
}

app.post('/drowpoint', function(req, res) {
    res.set({
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "http://localhost:3000",
    });

    let {points, size, x, y, amount} = req.body;
    const from = {x: Math.floor((points[0].x - x) / size), y: Math.floor((points[0].y - y) / size)}
    const to = {x: Math.floor((points[1].x - x) / size), y: Math.floor((points[1].y - y) / size)}
    console.log({to, from});
    let ids = [from.x + from.y * amount];
    const dX = points[1].x - points[0].x;
    const dY = points[1].y - points[0].y;
    const {signX, signY} = getSign(dX, dY);
    console.log(dX, dY);
    console.log(signX, signY);
    const line = new Line(dX, dY);
    if (Math.abs(dX) > Math.abs(dY)) {
        for (let i = 0; i < Math.abs(to.x - from.x); i++){
            ids.push(from.x + signX * (1 + i) + Math.floor((points[0].y + line.point({x: signX * (i * size + size / 2)}) - y) / size) * amount);
        }
    } else if (Math.abs(dX) < Math.abs(dY)) {
        for (let i = 0; i < Math.abs(to.y - from.y); i++){
            console.log({y: (from.y + signY * (1 + i)), x: Math.floor((points[0].x + line.point({y: i * size + size / 2}) - x) / size)});
            ids.push((from.y + signY * (1 + i)) * amount + Math.floor((points[0].x + line.point({y: signY * (i * size + size / 2)}) - x) / size));
        }
    } else {
        for (let i = 1; i <= Math.abs(to.x - from.x); i++){
            ids.push(from.x + signX + (from.y + signY) * amount);
        }
    }

    console.log(ids);

    res.status(200).send({ids});
});

app.listen(5000);