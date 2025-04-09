'use client'

import { useState } from "react"
import { API_HOST } from "../lib/host";

export default function ImageProc() {
    let [data, setData] = useState({data: null, isLoad: false});
    let [file, setFile] = useState(null);
    async function send(e) {
        e.preventDefault();
        try {
            let res = await fetch(`${API_HOST}/img`, {
                method: 'POST',
                body: new FormData(document.getElementById('fileForm'))
            });
            if (res.ok) {
                let points = (await res.json()).points
                console.log(points)
                setData({data: points, isLoad: true});
            }
            else throw new Error(res.status);
        } catch(e) {
            console.log(e);
        }
    }
    return (
        <div className="flex wrapper w-full flex-col gap-10 items-center">
            <h2 className="text-white text-7xl font-title w-fit">See your image by line</h2>
            <form id="fileForm" className="flex gap-5" onSubmit={send}>
                <AddFileInput name={"Загрузить файл"} setFile={setFile}/>
                <button className="px-10 py-5 rounded-[10px] bg-white text-dark border-dashed cursor-pointer disabled:opacity-50 disabled:cursor-auto" disabled={!file}>Отправить</button>
            </form>
            {
                data.isLoad &&
                <Canvas data={data.data}/>
            }
        </div>
    )
}

function AddFileInput({ name, accept=".jpg", multiple=false, setFile }) {
    const [nameFile, setNameFile] = useState(name);

    return (
        <>
            <button className="py-5 px-10 rounded-[10px] text-white bg-transparent border-green-500 border-2 border-dashed cursor-pointer" onClick={
                (e) => {
                    e.preventDefault();
                    document.getElementById('addFile').click();
                }
            }>{nameFile}</button>
            <input type="file" accept={accept} name={'file'} id={'addFile'} placeholder="Загрузить файл" className="hidden" multiple={multiple} onChange={(e) => {
                e.preventDefault();
                let names = [];
                Array.from(e.target.files).forEach(file => names.push(file.name));
                names = names.join(', ');
                setFile(names)
                setNameFile(names);
            }} />
        </>
    )
}

function Canvas({data}) {
    return (
        <div className="w-full flex flex-col items-center">
            {data.map(line => <PointLine key={line.id} data={line.line}/>)}
        </div>
    )
}

function PointLine({data}) {
    return (
        <div className="w-full flex flex-nowrap">
            {data.map(point => <Point key={point.id} isActive={point.isActive}/>)}
        </div>
    )
}

function Point({isActive}) {
    return (
        <div className={`w-full ${isActive ? 'bg-transparent' : 'bg-white'} aspect-square`}></div>
    )
}