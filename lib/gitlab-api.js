const axios = require('axios').default;

let privateToken = '';
let host = '';
let protocal = 'http';
let projectId = '';
const request = axios.create({
  timeout: 60000,
});

const get = (url, params) => {
  const link = `${protocal}://${host}/api/v4/projects/${projectId + url}`;
  console.log('request gitlab:', link);
  return request.get(link, {
    params,
    headers: {
      'PRIVATE-TOKEN': privateToken,
    },
  });
};

const getFileContent = (filepath) => {
  const url = `/repository/files/${encodeURIComponent(filepath)}`;
  return get(url, {
    ref: 'pre',
  }).then((res) => {
    const content = Buffer.from(res.data.content, 'base64').toString('utf8');
    return content;
  });
};

const setGitlabToken = (token) => {
  privateToken = token;
};

const setGitlabProtocal = (proto = 'http') => {
  protocal = proto;
};
const setGitlabHost = (h) => {
  host = h;
};
const setGitlabProjectId = (id) => {
  projectId = id;
};

module.exports = {
  setGitlabToken,
  setGitlabProtocal,
  setGitlabHost,
  setGitlabProjectId,
  get,
  getFileContent,
};
