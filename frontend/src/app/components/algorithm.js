'use client'

import { useEffect, useState, useRef } from "react"
import { API_HOST } from "./host";

export default function Algorithm() {
    const strokeAmount = 20;
    let [params, setParams] = useState({size: 0, amount: 30});
    let [ids, setIds] = useState([]);
    let list = [];
    for (let i = 0; i < strokeAmount * params.amount; i ++) list.push(i);
    let points = Array(0);

    async function send() {
        try {
            let block = document.getElementById('blocks').getBoundingClientRect();
            console.log(JSON.stringify({...params, points, strokeAmount, x: block.left, y: block.top}));
            let res = await fetch(`${API_HOST}/drowpoint`, {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*"
                },
                body: JSON.stringify({...params, points, strokeAmount, x: block.left, y: block.top})
            });
            if (res.ok) {
                const data = (await res.json()).ids
                setIds(ids.concat(data));
                console.log(data);
            }
            else throw new Error(res.status);
        } catch (e) {
            console.log(e);
        }
        points = [];
    }

    function addPoint(e) {
        console.log(points);
        points = points.concat({x: e.clientX, y: e.clientY});
        if (points.length == 2) send();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        const containerSize = document.getElementById('blocks').getBoundingClientRect().width;
        const blockSize = document.getElementsByClassName('Block')[0].getBoundingClientRect().width;
        if (params.size != blockSize && params.amount != containerSize / blockSize) {
            setParams({size: blockSize, amount: containerSize / blockSize});
        }
    })

    return (
        <section className="flex flex-col gap-10 wrapper items-center">
            <h2 className="text-white text-7xl font-title">Bresenham&apos;s algorithm</h2>
            <div id="blocks" className="max-w-full w-fit flex flex-wrap gap-0 bg-[#292929] rounded-3xl overflow-hidden">
                {list.map((id) => <Block key={id} active={ids.includes(id)} onClick={addPoint}/>)}
            </div>
        </section>
    )
}

function Block({active, onClick}) {
    return (
        <button onClick={onClick} className={`w-full max-w-10 min-w-1 aspect-square Block ${active ? 'bg-green-500' : 'bg-transparent'}`}></button>
    )
}