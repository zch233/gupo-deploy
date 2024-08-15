import inquirer from 'inquirer';
import {spawnSync, SpawnSyncReturns} from 'node:child_process';

export const throwError = (origin: SpawnSyncReturns<Buffer>, text?: string) => {
  console.log(origin.stderr.toString());
  console.log('Error: ', text || '出错了！')
  return process.exit(0);
}
export const getRemoteTags = () => {
  const fetchData = spawnSync('git', ['fetch', '--tags'])
  if (fetchData.stderr.toString()) {
    console.log('请手动运行 `git push --tags`');
    throwError(fetchData, '拉取标签失败~')
  }
  console.log('拉取标签成功~');
  return fetchData.stdout.toString().trim()
};
export const getLatestTag = () => {
  const fetchData = spawnSync('git', ['describe'])
  if (fetchData.stderr.toString()) throwError(fetchData, '读取标签失败~')
  console.log('读取标签成功~');
  return fetchData.stdout.toString().trim()
};
export const getLatestTags = (currentTag: string) => {
  const fetchData = spawnSync('git', ['tag', '-l', '--sort=-v:refname', `${currentTag}*`])
  if (fetchData.stderr.toString()) throwError(fetchData, '读取标签失败~')
  console.log('读取标签成功~');
  return fetchData.stdout.toString().trim()
};
export const addTag = (version: string) => {
  const fetchData = spawnSync('git', ['tag', '-a', version, '-m', `${new Date().toLocaleString()}: auto deploy version`])
  if (fetchData.stderr.toString()) throwError(fetchData, '新增标签失败~')
  console.log('新增标签成功~');
  return fetchData.stdout.toString().trim()
}
export const pushTag = () => {
  const fetchData = spawnSync('git', ['push', '--tags'])
  if (fetchData.stderr.toString()) throwError(fetchData, '推送标签失败~')
  console.log('推送标签成功~');
  return fetchData.stdout.toString().trim()
};
export const pushCode = () => {
  const fetchData = spawnSync('git', ['push'])
  if (fetchData.stderr.toString()) throwError(fetchData, '推送代码失败~')
  console.log('推送代码成功~');
  return fetchData.stdout.toString().trim()
};

export const getGitUrl = (link?: boolean) => {
  const fetchData = spawnSync('git', ['remote', 'get-url', 'origin'])
  if (fetchData.stderr.toString()) throwError(fetchData, '读取git地址失败~')
  return link ? fetchData.stdout.toString().trim().replace('git@', '').replace('.git', '') : fetchData.stdout.toString().trim()
}

export const publish = async (latestTag: string | Record<string, string>, customer?: boolean, verboseMode?: boolean) => {
  let featureTag = customer ? (latestTag as string) : ''
  const _latestTag: Record<string, string> = typeof latestTag === 'string' ? {release: latestTag} : latestTag
  if (verboseMode) {
    featureTag = await showVerbose(_latestTag)
  } else if (!customer) {
    console.log('当前最新值为:', latestTag);
    featureTag = getFeatureVersion(Object.values(_latestTag)[0], 'patch')
  }
  console.log('即将发布为:', featureTag);
  addTag(featureTag)
  pushTag()
  console.log('发布成功~');
  console.log(new Date().toLocaleString());
  await new Promise(s => setTimeout(s, 1000))
  logPipeUrl(featureTag)
}

export const getFeatureVersion = (tag: string, mode: 'major' | 'minor' | 'patch') => {
  const array = tag.split('.');
  if (mode === 'patch' && array.length > 1) {
    array[array.length - 1] = (Number(array.slice(-1)) + 1).toString();
  } else if (mode === 'minor' && array.length === 3) {
    array[array.length - 2] = (Number(array.slice(-2, -1)) + 1).toString();
    array[array.length - 1] = '0'
  } else if (mode === 'major') {
    array[0] = array[0].slice(0, -1) + (Number(array[0].slice(array[0].lastIndexOf('v') + 1)) + 1).toString();
    array[array.length - 1] = '0'
    array[array.length - 2] = '0'
  }
  return array.join('.');
}

export const showVerbose = async (tag: Record<string, string>) => {
  const oldVersions = tag;
  const next: Record<string, string>  = Object.keys(oldVersions).reduce((res, key) => {
    const value = oldVersions[key]
    return {
      ...res,
      [`major${key === 'release' ? '' : `(${key})`}`]: getFeatureVersion(value, 'major'),
      [`minor${key === 'release' ? '' : `(${key})`}`]: getFeatureVersion(value, 'minor'),
      [`patch${key === 'release' ? '' : `(${key})`}`]: getFeatureVersion(value, 'patch'),
      [`custom${key === 'release' ? '' : `(${key})`}`]: `custom${key === 'release' ? '' : `(${key})`}`
    }
  }, {});
  let prompts = inquirer.createPromptModule();
  const res = await inquirer.prompt([
    {
      type: 'list',
      name: 'release',
      message: `\n当前获取到的最新版是 ${ Object.values(oldVersions).join('、') }\n你想发布哪个版本?`,
      default: getFeatureVersion(Object.values(oldVersions)[0], 'patch'),
      pageSize: 10,
      choices: [
        ...Object.keys(next).map(key => ({value: next[key], name: `${key} (${key.includes('custom') ? '...' : next[key]})`})),
        new inquirer.Separator(),
        { value: 'custom(completely)', name: 'custom completely...' },
      ],
    },
    ...Object.keys(oldVersions).map(key => ({
      type: 'input',
      name: `newVersion${key === 'release' ? '' : `(${key})`}`,
      message: '请输入你的版本号（例如2.3.3）:',
      default: getPureVersion(getFeatureVersion(oldVersions[key], 'patch')),
      when: (previousAnswer: Record<any, any>) => previousAnswer.release === `custom${key === 'release' ? '' : `(${key})`}`,
      filter: (version: string) => version.trim().replace(/^[=v]+/, ''),
      validate: (newVersion: string) => /^\d+$/.test(newVersion.split('.').join('')) ? true : '请输入正确的版本号（例如2.3.3 或 v2.3.3）',
    })),
    {
      type: 'input',
      name: 'newVersion(completely)',
      message: '请输入你完整的版本号:',
      default: getFeatureVersion(Object.values(oldVersions)[0], 'patch'),
      when: (previousAnswer) => previousAnswer.release === 'custom(completely)',
      validate: (newVersion: string) => newVersion.trim().includes('-v') ? true : '请输入正确的版本号',
    },
  ]);
  const customMap: any = {
    'custom(gray)': `${getPureTag(oldVersions.gray || '')}${res['newVersion(gray)']}`,
    'custom': `${getPureTag(oldVersions.release || '')}${res['newVersion']}`,
    'custom(completely)': res['newVersion(completely)'],
  }
  return customMap[res.release] || res.release
}

export const getPureTag = (tag: string) => tag.slice(0, tag.lastIndexOf('v') + 1)

export const getPureVersion = (tag: string) => tag.slice(tag.lastIndexOf('v') + 1)

export const logPipeUrl = (tag: string) => {
  const argPipeIndex = process.argv.findIndex(v => ['--oss_pipe', '-op'].includes(v));
  const argPipe = argPipeIndex >= 0 ? process.argv[argPipeIndex + 1] : undefined;
  const argMarginIndex = process.argv.findIndex(v => ['--oss_margin', '-om'].includes(v));
  const argMargin = argMarginIndex >= 0 ? process.argv[argMarginIndex + 1] : undefined;
  const pipe = argPipe || process.env.OSS_PIPE
  const margin = argMargin || process.env.OSS_MARGIN

  if (pipe) {
    const tagSignal = tag.split('-')[0]
    console.log(`https://flow.aliyun.com/pipelines/${pipe}/history?${tag}`)
    if (tagSignal) {
      const tagNumber = getLatestTags(tagSignal.replace('gray', '')).split('\n').length;
      console.log(`https://flow.aliyun.com/pipelines/${pipe}/builds/${tagNumber + Number(margin || 0)}`)
    }
  } else {
    const gitUrl = getGitUrl(true)
    if (gitUrl) console.log(`${gitUrl.indexOf('http') === 0 ? gitUrl : gitUrl.replace(':', '/')}/pipeline`)
  }
}
