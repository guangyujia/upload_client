

import express, {Request, Response, NextFunction} from 'express'
import logger from 'morgan'
import {INTERNAL_SERVER_ERROR} from 'http-status-codes'
import createError from 'http-errors'
import cors from 'cors'
import path from 'path'
import fs from 'fs-extra'
export const PUBLIC_DIR = path.resolve(__dirname, 'public')
//import { TEMP_DIR } from './utils';
export const TEMP_DIR = path.resolve(__dirname, 'temp')

let app = express()
app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(cors())
app.use(express.static(path.resolve(__dirname, 'public')))

app.post('/upload/:filename/:chunk_name', async function(req:Request, res:Response, _next:NextFunction) {
   let {filename, chunk_name} = req.params;
   let chunk_dir = path.resolve(TEMP_DIR, filename);
   let exist = await fs.pathExists(chunk_dir);
   if(!exist) {
     await fs.mkdirs(chunk_dir);
   }
   let chunkFilePath = path.resolve(chunk_dir, chunk_name);
   // flags: 'a'  append 后面做断点续传
   let ws = fs.createWriteStream(chunkFilePath, {start: 0, flags: 'a'});
   req.on('end', () => {
    ws.close();
    res.json({
        success: true
    })
   })
   req.pipe(ws);
    
})

// app.post('/upload', async function(req:Request, res:Response, next:NextFunction) {
//     console.log('1222')
//     let form = new multiparty.Form();
//     form.parse(req, async(err:any, fields, files) => {
//         if(err) {
//             return next(err)
//         }
//         let filename = fields.filename[0];
//         let chunk = files.chunk[0];
//         await fs.move(chunk.path, path.resolve(PUBLIC_DIR, filename), {overwrite: true})
//         res.json({
//             success: true
//         })
//     })
// })

app.use(function(_req:Request, _res:Response, next:NextFunction) {
    next(createError(404))
})

app.use(function(error:any, _req:Request, res:Response, _next:NextFunction) {
    res.status(error.status || INTERNAL_SERVER_ERROR)
    res.json({
        success: false,
        error
    })
})

export default app;


