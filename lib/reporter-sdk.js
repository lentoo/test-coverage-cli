import axios from 'axios';
import EventEmitter from 'events';

function getCoveageData() {
  const coverage = window.__coverage__;
  for (const key in coverage) {
    if (!coverage[key].inputSourceMap) {
      continue;
    }
    const content = coverage[key].inputSourceMap.sourcesContent[0];
    const lines = content.split('\r\n');
    const scriptLine = lines.findIndex((c) => c.startsWith('<script'));

    for (const mapKey in coverage[key].fnMap) {
      if (Object.hasOwnProperty.call(coverage[key].fnMap, mapKey)) {
        const mapItem = coverage[key].fnMap[mapKey];
        mapItem.line += scriptLine;
        mapItem.loc.start.line += scriptLine;
        mapItem.loc.end.line += scriptLine;
        mapItem.decl.start.line += scriptLine;
        mapItem.decl.end.line += scriptLine;
      }
    }

    for (const mapKey in coverage[key].statementMap) {
      if (Object.hasOwnProperty.call(coverage[key].statementMap, mapKey)) {
        const mapItem = coverage[key].statementMap[mapKey];
        mapItem.start.line += scriptLine;
        mapItem.end.line += scriptLine;
      }
    }

    for (const mapKey in coverage[key].branchMap) {
      if (Object.hasOwnProperty.call(coverage[key].branchMap, mapKey)) {
        const mapItem = coverage[key].branchMap[mapKey];
        mapItem.loc.start.line += scriptLine;
        mapItem.loc.end.line += scriptLine;
        mapItem.locations.forEach((loc) => {
          loc.start.line += scriptLine;
          loc.end.line += scriptLine;
        });
      }
    }
  }
  return coverage;
}

class Reporter extends EventEmitter {
  constructor(config) {
    super();
    this.interval = 60; // 60 seconds
    this.info = {}; // 平台发送的结构体
    this.requestFun = config.request;
    this.server = config.server;
    this.init();
  }
  init() {
    this.on('finished', this.quickSend);
    this.on('setup', (info) => {
      this.info = info;
    });
    this.bindEvents();
    this.startLoopRequest();
  }
  request(info, data) {
    console.log(info);
    return this.requestFun({
      url: this.server + '/coverage/client',
      method: 'POST',
      data: {
        info,
        data,
      },
    });
    // axios.post('http://localhost:3000/coverage/client', data);
  }
  quickSend() {
    const data = getCoveageData();
    return this.request(this.info, data);
  }
  /**
   * 开启定时上报
   */
  startTime() {
    this.time = setInterval(() => {
      this.quickSend();
    }, this.interval);
  }
  /**
   * 停止定时上报
   */
  stopTime() {
    clearInterval(this.time);
    this.time = undefined;
  }

  bindEvents() {
    // window.addEventListener("onbeforeunload", () => this.$emit('finished'))
    window.addEventListener('beforeunload', (e) => {
      this.$emit('finished');
      let confirmationMessage = '你确定离开此页面吗?';
      (e || window.event).returnValue = confirmationMessage;
      return confirmationMessage;
    });
    navigator.sendBeacon(
      'http://localhost:3000/coverage/client',
      JSON.stringify(getCoveageData())
    );
  }

  /**
   * 轮询采集服务是否开启收集
   * 
   * {
        branch: 'origin/test',
        commitHash '3e324ktrt', //前xx位
        project: 'kirin-mgr',
        start: '1664196007', // 时间戳到秒
        type: 'all', // all || Incremental
        taskId: '13324', // 平台提供id
      }
   */
  startLoopRequest() {
    // TODO: 成功开启后获取到测试平台发送的结构体
    // this.emit('setup');
    // TODO: 结束收集上报采集信息
    // this.emit('finished')
  }

  start() {
    console.log('开始收集测试数据');
    return this.requestFun({
      url: this.server + '/start-test',
      method: 'GET',
    });
  }

  end() {
    console.log('结束收集测试数据');
    this.emit('finished');
    return this.requestFun({
      url: this.server + '/end-test',
      method: 'GET',
    });
  }
}

export default Reporter;

// 自定义request
// const reporter = new Reporter({
//   server: 'http://localhost:3000',
//   request: (config) =>
//     new Promise((resolve, reject) => {
//       return axios
//         .request({
//           url: config.url,
//           method: config.method.toLowerCase(),
//           responseType: config.responseType || 'json',
//           data: config.data,
//         })
//         .then(resolve)
//         .catch(reject);
//     }),
// });
