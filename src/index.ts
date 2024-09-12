#!/usr/bin/env node

import { getLatestTag, getLatestTags, getPureVersion, getRemoteTags, publish, pushCode } from './lib';
import path from 'node:path';

const isQuicklyMode = process.argv.findIndex(v => ['--fast_release', '-ss'].includes(v)) >= 0;
const shouldPushCode = process.argv.findIndex(v => ['--push', '-p'].includes(v)) >= 0;
const verboseMode = process.argv.findIndex(v => ['--verbose'].includes(v)) >= 0;
const releaseAsIndex = process.argv.findIndex(v => ['--release_as', '-as'].includes(v));
const releaseAs = releaseAsIndex >= 0 ? process.argv[releaseAsIndex + 1] : undefined;

if (isQuicklyMode) {
  getRemoteTags()
  const gitTagData = getLatestTag()
  if (gitTagData) {
    publish(gitTagData.split('.').map((v, i) => i === gitTagData.split('.').length - 1 ? v.replace(/[^0-9]/g, '') : v).join('.'))
  } else {
    console.log('未获取到当前分支下最新的标签~')
    process.exit(0);
  }
} else {
  const argModeIndex = process.argv.findIndex(v => ['--mode', '-m'].includes(v));
  const argTagIndex = process.argv.findIndex(v => ['--oss_tag', '-ot'].includes(v));
  const argEnvDirIndex = process.argv.findIndex(v => ['--env_dir', '-e'].includes(v));
  const argNewReleaseIndex = process.argv.findIndex(v => ['--new_release', '-n'].includes(v));
  const argReverseIndex = process.argv.findIndex(v => ['--reverse', '-r'].includes(v));
  const argMode = argModeIndex >= 0 ? process.argv[argModeIndex + 1] : undefined;
  const argTag = argTagIndex >= 0 ? process.argv[argTagIndex + 1] : undefined;
  const envDir = argEnvDirIndex >= 0 ? process.argv[argEnvDirIndex + 1] : '';
  require("dotenv").config({path: path.resolve(process.cwd(), envDir,`.env${argMode ? `.${argMode}` : ''}`)});
  console.log('当前环境为:', argMode || '默认');

  let currentTag = argTag || process.env.OSS_TAG || ''

  if (!currentTag) {
    console.log('未设置 OSS_TAG 环境变量');
    process.exit(0);
  }
  getRemoteTags()
  const currentTagSplitArray = currentTag.split('-')
  const isCurrentTagGray = currentTagSplitArray[0]?.includes('gray')
  const currentTagWithRelease = [currentTagSplitArray[0].replace('gray', '')].concat(currentTagSplitArray.slice(1)).join('-')
  const currentTagWithGray = [`${currentTagSplitArray[0]}gray`].concat(currentTagSplitArray.slice(1)).join('-')
  if (argNewReleaseIndex >= 0) {
    let gitTagsRelease = ''
    let gitTagsGray = ''
    let gitTagsDataRelease = ''
    let gitTagsDataGray = ''
    if (isCurrentTagGray) {
      gitTagsRelease = currentTagWithRelease
      gitTagsGray = currentTag
    } else {
      gitTagsRelease = currentTag
      gitTagsGray = currentTagWithGray
    }
    gitTagsDataRelease = getLatestTags(gitTagsRelease!)
    gitTagsDataGray = getLatestTags(gitTagsGray!)
    console.log('读取成功~');
    publish({gray: gitTagsDataGray.split('\n')[0] || `${gitTagsGray}0.0.0`, release: gitTagsDataRelease.split('\n')[0] || `${gitTagsRelease}0.0.0`}, false, true)
  } else {
    if (argReverseIndex >= 0) currentTag = isCurrentTagGray ? currentTagWithRelease : currentTagWithGray
    const gitTagsData = getLatestTags(currentTag)
    const latestTag = releaseAs ? `${currentTag}${getPureVersion(releaseAs)}` : (gitTagsData.split('\n')[0] || `${currentTag}0.0.0`);
    publish(latestTag, !!releaseAs, verboseMode)
  }
}
if (shouldPushCode) pushCode()
