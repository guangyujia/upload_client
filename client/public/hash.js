self.importScripts('https://cdn.bootcss.com/spark-md5/3.0.0/spark-md5.js');
self.onmessage = async(event) => {
  let {partList} = event.data
  const spark = new self.SparkMD5.ArrayBuffer();
  let percent = 0;
  let perSize = 100 / partList.length; //每计算完一个part,相当于完成百分之多少 25%
  let buffers = await Promise.all(partList.map(({chunk, size}) => new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsArrayBuffer(chunk)
    reader.onload = function(event) {
        percent += perSize;
        self.postMessage({
            percent: Number(percent.toFixed(2))
        })
        resolve(event.target.result)
    }
  }))) 
  buffers.forEach(buffer => spark.append(buffer));
  //通知主进程，全部任务
  self.postMessage({percent: 100, hash: spark.end()})
  self.close();
}