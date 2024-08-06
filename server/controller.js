import path from 'path';
import fse from 'fs-extra';
import multiparty from 'multiparty';
import { fileURLToPath } from 'url';

const __filenameNew = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filenameNew);

const extractExt = (filename) => filename.slice(filename.lastIndexOf('.'), filename.length); // 提取后缀名
const UPLOAD_DIR = path.resolve(__dirname, '..', 'target'); // 大文件存储目录

const resolvePost = (req) =>
  new Promise((resolve) => {
    let chunk = '';
    req.on('data', (data) => {
      chunk += data;
    });
    req.on('end', () => {
      resolve(JSON.parse(chunk));
    });
  });
/* 
path：文件片段路径
*/
const pipeStream = (path, writeStream) =>
  new Promise((resolve) => {
    const readStream = fse.createReadStream(path);
    readStream.on('end', () => {
      fse.unlinkSync(path);
      resolve();
    });
    /* 将 Writable 流绑定到 readable，
    使其自动切换到流动模式并将其所有数据推送到绑定的 Writable */
    readStream.pipe(writeStream);
  });

/* 
  filePath：合并后文件名
   */
// 合并切片
const mergeFileChunk = async (filePath, fileHash, size) => {
  const chunkDir = path.resolve(UPLOAD_DIR, fileHash);
  const chunkPaths = await fse.readdir(chunkDir);
  // 根据切片下标进行排序
  // 否则直接读取目录的获得的顺序可能会错乱
  chunkPaths.sort((a, b) => a.split('-')[1] - b.split('-')[1]);
  await Promise.all(
    chunkPaths.map((chunkPath, index) =>
      pipeStream(
        path.resolve(chunkDir, chunkPath),
        // 指定位置创建可写流
        fse.createWriteStream(filePath, {
          start: index * size,
          end: (index + 1) * size, //在断点续传时，需要该字段
        }),
      ),
    ),
  );
  fse.rmdirSync(chunkDir); // 合并后删除保存切片的目录
};

// 返回已上传切片列表
const createUploadedList = async (fileHash) =>
  fse.existsSync(path.resolve(UPLOAD_DIR, fileHash)) ? await fse.readdir(path.resolve(UPLOAD_DIR, fileHash)) : [];

class Controller {
  //处理切片
  async handleFormData(req, res) {
    const multipart = new multiparty.Form();

    multipart.parse(req, async (err, fields, files) => {
      if (err) {
        return;
      }
      const [chunk] = files.chunk;
      const [hash] = fields.hash; //文件片段的hash
      const [fileHash] = fields.fileHash;
      // const [filename] = fields.filename;
      const chunkDir = path.resolve(UPLOAD_DIR, fileHash);

      // 切片目录不存在，创建切片目录
      if (!fse.existsSync(chunkDir)) {
        await fse.mkdirs(chunkDir);
      }

      // fs-extra 专用方法，类似 fs.rename 并且跨平台
      // fs-extra 的 rename 方法 windows 平台会有权限问题
      // https://github.com/meteor/meteor/issues/7852#issuecomment-255767835
      await fse.move(chunk.path, path.resolve(chunkDir, hash));
      res.end('received file chunk');
    });
  }
  //合并切片
  async handleMerge(req, res) {
    const data = await resolvePost(req);
    const { fileHash, filename, size } = data;
    const filePath = path.resolve(UPLOAD_DIR, `${fileHash}${extractExt(filename)}`);
    await mergeFileChunk(filePath, fileHash, size);
    res.end(
      JSON.stringify({
        code: 0,
        message: 'file merged success',
      }),
    );
  }
  //验证是否已上传
  async handleVerifyUpload(req, res) {
    const data = await resolvePost(req);
    const { fileHash, filename } = data;
    const filePath = path.resolve(UPLOAD_DIR, `${fileHash}${extractExt(filename)}`);
    if (fse.existsSync(filePath)) {
      res.end(
        JSON.stringify({
          shouldUpload: false,
        }),
      );
    } else {
      res.end(
        JSON.stringify({
          shouldUpload: true,
          uploadedList: await createUploadedList(fileHash),
        }),
      );
    }
  }
}

export default Controller;
