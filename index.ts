#!/usr/bin/env node

const argModeIndex = process.argv.findIndex(v => v === '--mode');
const argTagIndex = process.argv.findIndex(v => v === '--oss_tag');
const argMode = argModeIndex >= 0 ? process.argv[argModeIndex + 1] : undefined;
const argTag = argTagIndex >= 0 ? process.argv[argTagIndex + 1] : undefined;
require("dotenv").config({path: require('path').resolve(process.cwd(), `.env${argMode ? `.${argMode}` : ''}`)});
console.log('当前环境为:', argTag || '默认（.env）');

const currentTag = argTag || process.env.OSS_TAG

if (!currentTag) {
  console.log('未设置 OSS_TAG 环境变量');
  process.exit(0);
}
const child_process = require('child_process');
const {spawn} = child_process;

const getRemoteTags = () => spawn('git', ['fetch', '--tags']);
const getLatestTags = () => spawn('git', ['tag', '-l', '--sort=-v:refname', `${currentTag}*`]);
const getAddTag = (version) => spawn('git', ['tag', '-a', version, '-m', 'deploy test version']);
const getPushTag = () => spawn('git', ['push', '--tags']);

getRemoteTags().stdout.on('end', () => {
  console.log('拉取成功~');
  let gitTagData = ''
  getLatestTags().stdout.on('data', chunk => gitTagData += chunk.toString());
  getLatestTags().stdout.on('end', () => {
    console.log('读取成功~');
    const latestTag = gitTagData.split('\n')[0] || `${currentTag}0.0.0`;
    console.log('当前最新值为:', latestTag);
    const array = latestTag.split('.');
    array.splice(-1, 1, (Number(array.slice(-1)) + 1).toString());
    console.log('即将发布为:', array.join('.'));
    getAddTag(array.join('.')).stdout.on('end', () => {
      console.log('新增成功~');
      getPushTag().stdout.on('end', () => {
        console.log('发布成功~');
      });
      getPushTag().on('error', (chunk) => {
        console.log('发布失败~');
        console.log('请手动运行 `git push --tags`');
        console.log('错误信息:', chunk.toString());
      });
    });
  });
});

