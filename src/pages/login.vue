<template>
  <div>
    <input type="file" @change="handleFileChange" :disabled="state.status !== Status.wait" />
    <el-button @click="handleUpload" :disabled="uploadDisabled">上传</el-button>
    <div>计算文件 hash</div>
    <el-progress :percentage="state.hashPercentage"></el-progress>
    <div>总进度</div>
    <el-progress :percentage="state.fakeUploadPercentage"></el-progress>
    <el-button @click="handleResume" v-if="state.status === Status.pause">恢复</el-button>
    <el-button v-else :disabled="state.status !== Status.uploading || !state.container.hash" @click="handlePause"
      >暂停</el-button
    >
    <el-table :data="state.data">
      <el-table-column prop="hash" label="切片hash" align="center"></el-table-column>
      <el-table-column label="大小(KB)" align="center" width="120">
        <template v-slot="{ row }">
          {{ row.size }}
        </template>
      </el-table-column>
      <el-table-column label="进度" align="center">
        <template v-slot="{ row }">
          <el-progress :percentage="row.percentage" color="#909399"></el-progress>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, watch } from 'vue';
import { ElMessage } from 'element-plus';
const SIZE = 10 * 1024 * 1024; // 切片大小
const Status = {
  wait: 'wait',
  pause: 'pause',
  uploading: 'uploading',
};

const initialState = {
  //存储文件
  container: {
    file: null,
    hash: '',
    worker: null,
  },
  //存储切片后的文件
  data: [],
  //计算hash进度
  hashPercentage: 0,
  // 当暂停时会取消 xhr 导致进度条后退
  // 为了避免这种情况，需要定义一个假的进度条
  fakeUploadPercentage: 0,
  Status,
  status: Status.wait,
  requestList: [], //存储文件切片HTTP请求
};

const state = reactive<any>({ ...initialState });

const uploadDisabled = computed(() => {
  return !state.container.file || [Status.pause, Status.uploading].includes(state.status);
});

//真实进度条
const uploadPercentage = computed(() => {
  if (!state.container.file || !state.data.length) return 0;
  const loaded = state.data.map((item: any) => item.size * item.percentage).reduce((acc: any, cur: any) => acc + cur);
  return parseInt((loaded / state.container.file.size).toFixed(2));
});

watch(uploadPercentage, (now) => {
  if (now > state.fakeUploadPercentage) {
    //呈现的进度条
    state.fakeUploadPercentage = now;
  }
});

const handlePause = () => {
  state.status = Status.pause;
  resetData();
};

const resetData = () => {
  state.requestList.forEach((xhr: any) => xhr?.abort());
  state.requestList = [];
  if (state.container.worker) {
    state.container.worker.onmessage = null;
  }
};

const handleResume = async () => {
  state.status = Status.uploading;
  //uploadedList：已上传文件切片列表
  const { uploadedList } = await state.verifyUpload(state.container.file.name, state.container.hash);
  await uploadChunks(uploadedList);
};

const handleFileChange = (e: any) => {
  const [file] = e.target.files;
  if (!file) return;
  resetData();
  //重置state
  Object.assign(state, initialState);
  state.container.file = file;
};

const request = ({ url, method = 'post', data, headers = {}, onProgress = (e: any) => e, requestList }: any) => {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = onProgress;
    xhr.open(method, url);
    Object.keys(headers).forEach((key) => xhr.setRequestHeader(key, headers[key]));
    xhr.send(data);
    xhr.onload = (e: any) => {
      // 将请求成功的 xhr 从列表中删除
      if (requestList) {
        const xhrIndex = requestList.findIndex((item: XMLHttpRequest) => item === xhr);
        requestList.splice(xhrIndex, 1);
      }
      resolve({
        data: e.target.response,
      });
    };
    //将当前请求存入this.requestList中
    requestList?.push(xhr);
  });
};

const handleUpload = async () => {
  if (!state.container.file) return;
  state.status = Status.uploading;
  const fileChunkList = createFileChunk(state.container.file);
  state.container.hash = await calculateHash(fileChunkList);
  const { shouldUpload, uploadedList } = await verifyUpload(state.container.file.name, state.container.hash);
  if (!shouldUpload) {
    state.status = Status.wait;
    ElMessage({
      message: '秒传：上传成功',
      type: 'success',
    });
    return;
  }
  state.data = fileChunkList.map(({ file }: any, index: any) => ({
    chunk: file,
    index,
    hash: state.container.hash + '-' + index, // 文件名 + 数组下标
    percentage: uploadedList.includes(index) ? 100 : 0, //已上传的切片的进度为100%
    size: file.size,
  }));
  await uploadChunks(uploadedList);
};

// 生成文件切片
const createFileChunk = (file: any, size = SIZE) => {
  const fileChunkList = [];
  let cur = 0;
  while (cur < file.size) {
    fileChunkList.push({ file: file.slice(cur, cur + size) });
    cur += size;
  }
  return fileChunkList;
};

// 上传切片，同时过滤已上传的切片（通过内容生成的hash名判断）
const uploadChunks = async (uploadedList: any) => {
  const requestList = state.data
    .filter(({ hash }: any) => !uploadedList.includes(hash))
    .map(({ chunk, hash, index }: any) => {
      const formData = new FormData();
      formData.append('chunk', chunk);
      formData.append('hash', hash);
      formData.append('filename', state.container.file.name);
      formData.append('fileHash', state.container.hash);
      return { formData, index };
    })
    .map(async ({ formData, index }: any) =>
      request({
        url: 'http://localhost:3001',
        data: formData,
        onProgress: createProgressHandler(state.data[index]),
        requestList: state.requestList,
      }),
    );
  await Promise.all(requestList); // 并发切片
  // 之前上传的切片数量 + 本次上传的切片数量 = 所有切片数量时
  // 合并切片
  if (uploadedList.length + requestList.length === state.data.length) {
    await mergeRequest();
  }
};

//生成合并文件请求
const mergeRequest = async () => {
  await request({
    url: 'http://localhost:3001/merge',
    headers: {
      'content-type': 'application/json',
    },
    data: JSON.stringify({
      filename: state.container.file.name,
      fileHash: state.container.hash,
      size: SIZE,
    }),
  });
  ElMessage({
    message: '上传成功',
    type: 'success',
  });
  state.status = Status.wait;
};

// 根据 hash 验证文件是否曾经已经被上传过
// 没有才进行上传
const verifyUpload = async (filename: string, fileHash: string) => {
  const data = await request({
    url: 'http://localhost:3001/verify',
    headers: {
      'content-type': 'application/json',
    },
    data: JSON.stringify({
      filename,
      fileHash,
    }),
  });
  return JSON.parse((data as any).data);
};

// 生成文件 hash（web-worker）
const calculateHash = (fileChunkList: { file: any }[]) => {
  return new Promise((resolve) => {
    state.container.worker = new Worker('/hash.js');
    state.container.worker.postMessage({ fileChunkList });
    state.container.worker.onmessage = (e: any) => {
      const { percentage, hash } = e.data;
      //接收计算文件hash进度
      state.hashPercentage = percentage;
      if (hash) {
        resolve(hash);
      }
    };
  });
};

// 用闭包保存每个 chunk 的进度数据
const createProgressHandler = (item: { percentage: number }) => {
  return (e: { loaded: number; total: number }) => {
    item.percentage = parseInt(String((e.loaded / e.total) * 100));
  };
};
</script>

<style lang="scss">
body {
  color: $test-color;
}
</style>
