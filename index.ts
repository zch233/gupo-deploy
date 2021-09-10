#!/usr/bin/env node

import { getLatestTag, getLatestTags, getRemoteTags, publish } from './lib';

const isQuicklyMode = process.argv.findIndex(v => v === '-ss') >= 0;

if (isQuicklyMode) {
  getRemoteTags().stdout.on('end', () => {
    console.log('拉取成功~');
    let gitTagData = ''
    getLatestTag().stdout.on('data', chunk => gitTagData += chunk.toString())
    getLatestTag().stdout.on('end', () => {
      if (gitTagData) {
        publish(gitTagData)
      } else {
        console.log('未获取到当前分支下最新的标签~')
        process.exit(0);
      }
    })
  });
} else {
  const argModeIndex = process.argv.findIndex(v => v === '--mode');
  const argTagIndex = process.argv.findIndex(v => v === '--oss_tag');
  const argMode = argModeIndex >= 0 ? process.argv[argModeIndex + 1] : undefined;
  const argTag = argTagIndex >= 0 ? process.argv[argTagIndex + 1] : undefined;
  require("dotenv").config({path: require('path').resolve(process.cwd(), `.env${argMode ? `.${argMode}` : ''}`)});
  console.log('当前环境为:', argMode || '默认（.env）');

  let currentTag = argTag || process.env.OSS_TAG

  if (!currentTag) {
    require("dotenv").config({path: require('path').resolve(process.cwd(), '.env.development')});
    currentTag = process.env.OSS_TAG
  }

  if (!currentTag) {
    console.log('未设置 OSS_TAG 环境变量');
    process.exit(0);
  }

  getRemoteTags().stdout.on('end', () => {
    console.log('拉取成功~');
    let gitTagsData = ''
    getLatestTags(currentTag).stdout.on('data', chunk => gitTagsData += chunk.toString());
    getLatestTags(currentTag).stdout.on('end', () => {
      console.log('读取成功~');
      const latestTag = gitTagsData || `${currentTag}0.0.0`;
      publish(latestTag)
    });
  });
}
