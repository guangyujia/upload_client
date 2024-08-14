import React, { ChangeEvent, useEffect, useState } from 'react'
import {Row, Col, Input, Button, message } from 'antd'
import {request} from './utils'
const DEFAULT_SIZE = 1024 * 1024 * 100

interface Part {
    chunk: Blob
    size: number
    filename?: string
    chunk_name?: string
}

const Upload = function() {
    let [currentFile, setCurrentFile] = useState<File>()
    let [objectURL, setObjectURL] = useState<string>('')
    let [hashPercent, setHashPercent] = useState<number>(0)
    let [filename, setFilename] = useState<string>('')
    let [partList, setPartList] = useState<Part[]>([])
    const handleChange = (event:ChangeEvent<HTMLInputElement>) => {
        let file:File = event.target.files![0];
        setCurrentFile(file)
        console.log('file', file)
    }
    useEffect(() => {
        // if (currentFile) {
        //     let objectURL = window.URL.createObjectURL(currentFile)
        //     setObjectURL(objectURL)
        // }
        // return () => {
        //     window.URL.revokeObjectURL(objectURL)
        // }
        if (currentFile) {
            const reader = new FileReader();
            reader.addEventListener('load', () => setObjectURL(reader.result as string));
            reader.readAsDataURL(currentFile)
        }
        
    }, [currentFile]);
    const allowUpload = (file: File) => {
        let isValidFileType = ['image/jpeg', 'image/jpg','image/png', 'image/gif', 'video/mp4'].includes(file.type)
        if(!isValidFileType) {
            message.error('不支持此类文件上传')
        }
        const isLessThan2G = file.size < 1024 * 1024 * 1024 * 2
        if(!isLessThan2G) {
            message.error('此类文件不能大于2g')
        }
        return isValidFileType && isLessThan2G;
    }
    const  handleUpload = async() => {
        if(!currentFile) {
            return message.error('尚未选择文件')
        }
        if(!allowUpload(currentFile)) {
            return message.error('不支持此类文件上传')
        }
        //分片上传
        let partList:Part[] = createChunks(currentFile)
        // 计算这个对象的hash，秒传的功能 通过webworker子进程计算hash
        let fileHash = await calculateHash(partList);
        let lastDotIndex = currentFile.name.lastIndexOf('.'); //dog.jpg
        let extName = currentFile.name.slice(lastDotIndex);//.jpg
        let filename = `${fileHash}${extName}` //hash.jpg
        setFilename(filename);
        partList.forEach((item, index) => {
            item.filename = filename;
            item.chunk_name = `${filename}${index}`
        })
        setPartList(partList)
        await uploadParts(partList, filename);
        // let formData = new FormData();
        // formData.append('chunk', currentFile);
        // formData.append('filename', currentFile.name);
        // let result = await request({
        //     url: '/upload',
        //     method: 'POST',
        //     data: formData
        // })
        // message.info('上传成功')
        // console.log('result', result)
    }
    async function uploadParts(partList:Part[], filename: string) {
        let requests = createRequests(partList, filename);
        await Promise.all(requests);
    }
    function createRequests(partList: Part[], filename: string) {
        return partList.map((part: Part) => request({
            url:  `/upload/${filename}/${part.chunk_name}`,
            method: 'POST',
            headers: {'Content-Type': 'application/octet-stream'},
            data: part.chunk
        }))
    }
    function calculateHash(partList: Part[]) {
        return new Promise(function(resolve) {
            let worker = new Worker('/hash.js')
            worker.postMessage({partList})
            worker.onmessage = function(event) {
                let {percent, hash} = event.data;
                console.log('percent', percent);
                setHashPercent(percent)
                if(hash) {
                    resolve(hash)
                }
            }

        })
    }
    function createChunks(file: File): Part[] {
         let current = 0;
         let partList: Part[] = [];
         while(current < file.size) {
            let chunk = file.slice(current, current + DEFAULT_SIZE);
            partList.push({
                chunk,
                size: chunk.size
            })
            current += DEFAULT_SIZE;
         }
         return partList;
    }
    return (<div>
        <Row>
            <Col span={12}>
                <Input type='file' style={{width: 300}} onChange={handleChange}/>
                <Button type='primary' onClick={handleUpload} style={{marginLeft: 10}}>上传</Button>
            </Col>
            <Col span={12}>
                {objectURL && <img alt='' src={objectURL} style={{width: 100}}/>}
            </Col>
        </Row>
    </div>)
    }

export default Upload;