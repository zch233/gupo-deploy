#!/usr/bin/env node

import {
  getGitBranch,
  getGitUrl,
  getLatestTag,
  getLatestTags,
  getPureVersion,
  getRemoteTags, getSaberInfo,
  publish, request,
  searchCurrentRepoPipe,
} from './lib';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import https from 'node:https';
import inquirer from 'inquirer';
import autocomplete from 'inquirer-autocomplete-prompt';

inquirer.registerPrompt('autocomplete', autocomplete);

import {
  argMode, argNewReleaseIndex,
  argReverseIndex, argTag,
  envDir,
  isAutoMode,
  isAutoModeRefresh,
  isQuicklyMode,
  releaseAs, showSaberFlow, showSaberInfo,
  verboseMode,
} from './args';

const main = () => {
  if (showSaberInfo) {
    console.log('---');
    console.log(getSaberInfo(`https://${ getGitUrl(true).replace(':', '/') }`));
    console.log('---');
    process.exit(0);
  }
  if (showSaberFlow) {
    console.log('---');
    request(`https://${ getGitUrl(true).replace(':', '/') }`).then(({ code, data }) => {
      if (code === 200) {
        const gitBranch = getGitBranch();
        const currentInfos = searchCurrentRepoPipe(gitBranch, data);
        if (currentInfos?.length === 0) {
          console.log('该分支未部署流水线');
          console.log('---');
        } else {
          currentInfos.map(info => {
            console.log(`${ info.area_name }_${ info.cluster.name }(${ info.branch }):`);
            Object.keys(info.flow).map(key => info.flow[key] && console.log(`${ key }: ${ info.flow[key] }`));
          });
          console.log('---');
        }
      } else {
        console.log('网络坏了');
        console.log('---');
      }
      process.exit(0);
    });
    return;
  }

  if (isAutoMode) {
    const gitUrlHTTP = `https://${ getGitUrl(true).replace(':', '/') }`;
    const gitBranch = getGitBranch();
    const configPath = path.join(os.homedir(), 'gupo-deploy.json');
    const isFileExist = fs.existsSync(configPath);
    let configData: Record<string, any> = {};
    if (isFileExist) {
      configData = JSON.parse(fs.readFileSync(configPath).toString());
    } else {
      fs.writeFileSync(configPath, JSON.stringify({}, null, 2), 'utf8');
    }
    let currentInfos = searchCurrentRepoPipe(gitBranch, configData[gitUrlHTTP]);
    new Promise((s) => {
      if (!currentInfos?.length || isAutoModeRefresh) {
        request(getSaberInfo(gitUrlHTTP)).then(({ code, data }) => {
          if (code === 200) {
            fs.writeFileSync(configPath, JSON.stringify({ ...configData, [gitUrlHTTP]: data }, null, 2), 'utf8');
            currentInfos = searchCurrentRepoPipe(gitBranch, data);
            if (currentInfos?.length === 0) {
              console.log('该分支未部署流水线，你可以加入 -l 参数展示所有列表');
              process.exit(0);
            }
            s('done');
          } else {
            console.log('---');
            console.log('网络坏了，你可以暂时使用 gupo-deploy --oss_tag xxx 来发布');
            console.log('---');
            process.exit(0);
          }
        });
      } else {
        s('done');
      }
    }).then(() => {
      let _currentInfo = currentInfos?.[0];
      new Promise((s) => {
        if (currentInfos?.length > 1) {
          const choices = currentInfos?.map((v: any) => ({
            name: `${ v.area_name }_${ v.cluster.name }_${ v.tags.prod?.split('-').slice(0, -1)[2] || '' }`,
            value: v,
          }));
          inquirer.prompt([{
            type: 'autocomplete',
            name: 'area',
            message: '哪儿个地区?',
            default: _currentInfo,
            pageSize: 10,
            choices,
            source: (_: any, input = '') => {
              // 根据输入过滤选项（不区分大小写）
              return choices?.filter(choice =>
                choice.name.toLowerCase().includes(input.toLowerCase()),
              );
            },
          }]).then((reanswers) => {
            _currentInfo = reanswers.area;
            s('done');
          });
        } else {
          s('done');
        }
      }).then(() => {
        getRemoteTags();
        let currentTag = (_currentInfo.tags.gray || _currentInfo.tags.prod).replace(/\(.*?\)/g, '');
        if (argReverseIndex >= 0) currentTag = currentTag.replace('gray', '');
        const gitTagsData = getLatestTags(currentTag);
        const latestTag = !!releaseAs ? `${ currentTag }${ getPureVersion(releaseAs) }` : (gitTagsData.split('\n')[0] || `${ currentTag }0.0.0`);
        publish(latestTag, !!releaseAs, verboseMode).then(() => {
          console.log(_currentInfo.flow.build.replace('current', 'history'));
          console.log(_currentInfo.flow.build);
        });
      });
    });
  } else if (isQuicklyMode) {
    getRemoteTags();
    const gitTagData = getLatestTag();
    if (gitTagData) {
      publish(gitTagData.split('.').map((v, i) => i === gitTagData.split('.').length - 1 ? v.replace(/[^0-9]/g, '') : v).join('.'));
    } else {
      console.log('未获取到当前分支下最新的标签~');
      process.exit(0);
    }
  } else {
    require('dotenv').config({ path: path.resolve(process.cwd(), envDir, `.env${ argMode ? `.${ argMode }` : '' }`) });
    console.log('当前环境为:', argMode || '默认');

    let currentTag = argTag || process.env.OSS_TAG || '';

    if (!currentTag) {
      console.log('未设置 OSS_TAG 环境变量');
      process.exit(0);
    }
    getRemoteTags();
    const currentTagSplitArray = currentTag.split('-');
    const isCurrentTagGray = currentTagSplitArray[0]?.includes('gray');
    const currentTagWithRelease = [currentTagSplitArray[0].replace('gray', '')].concat(currentTagSplitArray.slice(1)).join('-');
    const currentTagWithGray = [`${ currentTagSplitArray[0] }${ (currentTag.includes('test-') || currentTag.includes('local-')) ? '' : 'gray' }`].concat(currentTagSplitArray.slice(1)).join('-');
    if (argNewReleaseIndex >= 0) {
      let gitTagsRelease = '';
      let gitTagsGray = '';
      let gitTagsDataRelease = '';
      let gitTagsDataGray = '';
      if (isCurrentTagGray) {
        gitTagsRelease = currentTagWithRelease;
        gitTagsGray = currentTag;
      } else {
        gitTagsRelease = currentTag;
        gitTagsGray = currentTagWithGray;
      }
      gitTagsDataRelease = getLatestTags(gitTagsRelease!);
      gitTagsDataGray = getLatestTags(gitTagsGray!);
      console.log('读取成功~');
      publish({
        gray: gitTagsDataGray.split('\n')[0] || `${ gitTagsGray }0.0.0`,
        release: gitTagsDataRelease.split('\n')[0] || `${ gitTagsRelease }0.0.0`,
      }, false, true);
    } else {
      if (argReverseIndex >= 0) currentTag = isCurrentTagGray ? currentTagWithRelease : currentTagWithGray;
      const gitTagsData = getLatestTags(currentTag);
      const latestTag = !!releaseAs ? `${ currentTag }${ getPureVersion(releaseAs) }` : (gitTagsData.split('\n')[0] || `${ currentTag }0.0.0`);
      publish(latestTag, !!releaseAs, verboseMode);
    }
  }
};

main();
