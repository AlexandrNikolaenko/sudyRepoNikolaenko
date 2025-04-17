'use client'

import { useState } from "react";
import { API_HOST } from "@/lib/host";

export default function VideoAnalyze() {
    let [file, setFile] = useState(null);
    let [data, setData] = useState({data: null, isLoad: false});
    if (data.data) console.log(data.data);
    async function send(e) {
        e.preventDefault();
        try {
            let res = await fetch(`${API_HOST}/video`, {
                method: 'POST',
                body: new FormData(document.getElementById('videoForm'))
            });
            if (res.ok) {
                setData({data: await res.json(), isLoad: true});
            }
            else throw new Error(res.status);
        } catch(e) {
            console.log(e);
        }
    }

    return (
        <div className="flex wrapper w-full flex-col gap-10 items-center">
            <h2 className="text-white text-center text-7xl font-title w-fit">The sharpest frame, input your video</h2>
            <form id="videoForm" className="flex gap-5" onSubmit={send}>
                <AddFileInput name={"Загрузить файл"} setFile={setFile}/>
                <button className="px-10 py-5 rounded-[10px] bg-white text-dark border-dashed cursor-pointer disabled:opacity-50 disabled:cursor-auto" disabled={!file}>Отправить</button>
            </form>
            {
                data.isLoad && !data.data.error && (
                    <>
                        {/* <p className="text-white text-center w-fit">Text angle: {data.data.angle}</p>
                        <p className="text-white text-center w-fit">The sharpest frame: {data.data.sharpestFrame}</p> */}
                    </>
                )
            }
        </div>
    )
}

function AddFileInput({ name, accept="video/mp4", multiple=false, setFile }) {
    const [nameFile, setNameFile] = useState(name);

    return (
        <>
            <button className="py-5 px-10 rounded-[10px] text-white bg-transparent border-green-500 border-2 border-dashed cursor-pointer" onClick={
                (e) => {
                    e.preventDefault();
                    document.getElementById('addVideo').click();
                }
            }>{nameFile}</button>
            <input type="file" accept={accept} name={'video'} id={'addVideo'} placeholder="Загрузить файл" className="hidden" multiple={multiple} onChange={(e) => {
                e.preventDefault();
                let names = [];
                Array.from(e.target.files).forEach(file => names.push(file.name));
                names = names.join(', ');
                setFile(names);
                setNameFile(names);
            }} />
        </>
    )
}