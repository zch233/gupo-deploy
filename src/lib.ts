import inquirer from 'inquirer';
import {spawn} from 'child_process';

export const getRemoteTags = () => spawn('git', ['fetch', '--tags']);
export const getLatestTag = () => spawn('git', ['describe']);
export const getLatestTags = (currentTag: string) => spawn('git', ['tag', '-l', '--sort=-v:refname', `${currentTag}*`]);
export const addTag = (version: string) => spawn('git', ['tag', '-a', version, '-m', `${new Date().toLocaleString()}: auto deploy version`]);
export const pushTag = () => spawn('git', ['push', '--tags']);
export const pushCode = () => spawn('git', ['push']);

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
  addTag(featureTag).stdout.on('end', () => {
    console.log('新增成功~');
    pushTag().stdout.on('end', async () => {
      console.log('发布成功~');
      console.log(new Date().toLocaleString());
      logPipeUrl()
      await new Promise(s => setTimeout(s, 1000))
    });
    pushTag().on('error', (chunk) => {
      console.log('发布失败~');
      console.log('请手动运行 `git push --tags`');
      console.log('错误信息:', chunk.toString());
    });
  });
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
    'custom(gray)': `${getPureTag(oldVersions.gray)}${res['newVersion(gray)']}`,
    'custom': `${getPureTag(oldVersions.release)}${res['newVersion']}`,
    'custom(completely)': res['newVersion(completely)'],
  }
  return customMap[res.release] || res.release
}

export const getPureTag = (tag: string) => tag.slice(0, tag.lastIndexOf('v') + 1)

export const getPureVersion = (tag: string) => tag.slice(tag.lastIndexOf('v') + 1)

export const logPipeUrl = () => {
  const pipe = process.env.OSS_PIPE
  if (pipe) {
    console.log(`https://flow.aliyun.com/pipelines/${pipe}/history`)
  }
}