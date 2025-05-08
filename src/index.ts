#!/usr/bin/env node

import {
  getGitBranch,
  getGitUrl,
  getLatestTag,
  getLatestTags,
  getPureVersion,
  getRemoteTags,
  publish,
  pushCode,
} from './lib';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import https from 'node:https'
import inquirer from 'inquirer';

const isQuicklyMode = process.argv.findIndex(v => ['--fast_release', '-ss'].includes(v)) >= 0;
const isAutoMode = process.argv.findIndex(v => ['--auto_release', '-a'].includes(v)) >= 0;
const isAutoModeRefresh = process.argv.findIndex(v => ['--auto_release_refresh', '-f'].includes(v)) >= 0;
const shouldPushCode = process.argv.findIndex(v => ['--push', '-p'].includes(v)) >= 0;
const verboseMode = process.argv.findIndex(v => ['--verbose'].includes(v)) >= 0;
const releaseAsIndex = process.argv.findIndex(v => ['--release_as', '-as'].includes(v));
const releaseAs = releaseAsIndex >= 0 ? process.argv[releaseAsIndex + 1] : undefined;
const argReverseIndex = process.argv.findIndex(v => ['--reverse', '-r'].includes(v));

if (isAutoMode) {
  const gitUrl = `https://${getGitUrl(true).replace(':', '/')}`
  const gitBranch = getGitBranch()
  const configPath = path.join(os.homedir(), 'gupo-deploy.json')
  const isFileExist = fs.existsSync(configPath)
  let configData:Record<string, any> = {}
  if (isFileExist) {
    configData = JSON.parse(fs.readFileSync(configPath).toString())
  } else {
    fs.writeFileSync(configPath, JSON.stringify({}, null, 2), 'utf8')
  }
  let currentInfos = configData[gitUrl]?.filter((v: any) => v.branch === gitBranch)
  new Promise((s) => {
    if (!currentInfos?.length || isAutoModeRefresh) {
      https.get(`https://uat-api.group-ds.com/bmo-manage-api/innerapi/saber/repo-branches?repo_url=${gitUrl}`, res => {
        let responseData = '';
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        res.on('end', () => {
          const {code, data} = JSON.parse(responseData) as {code: number, data: any[]}
          if (code === 200) {
            fs.writeFileSync(configPath, JSON.stringify({...configData, [gitUrl]: data}, null, 2), 'utf8')
            currentInfos = data.filter(v => v.branch === gitBranch)
            s('done')
            if (currentInfos.length === 0) {
              console.log('该分支未部署流水线');
              process.exit(0);
            }
          }
        });
      })
    } else {
      s('done')
    }
  }).then(() => {
    let _currentInfo = currentInfos[0]
    new Promise((s) => {
      if (currentInfos.length > 1) {
        inquirer.prompt([{
          type: 'list',
          name: 'area',
          message: '哪儿个地区?',
          default: _currentInfo,
          pageSize: 10,
          choices: currentInfos.map((v: any) => ({name: `${v.area_name}_${v.cluster.name}`, value: v}))
        }]).then((reanswers) => {
          _currentInfo = reanswers.area
          s('done')
        })
      } else {
        s('done')
      }
    }).then(() => {
      getRemoteTags()
      let currentTag = (_currentInfo.tags.gray || _currentInfo.tags.prod).replace('(.+)', '')
      if (argReverseIndex >= 0) currentTag = currentTag.replace('gray', '')
      const gitTagsData = getLatestTags(currentTag)
      const latestTag = !!releaseAs ? `${currentTag}${getPureVersion(releaseAs)}` : (gitTagsData.split('\n')[0] || `${currentTag}0.0.0`);
      publish(latestTag, !!releaseAs, verboseMode).then(() => {
        console.log(_currentInfo.flow.build)
      })
    })
  })
} else if (isQuicklyMode) {
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
    const latestTag = !!releaseAs ? `${currentTag}${getPureVersion(releaseAs)}` : (gitTagsData.split('\n')[0] || `${currentTag}0.0.0`);
    publish(latestTag, !!releaseAs, verboseMode)
  }
}
if (shouldPushCode) pushCode()
