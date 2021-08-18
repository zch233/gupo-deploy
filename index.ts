#!/usr/bin/env node

// 读取当前环境
const modeIndex = process.argv.findIndex(v => v === '--mode');
const currentMode = modeIndex >= 0 ? process.argv[modeIndex + 1] : undefined;
require("dotenv").config(currentMode && {path: require('path').resolve(process.cwd(), `.env.${currentMode}`)});
console.log('当前环境为:', currentMode);
if (!process.env.OSS_TAG) {
  console.log('未设置 OSS_TAG 环境变量');
  process.exit(0);
}
const child_process = require('child_process');
const {spawn} = child_process;

const getRemoteTags = () => spawn('git', ['fetch', '--tags']);
const getLatestTags = () => spawn('git', ['tag', '-l', '--sort=-v:refname', `${process.env.OSS_TAG}*`]);
const getAddTag = (version) => spawn('git', ['tag', '-a', version, '-m', 'deploy test version']);
const getPushTag = () => spawn('git', ['push', '--tags']);

getRemoteTags().stdout.on('end', () => {
  console.log('拉取成功~');
  getLatestTags().stdout.on('data', chunk => {
    console.log('读取成功~');
    const latestTag = chunk.toString().split('\n')[0] || `${process.env.OSS_TAG}-v0.0.0`;
    console.log('当前最新值为:', latestTag);
    const array = latestTag.split('.');
    array.splice(-1, 1, (Number(array.slice(-1)) + 1).toString());
    console.log('即将发布为:', array.join('.'));
    getAddTag(array.join('.')).stdout.on('end', () => {
      console.log('新增成功~');
      getPushTag().stdout.on('end', () => {
        console.log('发布成功~');
      });
    });
  });
});

